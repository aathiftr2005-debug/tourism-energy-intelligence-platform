"""Public API routes — protected by X-API-Key authentication.

Endpoints
---------
  GET    /api/public/forecast/{country_code}   — 12-month ensemble forecast
  GET    /api/public/stress-score/{country_code}  — latest stress score
  GET    /api/public/stress-score/all             — all countries stress scores
  GET    /api/public/regions                      — supported country list
  POST   /api/public/keys/register                — request an API key
  GET    /api/public/docs-info                    — API documentation (no auth)
"""

import logging
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Path, Query, Body
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.auth import generate_api_key, limiter, require_api_key
from app.core.database import get_supabase
from app.etl.utils import COUNTRY_COORDS, TARGET_COUNTRIES
from app.ml.forecast import generate_ensemble_forecast
from app.ml.stress_score import calculate_all_countries, calculate_stress_score

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Public API"])

COUNTRY_NAMES: dict[str, str] = {
    "DE": "Germany", "FR": "France", "ES": "Spain", "IT": "Italy",
    "AT": "Austria", "GR": "Greece", "PT": "Portugal", "NL": "Netherlands",
    "BE": "Belgium", "CZ": "Czech Republic",
}

COUNTRY_FLAGS: dict[str, str] = {
    "DE": "\U0001f1e9\U0001f1ea", "FR": "\U0001f1eb\U0001f1f7",
    "ES": "\U0001f1ea\U0001f1f8", "IT": "\U0001f1ee\U0001f1f9",
    "AT": "\U0001f1e6\U0001f1f9", "GR": "\U0001f1ec\U0001f1f7",
    "PT": "\U0001f1f5\U0001f1f9", "NL": "\U0001f1f3\U0001f1f1",
    "BE": "\U0001f1e7\U0001f1ea", "CZ": "\U0001f1e8\U0001f1ff",
}

COUNTRY_CAPITALS: dict[str, str] = {
    "DE": "Berlin", "FR": "Paris", "ES": "Madrid", "IT": "Rome",
    "AT": "Vienna", "GR": "Athens", "PT": "Lisbon", "NL": "Amsterdam",
    "BE": "Brussels", "CZ": "Prague",
}


@router.get("/public/forecast/{country_code}")
async def public_get_forecast(
    country_code: str = Path(..., description="Country code (e.g. ES, IT, FR)"),
    months_ahead: int = Query(12, ge=1, le=36),
    _: str = Depends(require_api_key),
):
    """Return ensemble forecast for a country. Requires X-API-Key header."""
    country_code = country_code.upper()
    try:
        forecast_df = generate_ensemble_forecast(country_code, months_ahead)
        if forecast_df.empty:
            return {
                "country": country_code,
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "forecast": [],
                "error": "No forecast available",
            }
        return {
            "country": country_code,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "forecast": forecast_df.to_dict(orient="records"),
        }
    except FileNotFoundError:
        raise HTTPException(status_code=503, detail="Models not trained yet")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/public/stress-score/{country_code}")
async def public_get_stress_score(
    country_code: str = Path(..., description="Country code"),
    year: int = Query(default_factory=lambda: datetime.now().year),
    month: int = Query(default_factory=lambda: datetime.now().month, ge=1, le=12),
    _: str = Depends(require_api_key),
):
    """Return the latest stress score for a country. Requires X-API-Key."""
    country_code = country_code.upper()
    result = calculate_stress_score(country_code, year, month)
    return {
        "country": country_code,
        "score": result.get("stress_score"),
        "level": result.get("stress_level"),
        "traffic_light": result.get("traffic_light"),
        "recommendation": result.get("recommendation"),
        "contributing_factors": result.get("contributing_factors"),
    }


