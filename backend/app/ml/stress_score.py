"""Tourism Energy Stress Score calculator.

Normalises multiple indicators into a 0-100 score with traffic-light
classification (NORMAL / ELEVATED / CRITICAL) and auto-generated
recommendations.

Stress Score Formula:
  raw_score = (
    (tourist_intensity * 0.30) +
    (flight_to_tourist_ratio * 0.20) +
    (temp_energy_interaction_normalized * 0.25) +
    (forecast_vs_baseline_delta * 0.25)
  ) * 100
"""

import logging
import os
from datetime import datetime
from typing import Any, Optional

import numpy as np
import pandas as pd

from app.core.database import get_supabase
from app.etl.utils import TARGET_COUNTRIES

logger = logging.getLogger(__name__)


def _min_max_scale(series: pd.Series) -> pd.Series:
    """Min-max scale a series to [0, 1]."""
    min_val = series.min()
    max_val = series.max()
    if max_val - min_val < 1e-9:
        return pd.Series(np.ones(len(series)) * 0.5)
    return (series - min_val) / (max_val - min_val)


def _load_country_data(country_code: str, year: int, month: int) -> Optional[pd.DataFrame]:
    """Load the most recent 24 months of data for a country from Supabase.

    Returns a DataFrame sorted by (year, month) or None on failure.
    """
    try:
        supabase = get_supabase()
        response = (
            supabase.table("energy_tourism_data")
            .select("*")
            .eq("country_code", country_code)
            .order("year", desc=True)
            .order("month", desc=True)
            .limit(36)
            .execute()
        )
        records = response.data or []
        if not records:
            logger.warning("No Supabase data for %s", country_code)
            return None
        df = pd.DataFrame(records)
        for col in ["year", "month"]:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce")
        df = df.sort_values(["year", "month"]).reset_index(drop=True)
        return df
    except Exception as e:
        logger.error("Failed to load data for %s: %s", country_code, e)
        return None


def get_recommendations(
    stress_level: str, contributing_factors: dict[str, float]
) -> str:
    """Auto-generate a recommendation based on stress level and factors.

    Parameters
    ----------
    stress_level : str  "NORMAL", "ELEVATED", or "CRITICAL"
    contributing_factors : dict  feature -> contribution value

    Returns
    -------
    str  recommendation text
    """
    if stress_level == "CRITICAL":
        return (
            "Activate emergency energy reserves immediately. "
            "Alert regional grid operators. "
            "Consider demand-side management measures and public awareness campaigns."
        )
    if stress_level == "ELEVATED":
        return (
            "Prepare 15-20% reserve capacity. "
            "Monitor flight arrivals and tourist accommodation data daily. "
            "Pre-cool/pre-heat buildings during off-peak hours."
        )
    return (
        "Energy demand within expected range. "
        "Standard monitoring sufficient. "
        "Run next routine ETL pipeline update."
    )


