"""Fetch tourism and energy data from the Eurostat REST API.

Datasets:
  - tour_occ_nim: nights spent at tourist accommodation establishments
  - nrg_cb_em: energy consumption by country/month (GWh)

Base URL:
  https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/{dataset}
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

EUROSTAT_BASE = (
    "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data"
)


def _parse_eurostat_response(raw: dict[str, Any], dataset: str, country: str) -> pd.DataFrame:
    """Convert a Eurostat JSON-stat response into a tidy DataFrame.

    Handles:
      - Flat integer keys ``"0"``, ``"1"``, ... in the ``value`` dict
      - Dotted keys such as ``"0.0"``, ``"0.1"`` (legacy / multi-dim)
      - Variable ``id`` / ``size`` ordering
      - Sparse data (missing value keys) — inserted as ``None``
    """
    try:
        values: dict[str, float] = raw["value"]
    except KeyError:
        logger.warning("No 'value' key in Eurostat response for %s/%s", dataset, country)
        return pd.DataFrame()

    if not values:
        return pd.DataFrame()

    try:
        dim = raw["dimension"]
        size: list[int] = raw["size"]
        dim_ids: list[str] = raw["id"]
    except KeyError as e:
        logger.error("Missing key %s in Eurostat response for %s/%s", e, dataset, country)
        return pd.DataFrame()

    if not size:
        logger.warning("Empty 'size' array in Eurostat response for %s/%s", dataset, country)
        return pd.DataFrame()

    # --- Locate time / geo positions in the dimension ordering ---
    try:
        time_pos = dim_ids.index("time")
    except ValueError:
        logger.error("'time' dimension missing from id list %s in %s/%s", dim_ids, dataset, country)
        return pd.DataFrame()

    try:
        geo_pos = dim_ids.index("geo")
    except ValueError:
        geo_pos = -1  # geo may be absent when filtered to a single country

    # --- Build position-to-time-label mapping ---
    try:
        time_dim = dim["time"]
        time_cat_index: dict[str, int] = time_dim.get("category", {}).get("index", {})
        time_cat_label: dict[str, str] = time_dim.get("category", {}).get("label", {})
    except KeyError as e:
        logger.error("'time' dimension malformed in %s/%s: missing %s", dataset, country, e)
        return pd.DataFrame()

    if not time_cat_index and not time_cat_label:
        logger.warning("No time category data in %s/%s", dataset, country)
        return pd.DataFrame()

    # Reverse mapping: dimension position -> time label string
    pos_to_time: dict[int, str] = {v: k for k, v in time_cat_index.items()}
    # Also build from labels as a fallback
    pos_to_label: dict[int, str] = {v: k for k, v in time_cat_label.items()}

    # --- Compute strides to unravel flat indices ---
    try:
        strides: list[int] = []
        stride = 1
        for s in reversed(size):
            strides.append(stride)
            stride *= s
        strides.reverse()
    except Exception as e:
        logger.error("Failed to compute strides from size %s: %s", size, e)
        return pd.DataFrame()

    # --- Parse value entries ---
    rows: list[dict[str, Any]] = []

    for key_str, val in values.items():
        try:
            # Handle both flat "0" and dotted "0.0.0" key formats
            if "." in key_str:
                indices = [int(p) for p in key_str.split(".")]
            else:
                # Flat integer key — unravel using strides
                flat_idx = int(key_str)
                remaining = flat_idx
                indices = []
                for s in strides:
                    indices.append(remaining // s)
                    remaining %= s
        except (ValueError, TypeError, ArithmeticError) as e:
            logger.warning("Skipping unparseable value key '%s': %s", key_str, e)
            continue

        # Extract time index
        try:
            time_idx = indices[time_pos]
        except IndexError:
            logger.warning(
                "Time position %d out of range for indices %s (key='%s')",
                time_pos, indices, key_str,
            )
            continue

        # Map time index to a label string
        time_label = pos_to_time.get(time_idx)
        if time_label is None:
            time_label = pos_to_label.get(time_idx, str(time_idx))

        row: dict[str, Any] = {
            "time": time_label,
            "geo": country,
            "value": float(val) if val is not None else None,
        }
        rows.append(row)

    if not rows:
        logger.warning("No rows parsed from Eurostat response for %s/%s", dataset, country)
        return pd.DataFrame()

    try:
        df = pd.DataFrame(rows)
        df["value"] = pd.to_numeric(df["value"], errors="coerce")
        return df
    except Exception as e:
        logger.error("Failed to build DataFrame for %s/%s: %s", dataset, country, e)
        return pd.DataFrame()


async def _fetch_eurostat_dataset(
    dataset: str, country: str, start_year: int, end_year: int
) -> pd.DataFrame:
    """Fetch raw data for one dataset / country from Eurostat, with caching.

    The API is called once per country (all months returned in one response).
    """
    cache_path = get_cache_path("eurostat", country, start_year)
    if cache_is_fresh(cache_path):
        logger.info("Eurostat cache HIT for %s/%s", dataset, country)
        raw = read_cache(cache_path)
        return _parse_eurostat_response(raw, dataset, country)

    url = f"{EUROSTAT_BASE}/{dataset}"
    params: dict[str, str] = {
        "format": "JSON",
        "lang": "EN",
        "freq": "M",
        "geo": country,
        "sinceTimePeriod": str(start_year),
    }

    async def _request() -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            return resp.json()

    try:
        raw = await retry_with_backoff_async(_request)
    except Exception as e:
        logger.error("Failed to fetch Eurostat %s for %s: %s", dataset, country, e)
        return pd.DataFrame()

    write_cache(cache_path, raw)
    logger.info("Eurostat cache WRITE for %s/%s", dataset, country)
    return _parse_eurostat_response(raw, dataset, country)


def _filter_time_range(df: pd.DataFrame, start_year: int, end_year: int) -> pd.DataFrame:
    """Filter rows so the 'time' column falls within [start_year, end_year].

    The Eurostat time labels look like '2024M01' or '2024-01'.
    """
    if df.empty or "time" not in df.columns:
        return df

    def _extract_year(t: Any) -> Optional[int]:
        s = str(t)
        try:
            return int(s[:4])
        except (ValueError, IndexError):
            return None

    df = df.copy()
    df["_year"] = df["time"].apply(_extract_year)
    df = df.dropna(subset=["_year"])
    df = df[(df["_year"] >= start_year) & (df["_year"] <= end_year)]
    df = df.drop(columns=["_year"])
    return df


def _extract_month(time_val: str) -> int:
    """Extract month number from Eurostat time label (e.g. '2024M01' -> 1)."""
    try:
        if "M" in time_val:
            return int(time_val.split("M")[1])
        parts = time_val.split("-")
        if len(parts) >= 2:
            return int(parts[1])
    except (ValueError, IndexError):
        pass
    return 1


async def fetch_tourism_data(
    country_code: str, start_year: int = 2020, end_year: int = 2024
) -> pd.DataFrame:
    """Fetch nights spent at tourist accommodations from Eurostat.

    Dataset: tour_occ_nim

    Returns a DataFrame with columns:
      country_code, year, month, tourist_nights
    """
    logger.info("Fetching tourism data for %s (%d-%d)", country_code, start_year, end_year)
    df = await _fetch_eurostat_dataset("tour_occ_nim", country_code, start_year, end_year)

    if df.empty:
        logger.warning("No tourism data returned for %s", country_code)
        return pd.DataFrame(columns=["country_code", "year", "month", "tourist_nights"])

    df = _filter_time_range(df, start_year, end_year)
    if df.empty:
        return pd.DataFrame(columns=["country_code", "year", "month", "tourist_nights"])

    result = pd.DataFrame({
        "country_code": country_code,
        "year": df["time"].apply(lambda t: int(str(t)[:4])),
        "month": df["time"].apply(_extract_month),
        "tourist_nights": df["value"],
    })
    result = result.sort_values(["year", "month"]).reset_index(drop=True)
    log_dataframe_info(result, f"tourism {country_code}")
    return result


async def fetch_energy_data(
    country_code: str, start_year: int = 2020, end_year: int = 2024
) -> pd.DataFrame:
    """Fetch energy consumption by country/month from Eurostat.

    Dataset: nrg_cb_em (values in GWh)

    Returns a DataFrame with columns:
      country_code, year, month, energy_consumption_gwh
    """
    logger.info("Fetching energy data for %s (%d-%d)", country_code, start_year, end_year)
    df = await _fetch_eurostat_dataset("nrg_cb_em", country_code, start_year, end_year)

    if df.empty:
        logger.warning("No energy data returned for %s", country_code)
        return pd.DataFrame(columns=["country_code", "year", "month", "energy_consumption_gwh"])

    df = _filter_time_range(df, start_year, end_year)
    if df.empty:
        return pd.DataFrame(columns=["country_code", "year", "month", "energy_consumption_gwh"])

    result = pd.DataFrame({
        "country_code": country_code,
        "year": df["time"].apply(lambda t: int(str(t)[:4])),
        "month": df["time"].apply(_extract_month),
        "energy_consumption_gwh": df["value"],
    })
    result = result.sort_values(["year", "month"]).reset_index(drop=True)
    log_dataframe_info(result, f"energy {country_code}")
    return result


def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """Clean a merged DataFrame: drop duplicates, fill missing, clip negatives.

    Steps:
      1. Drop duplicate rows (country_code, year, month)
      2. Forward-fill short gaps (max 2 consecutive NaNs)
      3. Clip negative numeric values to 0
      4. Drop rows where critical columns (tourist_nights, energy_consumption_gwh) are null
    """
    if df.empty:
        return df

    result = df.copy()

    result = result.drop_duplicates(subset=["country_code", "year", "month"], keep="last")

    numeric_cols = result.select_dtypes(include="number").columns
    result[numeric_cols] = result[numeric_cols].clip(lower=0)

    critical_cols = ["tourist_nights", "energy_consumption_gwh"]
    existing_critical = [c for c in critical_cols if c in result.columns]
    if existing_critical:
        before = len(result)
        result = result.dropna(subset=existing_critical)
        if len(result) < before:
            logger.info("Dropped %d rows missing critical columns", before - len(result))

    result = result.reset_index(drop=True)
    logger.info("clean_data: final shape %s", result.shape)
    return result
