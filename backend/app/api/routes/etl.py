"""ETL API routes — trigger, monitor, and query pipeline results.

Endpoints
---------
  POST /api/v1/etl/run     — trigger the full pipeline for all countries
  GET  /api/v1/etl/status  — last ETL run summary
  GET  /api/v1/etl/data    — query merged energy-tourism data
"""

import asyncio
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, BackgroundTasks, Query

from app.core.database import (
    get_energy_tourism_data,
    get_last_etl_run,
    log_etl_run,
)
from app.etl.pipeline import run_full_pipeline
from app.etl.utils import TARGET_COUNTRIES

logger = logging.getLogger(__name__)

router = APIRouter(tags=["ETL"])

# In-memory job tracker for background runs
_jobs: dict[str, dict[str, Any]] = {}


@router.post("/etl/run")
async def trigger_etl(background_tasks: BackgroundTasks):
    """Trigger the full ETL pipeline for all 10 target countries.

    Runs as a FastAPI BackgroundTask — returns immediately with a job_id.
    """
    job_id = str(uuid.uuid4())
    _jobs[job_id] = {
        "job_id": job_id,
        "status": "started",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "countries": TARGET_COUNTRIES.copy(),
        "completed_countries": [],
        "errors": [],
    }

    background_tasks.add_task(_run_etl_job, job_id)

    return {
        "status": "started",
        "job_id": job_id,
        "message": f"ETL pipeline triggered for {len(TARGET_COUNTRIES)} countries",
    }


async def _run_etl_job(job_id: str) -> None:
    """Background task: run the pipeline for all countries."""
    logger.info("Background ETL job %s started", job_id)

    for country in TARGET_COUNTRIES:
        try:
            df = await run_full_pipeline(country)
            rows = len(df)
            log_etl_run(country, rows, "completed")
            _jobs[job_id]["completed_countries"].append(country)
            logger.info("Job %s: %s completed with %d rows", job_id, country, rows)
        except Exception as e:
            error_msg = f"{country}: {e}"
            _jobs[job_id]["errors"].append(error_msg)
            log_etl_run(country, 0, "failed", str(e))
            logger.error("Job %s: %s failed — %s", job_id, country, e)

    _jobs[job_id]["status"] = "completed"
    _jobs[job_id]["completed_at"] = datetime.now(timezone.utc).isoformat()
    logger.info("Background ETL job %s finished", job_id)


@router.get("/etl/status")
async def get_etl_status():
    """Return the last ETL run log and current job state."""
    last_run = get_last_etl_run()

    active_jobs = [
        j for j in _jobs.values() if j["status"] in ("started", "running")
    ]

    return {
        "last_run": last_run,
        "active_jobs": len(active_jobs),
        "jobs": list(_jobs.values()) if _jobs else [],
    }


@router.get("/etl/data")
async def get_etl_data(
    country: str = Query(..., description="Country code (e.g. DE, FR)"),
    year: int = Query(..., description="Year (e.g. 2024)"),
    month: Optional[int] = Query(None, ge=1, le=12, description="Month (1-12, optional)"),
):
    """Query merged energy-tourism data from Supabase.

    Returns rows filtered by country and year, with optional month filter.
    """
    rows = get_energy_tourism_data(country.upper(), year, month)
    return {
        "country": country.upper(),
        "year": year,
        "month": month,
        "count": len(rows),
        "data": rows,
    }
