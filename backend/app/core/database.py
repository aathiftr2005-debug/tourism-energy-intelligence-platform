"""Supabase client factory and table helpers.

Provides:
  - get_supabase() — cached Supabase client singleton (thread-safe)
  - log_etl_run()  — insert a row into etl_run_logs
  - get_last_etl_run() — fetch the most recent ETL run log
  - get_energy_tourism_data() — query the main data table
"""

import logging
import threading
from datetime import datetime, timezone
from typing import Any, Optional

from supabase import Client, create_client

from app.core.config import settings

logger = logging.getLogger(__name__)

_supabase: Client | None = None
_lock = threading.Lock()


def get_supabase() -> Client:
    """Return a cached Supabase client singleton (thread-safe)."""
    global _supabase
    if _supabase is None:
        with _lock:
            if _supabase is None:
                _supabase = create_client(
                    settings.supabase_url,
                    settings.supabase_key,
                )
    return _supabase


def log_etl_run(
    country_code: str,
    rows_inserted: int,
    status: str,
    error_message: Optional[str] = None,
) -> dict[str, Any]:
    """Insert a record into the etl_run_logs table."""
    try:
        supabase = get_supabase()
        payload = {
            "country_code": country_code,
            "rows_inserted": rows_inserted,
            "status": status,
            "error_message": error_message,
            "run_at": datetime.now(timezone.utc).isoformat(),
        }
        response = supabase.table("etl_run_logs").insert(payload).execute()
        if response.data:
            return response.data[0]
    except Exception as e:
        logger.error("Failed to log ETL run for %s: %s", country_code, e)
    return {}


def get_last_etl_run() -> dict[str, Any]:
    """Return the most recent ETL run log entry.

    Returns a dict with keys: id, run_at, country_code, rows_inserted, status
    """
    try:
        supabase = get_supabase()
        response = (
            supabase.table("etl_run_logs")
            .select("*")
            .order("run_at", desc=True)
            .limit(1)
            .execute()
        )
        if response.data:
            return response.data[0]
    except Exception as e:
        logger.error("Failed to fetch last ETL run: %s", e)
    return {}


def get_energy_tourism_data(
    country: str,
    year: int,
    month: Optional[int] = None,
) -> list[dict[str, Any]]:
    """Query energy_tourism_data with optional filters.

    Parameters
    ----------
    country : str  (e.g. "DE")
    year : int
    month : int, optional  if omitted, returns all months for the year

    Returns
    -------
    list of row dicts
    """
    try:
        supabase = get_supabase()
        query = (
            supabase.table("energy_tourism_data")
            .select("*")
            .eq("country_code", country)
            .eq("year", year)
            .order("month")
        )
        if month is not None:
            query = query.eq("month", month)

        response = query.execute()
        return response.data or []
    except Exception as e:
        logger.error("Failed to query energy_tourism_data: %s", e)
        return []