@router.get("/public/stress-score/all")
async def public_get_all_stress_scores(
    year: int = Query(default_factory=lambda: datetime.now().year),
    month: int = Query(default_factory=lambda: datetime.now().month, ge=1, le=12),
    _: str = Depends(require_api_key),
):
    """Return stress scores for all 10 countries. Requires X-API-Key."""
    results = calculate_all_countries(year, month)
    scores = []
    for code, data in results.items():
        scores.append({
            "country": code,
            "name": COUNTRY_NAMES.get(code, code),
            "flag": COUNTRY_FLAGS.get(code, ""),
            "score": data.get("stress_score"),
            "level": data.get("stress_level"),
            "traffic_light": data.get("traffic_light"),
        })
    return {"generated_at": datetime.now(timezone.utc).isoformat(), "scores": scores}


@router.get("/public/regions")
async def public_get_regions(
    _: str = Depends(require_api_key),
):
    """Return supported countries with metadata. Requires X-API-Key."""
    regions = []
    for code in TARGET_COUNTRIES:
        coords = COUNTRY_COORDS.get(code, (0, 0))
        regions.append({
            "code": code,
            "name": COUNTRY_NAMES.get(code, code),
            "flag": COUNTRY_FLAGS.get(code, ""),
            "capital": COUNTRY_CAPITALS.get(code, ""),
            "coordinates": {"lat": coords[0], "lng": coords[1]},
        })
    return {"count": len(regions), "regions": regions}


@router.post("/public/keys/register")
@limiter.limit("5/hour")
async def public_register_key(
    request: Any,
    body: dict[str, str] = Body(...),
):
    """Register for an API key. Rate-limited to 5 requests/hour per IP.

    Body: { "name": "Your Name", "email": "your@email.com" }
    The key will be sent to the provided email address.
    """
    name = body.get("name", "").strip()
    email = body.get("email", "").strip()

    if not name or not email:
        raise HTTPException(status_code=400, detail="name and email are required")

    if "@" not in email or "." not in email:
        raise HTTPException(status_code=400, detail="Invalid email address")

    raw_key = generate_api_key(name, email)
    if raw_key is None:
        raise HTTPException(status_code=500, detail="Failed to generate API key")

    try:
        from app.core.config import settings
        sendgrid_key = settings.sendgrid_api_key
        if sendgrid_key:
            from sendgrid import SendGridAPIClient
            from sendgrid.helpers.mail import Mail

            message = Mail(
                from_email="keys@tourism-energy-intelligence.com",
                to_emails=email,
                subject="Your Tourism Energy Intelligence API Key",
                html_content=(
                    f"<p>Hi {name},</p>"
                    f"<p>Your API key has been generated:</p>"
                    f"<pre style='background:#1a1a2e;color:#00d4ff;padding:16px;border-radius:8px;font-size:18px;'>{raw_key}</pre>"
                    f"<p>Include it in requests as: <code>X-API-Key: {raw_key}</code></p>"
                    f"<p>This is the <strong>only time</strong> this key will be shown.</p>"
                ),
            )
            sg = SendGridAPIClient(sendgrid_key)
            sg.send(message)
        else:
            logger.warning("SENDGRID_API_KEY not set — key not emailed")
    except Exception as e:
        logger.error("Failed to email API key: %s", e)

    return {
        "message": f"API key has been generated and sent to {email}",
        "note": "If you provided a valid email, you will receive the key shortly.",
    }


@router.get("/public/docs-info")
async def public_docs_info():
    """Return API documentation summary. No authentication required."""
    return {
        "name": "Tourism Energy Intelligence API",
        "version": "1.0.0",
        "description": "AI-powered seasonal energy demand forecasting for European tourism regions",
        "base_url": "/api/public",
        "authentication": "X-API-Key header",
        "rate_limits": "100 requests/hour per key, 10 requests/minute per IP (unauthenticated)",
        "endpoints": {
            "GET /api/public/forecast/{country_code}": "12-month ensemble energy forecast",
            "GET /api/public/stress-score/{country_code}": "Latest stress score + traffic light",
            "GET /api/public/stress-score/all": "Stress scores for all 10 countries",
            "GET /api/public/regions": "List of supported countries with metadata",
            "POST /api/public/keys/register": "Register for an API key",
            "GET /api/public/docs-info": "This documentation (no auth required)",
        },
        "supported_countries": [
            {"code": c, "name": COUNTRY_NAMES.get(c, c)}
            for c in TARGET_COUNTRIES
        ],
    }
