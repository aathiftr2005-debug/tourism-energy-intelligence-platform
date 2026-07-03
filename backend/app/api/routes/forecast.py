"""Forecast and ML training API routes.

Endpoints
---------
  GET  /api/v1/forecast/{country_code}  — ensemble forecast for one country
  GET  /api/v1/forecast/all             — ensemble forecast for all countries
  GET  /api/v1/explainability/{country_code}  — SHAP explanation
  POST /api/v1/ml/train                 — trigger full model training
"""

import logging
from typing import Any, Optional

from fastapi import APIRouter, BackgroundTasks, Path, Query

from app.ml.explainability import generate_shap_explanation
from app.ml.forecast import forecast_all_countries, generate_ensemble_forecast
from app.ml.train import train_all_countries

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Forecast"])

_jobs: dict[str, dict[str, Any]] = {}
import uuid
from datetime import datetime


@router.get("/forecast/{country_code}")
async def get_forecast(
    country_code: str = Path(..., description="Country code (e.g. ES, IT, FR)"),
    months_ahead: int = Query(12, ge=1, le=36, description="Number of months to forecast"),
):
    """Generate an ensemble forecast for a single country."""
    country_code = country_code.upper()
    try:
        forecast_df = generate_ensemble_forecast(country_code, months_ahead)
        if forecast_df.empty:
            return {"country_code": country_code, "forecast": [], "error": "No forecast generated"}
        return {
            "country_code": country_code,
            "months_ahead": months_ahead,
            "forecast": forecast_df.to_dict(orient="records"),
        }
    except FileNotFoundError:
        return {
            "country_code": country_code,
            "error": "Models not trained yet. Run POST /api/v1/ml/train first.",
        }
    except Exception as e:
        logger.error("Forecast error for %s: %s", country_code, e)
        return {"country_code": country_code, "error": str(e)}


@router.get("/forecast/all")
async def get_all_forecasts(
    months_ahead: int = Query(12, ge=1, le=36),
):
    """Generate ensemble forecasts for all 10 target countries."""
    results = forecast_all_countries(months_ahead)
    response = {}
    for country, df in results.items():
        if isinstance(df, dict) and "error" in df:
            response[country] = {"error": df["error"]}
        elif hasattr(df, "to_dict"):
            response[country] = df.to_dict(orient="records")
        else:
            response[country] = []
    return {"months_ahead": months_ahead, "forecasts": response}


@router.get("/explainability/{country_code}")
async def get_explainability(
    country_code: str = Path(..., description="Country code"),
):
    """Return SHAP explanation for the latest prediction of a country."""
    country_code = country_code.upper()
    try:
        from app.core.database import get_supabase
        supabase = get_supabase()
        response = (
            supabase.table("energy_tourism_data")
            .select("*")
            .eq("country_code", country_code)
            .order("year", desc=False)
            .order("month", desc=False)
            .execute()
        )
        records = response.data or []
        if not records:
            return {"country_code": country_code, "error": "No data found for country"}

        import pandas as pd
        df = pd.DataFrame(records)
        for col in ["year", "month"]:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce")

        from app.ml.features import build_features
        X, _ = build_features(df)
        if X.empty:
            return {"country_code": country_code, "error": "Insufficient data for feature engineering"}

        explanation = generate_shap_explanation(country_code, X)
        return {"country_code": country_code, "explanation": explanation}
    except FileNotFoundError:
        return {
            "country_code": country_code,
            "error": "Models not trained yet. Run POST /api/v1/ml/train first.",
        }
    except Exception as e:
        logger.error("Explainability error for %s: %s", country_code, e)
        return {"country_code": country_code, "error": str(e)}


@router.post("/ml/train")
async def trigger_ml_training(background_tasks: BackgroundTasks):
    """Trigger full model training for all countries.

    Runs as a background task. Returns immediately with a job_id.
    """
    job_id = str(uuid.uuid4())
    _jobs[job_id] = {
        "job_id": job_id,
        "status": "started",
        "created_at": datetime.utcnow().isoformat(),
    }

    background_tasks.add_task(_run_training_job, job_id)

    return {
        "status": "started",
        "job_id": job_id,
        "message": "ML training pipeline triggered for all countries",
    }


def _run_training_job(job_id: str) -> None:
    """Background task: train models for all countries."""
    logger.info("Background ML training job %s started", job_id)
    try:
        summary = train_all_countries()
        _jobs[job_id]["status"] = "completed"
        _jobs[job_id]["completed_at"] = datetime.utcnow().isoformat()
        _jobs[job_id]["summary"] = {
            country: {
                k: v for k, v in info.items() if k != "model"
            }
            for country, info in summary.items()
        }
        logger.info("Background ML training job %s completed", job_id)
    except Exception as e:
        _jobs[job_id]["status"] = "failed"
        _jobs[job_id]["error"] = str(e)
        logger.error("Background ML training job %s failed: %s", job_id, e)
