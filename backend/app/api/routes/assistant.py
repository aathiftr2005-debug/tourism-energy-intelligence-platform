"""AI Assistant API route — Gemini-powered chat with local fallback.

Primary:  Google Gemini 2.0 Flash via google-genai SDK.
Fallback: Local analytics engine using tourism/energy/stress datasets
          from Supabase when Gemini is unavailable or rate-limited.
"""

import logging
from fastapi import APIRouter
from pydantic import BaseModel
from google import genai
from app.core.config import settings
from app.core.database import get_supabase
from app.services.local_assistant import generate_local_response

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/assistant", tags=["AI Assistant"])


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Send a message to the AI assistant.

    Tries Gemini 2.0 Flash first.  On any failure (quota exhaustion,
    API error, network issue) falls back to the local analytics engine
    which answers from Supabase datasets.
    """
    try:
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
            .select("country_code,year,month,tourist_nights,energy_consumption_gwh")
            .order("year", desc=True)
            .order("month", desc=True)
            .limit(20)
            .execute()
        )

        context = f"""
You are the Tourism Energy Intelligence Assistant.
You help governments and energy providers understand seasonal energy demand in European tourism regions.

Current stress score data:
{stress_data.data if stress_data.data else "No stress scores available yet"}

Recent energy and tourism data:
{etl_data.data if etl_data.data else "No ETL data available yet"}

Answer the user's question using this data. Be concise and actionable.
"""
        client = genai.Client(api_key=settings.gemini_api_key)
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=context + "\n\nUser: " + request.message,
        )
        return ChatResponse(reply=response.text)

    except Exception as e:
        error_str = str(e).lower()
        if "429" in error_str or "quota" in error_str or "resource exhausted" in error_str:
            logger.warning("Gemini quota exhausted (429) — falling back to local analytics")
        else:
            logger.error("Gemini API error: %s", e, exc_info=True)

        try:
            fallback_reply = generate_local_response(request.message)
            return ChatResponse(reply=fallback_reply)
        except Exception as fallback_e:
            logger.error("Local fallback also failed: %s", fallback_e, exc_info=True)
            return ChatResponse(
                reply=(
                    "I'm currently operating in offline mode while our AI "
                    "services are being restored. I can still help with energy "
                    "and tourism data analysis. "
                    "Please try asking about specific countries, stress scores, "
                    "or energy consumption."
                )
            )
