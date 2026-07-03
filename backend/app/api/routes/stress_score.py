"""Stress score API routes.

Endpoints
---------
  GET /api/v1/stress-score/{country_code}  — stress score for one country/month
  GET /api/v1/stress-score/all             — stress scores for all countries
"""

import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Path, Query

from app.ml.stress_score import calculate_all_countries, calculate_stress_score

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Stress Score"])


@router.get("/stress-score/{country_code}")
async def get_stress_score(
    country_code: str = Path(..., description="Country code (e.g. ES, IT, FR)"),
    year: int = Query(default_factory=lambda: datetime.now().year, description="Year"),
    month: int = Query(default_factory=lambda: datetime.now().month, ge=1, le=12, description="Month (1-12)"),
):
    """Calculate the Tourism Energy Stress Score for a country/month."""
    country_code = country_code.upper()
    result = calculate_stress_score(country_code, year, month)
    return result


@router.get("/stress-score/all")
async def get_all_stress_scores(
    year: int = Query(default_factory=lambda: datetime.now().year, description="Year"),
    month: int = Query(default_factory=lambda: datetime.now().month, ge=1, le=12, description="Month (1-12)"),
):
    """Calculate stress scores for all 10 target countries."""
    results = calculate_all_countries(year, month)
    return {
        "year": year,
        "month": month,
        "scores": results,
    }
