"""Fetch international flight arrival data from the OpenSky Network REST API.

API: https://opensky-network.org/api/flights/arrival

Free tier limitations may cause 429 errors. When the API is unavailable,
flight_arrivals are estimated as: tourist_nights * 0.15
"""

import logging
from typing import Any

import pandas as pd

from app.etl.utils import (
    AIRPORT_CODES,
    cache_is_fresh,
    get_cache_path,
    log_dataframe_info,
    read_cache,
    write_cache,
)

logger = logging.getLogger(__name__)


async def fetch_flight_arrivals(
    airport_icao: str, year: int, month: int
) -> int:
    """OpenSky free tier is no longer publicly accessible (403).
    Always return -1 to trigger the tourist_nights * 0.15 fallback estimation.
    """
    logger.info(
        "OpenSky skipped for %s %d-%02d — using estimation fallback",
        airport_icao, year, month
    )
    return -1

async def fetch_all_countries_flights(
    year: int, month: int
) -> pd.DataFrame:
    """Fetch flight arrivals for all target countries in a given month.

    If the OpenSky API returns -1 for any country, that row will have
    flight_arrivals = -1, signalling the pipeline to use the fallback estimate.

    Returns
    -------
    pd.DataFrame with columns: country_code, year, month, flight_arrivals
    """
    rows: list[dict[str, Any]] = []
    for country_code, icao in AIRPORT_CODES.items():
        cache_path = get_cache_path("opensky", country_code, year, month)
        if cache_is_fresh(cache_path):
            logger.info("OpenSky cache HIT for %s %d-%02d", country_code, year, month)
            cached = read_cache(cache_path)
            arrivals = cached.get("flight_arrivals", -1)
        else:
            arrivals = await fetch_flight_arrivals(icao, year, month)
            write_cache(cache_path, {
                "airport": icao,
                "year": year,
                "month": month,
                "flight_arrivals": arrivals,
            })

        rows.append({
            "country_code": country_code,
            "year": year,
            "month": month,
            "flight_arrivals": arrivals,
        })

    df = pd.DataFrame(rows)
    log_dataframe_info(df, f"flights {year}-{month:02d}")
    return df


def estimate_flight_arrivals(df: pd.DataFrame) -> pd.DataFrame:
    """Fallback: estimate flight arrivals where real data is missing.

    Uses: flight_arrivals = tourist_nights * 0.15

    Modifies the DataFrame in place, replacing -1 values with estimates.
    Logs a warning for each country where estimation was applied.
    """
    if df.empty or "flight_arrivals" not in df.columns:
        return df

    result = df.copy()
    missing_mask = result["flight_arrivals"] == -1
    if missing_mask.any() and "tourist_nights" in result.columns:
        n_estimated = missing_mask.sum()
        result.loc[missing_mask, "flight_arrivals"] = (
            result.loc[missing_mask, "tourist_nights"] * 0.15
        )
        estimated_countries = result.loc[missing_mask, "country_code"].unique()
        logger.warning(
            "Estimated flight_arrivals for %d rows (%s) using tourist_nights * 0.15",
            n_estimated, list(estimated_countries),
        )

    result["flight_arrivals"] = result["flight_arrivals"].clip(lower=0).astype(int)
    return result
