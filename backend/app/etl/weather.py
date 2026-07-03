"""Fetch historical weather data from the OpenMeteo Archive API (free, no key).

API: https://archive-api.open-meteo.com/v1/archive

Monthly variables:
  - temperature_2m_mean (°C)
  - precipitation_sum (mm)
  - sunshine_duration (seconds)
"""

import logging
from datetime import datetime
from typing import Any, Optional

import httpx
import pandas as pd

from app.etl.utils import (
    cache_is_fresh,
    get_cache_path,
    log_dataframe_info,
    read_cache,
    retry_with_backoff_async,
    write_cache,
)

logger = logging.getLogger(__name__)

OPENMETEO_ARCHIVE = "https://archive-api.open-meteo.com/v1/archive"


async def fetch_weather_data(
    country_code: str,
    lat: float,
    lng: float,
    start_year: int = 2020,
    end_year: int = 2024,
) -> pd.DataFrame:
    """Fetch monthly weather data for a location from the OpenMeteo Archive.

    Parameters
    ----------
    country_code : str  (e.g. "DE")
    lat : float         latitude of capital city
    lng : float         longitude of capital city
    start_year : int
    end_year : int

    Returns
    -------
    pd.DataFrame with columns:
      country_code, year, month, temp_mean, precipitation_sum, sunshine_duration
    """
    logger.info(
        "Fetching weather data for %s (%.2f, %.2f) %d-%d",
        country_code, lat, lng, start_year, end_year,
    )

    cache_path = get_cache_path("openmeteo", country_code, start_year)
    if cache_is_fresh(cache_path):
        logger.info("OpenMeteo cache HIT for %s", country_code)
        raw = read_cache(cache_path)
    else:
        start_date = f"{start_year}-01-01"
        end_date = f"{end_year}-12-31"

        params: dict[str, str] = {
            "latitude": str(lat),
            "longitude": str(lng),
            "start_date": start_date,
            "end_date": end_date,
            "hourly": "temperature_2m,precipitation,sunshine_duration",
            "timezone": "Europe/Berlin",
        }

        async def _request() -> dict[str, Any]:
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.get(OPENMETEO_ARCHIVE, params=params)
                resp.raise_for_status()
                return resp.json()

        try:
            raw = await retry_with_backoff_async(_request)
        except Exception as e:
            logger.error("Failed to fetch weather for %s: %s", country_code, e)
            return pd.DataFrame(
                columns=[
                    "country_code", "year", "month",
                    "temp_mean", "precipitation_sum", "sunshine_duration",
                ]
            )

        write_cache(cache_path, raw)

    return _parse_openmeteo_response(raw, country_code)


def _parse_openmeteo_response(raw: dict[str, Any], country_code: str) -> pd.DataFrame:
    """Convert the OpenMeteo JSON response to a tidy monthly DataFrame."""
    monthly = raw.get("hourly")
    if not monthly:
        logger.warning("No 'hourly' key in OpenMeteo response for %s", country_code)
        return pd.DataFrame(
            columns=[
                "country_code", "year", "month",
                "temp_mean", "precipitation_sum", "sunshine_duration",
            ]
        )

    time_vals: list[str] = monthly.get("time", [])
    temp_vals: list[Optional[float]] = monthly.get("temperature_2m", [])
    precip_vals: list[Optional[float]] = monthly.get("precipitation", [])
    sun_vals: list[Optional[float]] = monthly.get("sunshine_duration", [])

    rows: list[dict[str, Any]] = []
    for i, t in enumerate(time_vals):
        try:
            dt = datetime.strptime(t, "%Y-%m-%dT%H:%M")
        except (ValueError, TypeError):
            try:
                dt = datetime.strptime(t, "%Y-%m-%d")
            except (ValueError, TypeError):
                continue
        rows.append({
            "country_code": country_code,
            "year": dt.year,
            "month": dt.month,
            "temp_mean": temp_vals[i] if i < len(temp_vals) else None,
            "precipitation_sum": precip_vals[i] if i < len(precip_vals) else None,
            "sunshine_duration": sun_vals[i] if i < len(sun_vals) else None,
        })

    df = pd.DataFrame(rows)
    if df.empty:
        logger.warning("Parsed empty weather DataFrame for %s", country_code)
        return pd.DataFrame(
            columns=[
                "country_code", "year", "month",
                "temp_mean", "precipitation_sum", "sunshine_duration",
            ]
        )

    numeric_cols = ["temp_mean", "precipitation_sum", "sunshine_duration"]
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    log_dataframe_info(df, f"weather {country_code} (hourly)")
    return df


def aggregate_to_monthly(df: pd.DataFrame) -> pd.DataFrame:
    """Aggregate hourly OpenMeteo data to monthly means / sums.

    Expects hourly rows with a ``time`` column, a single country_code.
    The column names should be ``temp_mean``, ``precipitation_sum``,
    ``sunshine_duration`` (as returned by ``_parse_openmeteo_response``).
    Resamples to calendar month-end (ME) frequency.
    """
    if df.empty:
        return df

    if "time" not in df.columns:
        logger.warning("aggregate_to_monthly: no 'time' column, returning as-is")
        return df

    cc = df["country_code"].iloc[0] if "country_code" in df.columns else "XX"

    try:
        df["date"] = pd.to_datetime(df["time"])
        monthly = (
            df.set_index("date")
            .resample("ME")
            .agg({
                "temp_mean": "mean",
                "precipitation_sum": "sum",
                "sunshine_duration": "sum",
            })
            .reset_index()
        )
    except Exception as e:
        logger.error("aggregate_to_monthly failed for %s: %s", cc, e)
        return pd.DataFrame()

    monthly["country_code"] = cc
    monthly["year"] = monthly["date"].dt.year
    monthly["month"] = monthly["date"].dt.month
    monthly = monthly.drop(columns=["date"])

    monthly = monthly[
        ["country_code", "year", "month", "temp_mean", "precipitation_sum", "sunshine_duration"]
    ]

    logger.info("aggregate_to_monthly: %d hourly rows -> %d monthly rows", len(df), len(monthly))
    return monthly
