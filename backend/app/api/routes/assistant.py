from fastapi import APIRouter
from pydantic import BaseModel
from google import genai
from app.core.config import settings
from app.core.database import get_supabase

router = APIRouter(prefix="/assistant", tags=["AI Assistant"])

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        supabase = get_supabase()
        stress_data = supabase.table("stress_scores").select("*").order("created_at", desc=True).limit(10).execute()
        etl_data = supabase.table("energy_tourism_data").select("country_code,year,month,tourist_nights,energy_consumption_gwh").order("year", desc=True).order("month", desc=True).limit(20).execute()

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
            contents=context + "\n\nUser: " + request.message
        )
        return ChatResponse(reply=response.text)

    except Exception as e:
        return ChatResponse(reply=f"Sorry, I encountered an error: {str(e)}")