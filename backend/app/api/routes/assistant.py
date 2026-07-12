"""AI Assistant API route — Conversational Gemini-powered chat with local fallback.

Primary:  Google Gemini 2.0 Flash via google-generativeai SDK.
Fallback: Local analytics engine using tourism/energy/stress datasets
          from Supabase when Gemini is unavailable or rate-limited.

Supports short conversation history (last 10 messages) for context-aware
multi-turn dialogue.  Greets users, handles TEI-specific questions via
intent detection, and falls back to Gemini for general conversation.
"""

import logging
from typing import Literal
from fastapi import APIRouter
from pydantic import BaseModel, Field
import google.generativeai as genai
from app.core.config import settings
from app.core.database import get_supabase
from app.services.local_assistant import (
    generate_local_response,
    generate_conversational_response,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/assistant", tags=["AI Assistant"])

MAX_MESSAGE_LENGTH = 2000
MAX_HISTORY = 10


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=MAX_MESSAGE_LENGTH)
    history: list[ChatMessage] = Field(default_factory=list)


class ChatResponse(BaseModel):
    reply: str


SYSTEM_PROMPT = """\
You are the Tourism Energy Intelligence (TEI) Assistant — a helpful, \
friendly, and knowledgeable AI powered by the TEI platform.

You help governments and energy providers understand seasonal energy \
demand in European tourism regions.  You can answer questions about \
energy stress scores, forecasts, tourism patterns, and country comparisons.

Personality:
- Be warm, professional, and concise.
- If the user greets you, greet them back naturally.
- If asked who you are, introduce yourself as the TEI Intelligence Assistant.
- If asked what you can do, briefly list your capabilities.
- If the user thanks you, respond politely.
- For TEI-related questions, use the provided data context to give \
  specific, actionable answers.
- For general questions, answer helpfully using your general knowledge.

Keep responses focused and under 3 paragraphs unless the user asks \
for detail."""


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Send a message to the AI assistant.

    Supports conversation history for multi-turn dialogue.
    Tries Gemini 2.0 Flash first.  On any failure falls back to the
    local analytics engine, and finally to a conversational fallback.
    """
    message = request.message.strip()
    history = request.history[-MAX_HISTORY:]

    logger.info(
        "Chat request: message=%r, history_len=%d", message, len(history)
    )

    # --- Try Gemini first ---
    if settings.gemini_api_key:
        try:
            reply = _gemini_chat(message, history)
            if reply:
                return ChatResponse(reply=reply)
        except Exception as e:
            error_str = str(e).lower()
            if "429" in error_str or "quota" in error_str or "resource exhausted" in error_str:
                logger.warning("Gemini quota exhausted — falling back")
            else:
                logger.error("Gemini error: %s", e, exc_info=True)
    else:
        logger.info("Gemini API key not configured — using local fallback")

    # --- Local data-driven fallback ---
    try:
        local_reply = generate_local_response(message)
        if local_reply:
            return ChatResponse(reply=local_reply)
    except Exception as e:
        logger.error("Local fallback failed: %s", e, exc_info=True)

    # --- Conversational fallback (always succeeds) ---
    try:
        convo_reply = generate_conversational_response(message, history)
        return ChatResponse(reply=convo_reply)
    except Exception as e:
        logger.error("Conversational fallback failed: %s", e, exc_info=True)

    # --- Last resort ---
    return ChatResponse(
        reply=(
            "I'm sorry, I'm having trouble connecting right now. "
            "Please try again in a moment. In the meantime, you can "
            "ask me about energy stress scores, forecasts, or tourism "
            "data for any European country."
        )
    )


def _gemini_chat(message: str, history: list[ChatMessage]) -> str | None:
    """Call Gemini with TEI data context and conversation history."""
    supabase = get_supabase()
    stress_data = (
        supabase.table("stress_scores")
        .select("*")
        .order("created_at", desc=True)
        .limit(10)
        .execute()
    )
    etl_data = (
        supabase.table("energy_tourism_data")
        .select(
            "country_code,year,month,tourist_nights,"
            "energy_consumption_gwh"
        )
        .order("year", desc=True)
        .order("month", desc=True)
        .limit(20)
        .execute()
    )

    data_context = f"""
Current stress score data:
{stress_data.data if stress_data.data else "No stress scores available yet"}

Recent energy and tourism data:
{etl_data.data if etl_data.data else "No ETL data available yet"}
"""

    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel(
        "gemini-2.0-flash",
        system_instruction=SYSTEM_PROMPT,
    )

    chat = model.start_chat(history=[])

    # Replay conversation history into the Gemini chat
    for msg in history:
        role = "user" if msg.role == "user" else "model"
        chat.send_message(msg.content)

    # Send the data context as a system-level preamble, then the user message
    full_message = (
        f"{data_context}\n\n"
        f"User question: {message}\n\n"
        f"Respond using the data above when relevant. "
        f"Be concise, friendly, and actionable."
    )

    response = chat.send_message(full_message)
    return response.text if response and response.text else None