def calculate_stress_score(
    country_code: str, year: int, month: int
) -> dict[str, Any]:
    """Calculate the Tourism Energy Stress Score for a given month.

    Parameters
    ----------
    country_code : str  (e.g. "ES")
    year : int
    month : int  (1-12)

    Returns
    -------
    dict with keys:
      country_code, year, month, stress_score, stress_level,
      traffic_light, contributing_factors, recommendation
    """
    logger.info("Calculating stress score for %s %d-%02d", country_code, year, month)

    df = _load_country_data(country_code, year, month)
    if df is None or df.empty:
        return {
            "country_code": country_code,
            "year": year,
            "month": month,
            "stress_score": 0.0,
            "stress_level": "NORMAL",
            "traffic_light": "\U0001f7e2",
            "contributing_factors": {},
            "recommendation": "Insufficient data to calculate stress score.",
        }

    columns_needed = [
        "tourist_intensity", "flight_to_tourist_ratio",
        "temp_energy_interaction",
    ]
    available = [c for c in columns_needed if c in df.columns]
    missing = [c for c in columns_needed if c not in df.columns]
    if missing:
        logger.warning("Missing columns for %s: %s", country_code, missing)

    for col in available:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

    ti_normalized = _min_max_scale(df["tourist_intensity"]) if "tourist_intensity" in df.columns else pd.Series([0.5] * len(df))
    ftr_normalized = _min_max_scale(df["flight_to_tourist_ratio"]) if "flight_to_tourist_ratio" in df.columns else pd.Series([0.5] * len(df))
    tei_normalized = _min_max_scale(df["temp_energy_interaction"]) if "temp_energy_interaction" in df.columns else pd.Series([0.5] * len(df))

    energy_col = "energy_consumption_gwh"
    if energy_col in df.columns:
        recent_12 = df[energy_col].tail(12).values
        if len(recent_12) >= 3:
            baseline = np.mean(recent_12[:-3])
            recent_avg = np.mean(recent_12[-3:])
            delta = (recent_avg - baseline) / (baseline + 1e-9)
            forecast_delta_normalized = np.clip((delta + 1) / 2, 0, 1)
        else:
            forecast_delta_normalized = 0.5
    else:
        forecast_delta_normalized = 0.5

    raw_score = (
        (float(ti_normalized.iloc[-1]) * 0.30) +
        (float(ftr_normalized.iloc[-1]) * 0.20) +
        (float(tei_normalized.iloc[-1]) * 0.25) +
        (float(forecast_delta_normalized) * 0.25)
    ) * 100

    stress_score = round(float(np.clip(raw_score, 0, 100)), 2)

    if stress_score >= 75:
        stress_level = "CRITICAL"
        traffic_light = "\U0001f534"
    elif stress_score >= 50:
        stress_level = "ELEVATED"
        traffic_light = "\U0001f7e1"
    else:
        stress_level = "NORMAL"
        traffic_light = "\U0001f7e2"

    contributing_factors = {
        "tourist_intensity": round(float(ti_normalized.iloc[-1]), 4),
        "flight_to_tourist_ratio": round(float(ftr_normalized.iloc[-1]), 4),
        "temp_energy_interaction": round(float(tei_normalized.iloc[-1]), 4),
        "forecast_delta": round(float(forecast_delta_normalized), 4),
    }
    sorted_factors = dict(
        sorted(contributing_factors.items(), key=lambda x: x[1], reverse=True)[:3]
    )

    recommendation = get_recommendations(stress_level, sorted_factors)

    result = {
        "country_code": country_code,
        "year": year,
        "month": month,
        "stress_score": stress_score,
        "stress_level": stress_level,
        "traffic_light": traffic_light,
        "contributing_factors": sorted_factors,
        "recommendation": recommendation,
    }

    _upsert_stress_score(result)

    return result


def _upsert_stress_score(result: dict[str, Any]) -> None:
    """Store the stress score in the Supabase stress_scores table."""
    try:
        supabase = get_supabase()
        payload = {
            "country_code": result["country_code"],
            "year": result["year"],
            "month": result["month"],
            "stress_score": result["stress_score"],
            "stress_level": result["stress_level"],
            "contributing_factors": result.get("contributing_factors", {}),
            "recommendation": result.get("recommendation", ""),
        }
        supabase.table("stress_scores").upsert(
            payload, on_conflict="country_code,year,month"
        ).execute()
        logger.debug("Stress score upserted for %s %d-%02d",
                     result["country_code"], result["year"], result["month"])
    except Exception as e:
        logger.error("Failed to upsert stress score: %s", e)


def calculate_all_countries(year: int, month: int) -> dict[str, dict[str, Any]]:
    """Calculate stress scores for all 10 target countries.

    Returns dict of { country_code: stress_score_dict }
    """
    results: dict[str, dict[str, Any]] = {}
    for country in TARGET_COUNTRIES:
        try:
            results[country] = calculate_stress_score(country, year, month)
        except Exception as e:
            logger.error("Stress score failed for %s: %s", country, e)
            results[country] = {
                "country_code": country,
                "year": year,
                "month": month,
                "error": str(e),
            }
    return results
