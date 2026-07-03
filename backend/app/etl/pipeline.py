"""Master ETL pipeline — orchestrate multi-source data extraction, merging,
feature engineering, validation, and loading to Supabase + local CSV backup.

Usage:
    result_df = await run_full_pipeline("DE", 2020, 2024)
"""

import asyncio
import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

import numpy as np
import pandas as pd

from app.core.config import settings
from app.core.database import get_supabase
from app.etl.eurostat import clean_data, fetch_energy_data, fetch_tourism_data
from app.etl.flights import (
    AIRPORT_CODES,
    fetch_flight_arrivals,
)
from app.etl.utils import (
    COUNTRY_COORDS,
    TARGET_COUNTRIES,
    log_dataframe_info,
    retry_with_backoff_async,
)
from app.etl.weather import aggregate_to_monthly, fetch_weather_data

logger = logging.getLogger(__name__)

PROCESSED_DIR = Path(__file__).resolve().parents[4] / "ml" / "data" / "processed"


def _assign_season(month: int) -> str:
    """Map month number to season name."""
    if month in (12, 1, 2):
        return "winter"
    if month in (3, 4, 5):
        return "spring"
    if month in (6, 7, 8):
        return "summer"
    return "autumn"


def _is_peak_season(month: int) -> bool:
    """Return True if month is a peak tourism month (Jun, Jul, Aug, Dec)."""
    return month in (6, 7, 8, 12)


def _merge_dataframes(
    tourism: pd.DataFrame,
    energy: pd.DataFrame,
    weather: pd.DataFrame,
    flights: pd.DataFrame,
) -> pd.DataFrame:
    """Merge four source DataFrames on (country_code, year, month)."""
    merge_keys = ["country_code", "year", "month"]

    dfs_to_merge: list[tuple[pd.DataFrame, str]] = [
        (tourism, "tourism"),
        (energy, "energy"),
        (weather, "weather"),
        (flights, "flights"),
    ]

    merged: Optional[pd.DataFrame] = None
    for df, name in dfs_to_merge:
        if df.empty:
            logger.warning("Empty DataFrame for %s — skipping merge", name)
            continue
        if merged is None:
            merged = df.copy()
        else:
            merged = pd.merge(merged, df, on=merge_keys, how="outer", suffixes=("", f"_{name}"))

    if merged is None:
        return pd.DataFrame()

    return merged


def _engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add engineered features to the merged DataFrame.

    New columns:
      - season: categorical season name
      - is_peak_season: boolean for Jun/Jul/Aug/Dec
      - temp_energy_interaction: temp_mean * energy_consumption_gwh
      - tourist_intensity: tourist_nights / rolling 12-month average
      - flight_to_tourist_ratio: flight_arrivals / tourist_nights
    """
    if df.empty:
        return df

    result = df.copy()

    result["season"] = result["month"].apply(_assign_season)
    result["is_peak_season"] = result["month"].apply(_is_peak_season)

    if "temp_mean" in result.columns and "energy_consumption_gwh" in result.columns:
        result["temp_energy_interaction"] = (
            result["temp_mean"] * result["energy_consumption_gwh"]
        )
    else:
        result["temp_energy_interaction"] = np.nan

    if "tourist_nights" in result.columns:
        rolling_avg = (
            result["tourist_nights"]
            .rolling(window=12, min_periods=1)
            .mean()
        )
        result["tourist_intensity"] = np.where(
            rolling_avg > 0, result["tourist_nights"] / rolling_avg, 1.0
        )
    else:
        result["tourist_intensity"] = np.nan

    if (
        "flight_arrivals" in result.columns
        and "tourist_nights" in result.columns
    ):
        result["flight_to_tourist_ratio"] = np.where(
            result["tourist_nights"] > 0,
            result["flight_arrivals"] / result["tourist_nights"],
            0.0,
        )
    else:
        result["flight_to_tourist_ratio"] = np.nan

    return result


def _validate_data(df: pd.DataFrame) -> list[str]:
    """Run data quality checks and return a list of warning messages.

    Checks:
      1. Negative values in numeric columns
      2. Columns with >20% null values
      3. Outliers (values > 5 standard deviations from mean)
    """
    warnings: list[str] = []
    if df.empty:
        warnings.append("DataFrame is empty — no data to validate")
        return warnings

    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()

    negative_flags: list[str] = []
    for col in numeric_cols:
        neg_count = (df[col] < 0).sum()
        if neg_count > 0:
            negative_flags.append(f"{col}: {neg_count} negative rows")
    if negative_flags:
        msg = "Negative values detected: " + "; ".join(negative_flags)
        warnings.append(msg)
        logger.warning(msg)

    high_null_flags: list[str] = []
    for col in df.columns:
        null_pct = df[col].isnull().mean()
        if null_pct > 0.20:
            high_null_flags.append(f"{col}: {null_pct:.1%} null")
    if high_null_flags:
        msg = "Columns with >20% nulls: " + "; ".join(high_null_flags)
        warnings.append(msg)
        logger.warning(msg)

    outlier_flags: list[str] = []
    for col in numeric_cols:
        col_data = df[col].dropna()
        if len(col_data) < 5:
            continue
        mean = col_data.mean()
        std = col_data.std()
        if std == 0:
            continue
        outlier_count = ((col_data - mean).abs() > 5 * std).sum()
        if outlier_count > 0:
            outlier_flags.append(f"{col}: {outlier_count} outliers")
    if outlier_flags:
        msg = "Outliers (>5σ): " + "; ".join(outlier_flags)
        warnings.append(msg)
        logger.warning(msg)

    return warnings


async def _upsert_to_supabase(df: pd.DataFrame) -> int:
    """Upsert rows into the energy_tourism_data table.

    Upsert key: (country_code, year, month)
    Returns the number of rows upserted.
    """
    supabase = get_supabase()
    rows_upserted = 0
    target_cols = [
        "country_code", "year", "month", "season", "is_peak_season",
        "tourist_nights", "energy_consumption_gwh",
        "temp_mean", "precipitation_sum", "sunshine_duration",
        "flight_arrivals", "temp_energy_interaction",
        "tourist_intensity", "flight_to_tourist_ratio",
    ]
    existing_cols = [c for c in target_cols if c in df.columns]

    records = df[existing_cols].copy()
    import math
    records = records.astype(object)
    records = records.where(records.notna(), None)
    for col in records.columns:
        records[col] = records[col].apply(
            lambda x: None if isinstance(x, float) and (math.isnan(x) or math.isinf(x)) else x
        )

    if "is_peak_season" in records.columns:
        records["is_peak_season"] = records["is_peak_season"].astype(object).where(
            records["is_peak_season"].notna(), None
        )

    batch_size = 50
    for start in range(0, len(records), batch_size):
        batch = records.iloc[start : start + batch_size]
        try:
            payload = batch.to_dict(orient="records")
            response = (
                supabase.table("energy_tourism_data")
                .upsert(payload, on_conflict="country_code,year,month")
                .execute()
            )
            rows_upserted += len(response.data) if response.data else 0
        except Exception as e:
            logger.error("Supabase upsert batch failed at row %d: %s", start, e)

    logger.info("Upserted %d rows to Supabase energy_tourism_data", rows_upserted)
    return rows_upserted


def _save_backup(df: pd.DataFrame, country_code: str) -> str:
    """Save the merged DataFrame as a CSV backup.

    Returns the file path of the saved CSV.
    """
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    filepath = PROCESSED_DIR / f"{country_code}_merged.csv"
    df.to_csv(filepath, index=False)
    logger.info("Backup CSV saved to %s (%d rows)", filepath, len(df))
    return str(filepath)


async def run_full_pipeline(
    country_code: str,
    start_year: int = 2020,
    end_year: int = 2024,
) -> pd.DataFrame:
    """Run the complete multi-source ETL pipeline for one country.

    Steps
    -----
    1. Fetch tourism data from Eurostat (tour_occ_nim)
    2. Fetch energy data from Eurostat (nrg_cb_em)
    3. Fetch weather data from OpenMeteo Archive
    4. Fetch flight arrivals from OpenSky Network (with fallback estimation)
    5. Merge all sources on (country_code, year, month)
    6. Engineer features (season, peak season, interactions, ratios)
    7. Validate data quality
    8. Clean data (drop duplicates, clip negatives, fill nulls)
    9. Upsert to Supabase table "energy_tourism_data"
    10. Save backup CSV to ml/data/processed/

    Returns
    -------
    pd.DataFrame — the final cleaned and enriched DataFrame
    """
    logger.info(
        "=== Starting ETL pipeline for %s (%d-%d) ===",
        country_code, start_year, end_year,
    )

    tourism_df = await fetch_tourism_data(country_code, start_year, end_year)
    energy_df = await fetch_energy_data(country_code, start_year, end_year)

    lat_lng = COUNTRY_COORDS.get(country_code)
    if lat_lng:
        weather_df = await fetch_weather_data(
            country_code, lat_lng[0], lat_lng[1], start_year, end_year
        )
        weather_df = aggregate_to_monthly(weather_df)
    else:
        logger.warning("No coordinates for %s — weather data will be empty", country_code)
        weather_df = pd.DataFrame()

    icao = AIRPORT_CODES.get(country_code)
    if icao:
        flight_rows: list[dict[str, Any]] = []
        for year in range(start_year, end_year + 1):
            for month in range(1, 13):
                arrivals = await fetch_flight_arrivals(icao, year, month)
                flight_rows.append({
                    "country_code": country_code,
                    "year": year,
                    "month": month,
                    "flight_arrivals": arrivals,
                })
        flights_df = pd.DataFrame(flight_rows)
    else:
        logger.warning("No airport code for %s — flight data will be empty", country_code)
        flights_df = pd.DataFrame()

    merged_df = _merge_dataframes(tourism_df, energy_df, weather_df, flights_df)

    # Replace -1 flight arrivals with tourist_nights * 0.15 estimate
    if "flight_arrivals" in merged_df.columns and "tourist_nights" in merged_df.columns:
        missing_mask = merged_df["flight_arrivals"] == -1
        if missing_mask.any():
            n_estimated = missing_mask.sum()
            merged_df.loc[missing_mask, "flight_arrivals"] = (
                merged_df.loc[missing_mask, "tourist_nights"] * 0.15
            ).fillna(0).astype(int)
            logger.warning(
                "Estimated flight_arrivals for %d rows using tourist_nights * 0.15",
                n_estimated,
            )

    # Also handle NaN flight_arrivals
    if "flight_arrivals" in merged_df.columns:
        merged_df["flight_arrivals"] = merged_df["flight_arrivals"].fillna(0).astype(int)

    log_dataframe_info(merged_df, f"merged {country_code}")

    if merged_df.empty:
        logger.error("Pipeline produced no data for %s", country_code)
        return merged_df

    merged_df = _engineer_features(merged_df)

    validation_warnings = _validate_data(merged_df)
    for w in validation_warnings:
        logger.warning("Validation: %s", w)

    merged_df = clean_data(merged_df)

    if merged_df.empty:
        logger.error("clean_data produced empty DataFrame for %s", country_code)
        return merged_df

    try:
        await _upsert_to_supabase(merged_df)
    except Exception as e:
        logger.error("Supabase upsert failed for %s: %s", country_code, e)

    csv_path = _save_backup(merged_df, country_code)

    logger.info(
        "=== ETL pipeline COMPLETE for %s: %d rows -> %s ===",
        country_code, len(merged_df), csv_path,
    )
    return merged_df


async def run_all_countries(
    start_year: int = 2020,
    end_year: int = 2024,
) -> dict[str, pd.DataFrame]:
    """Run the full ETL pipeline for all 10 target countries.

    Returns a dict mapping country_code -> result DataFrame.
    """
    results: dict[str, pd.DataFrame] = {}
    for country in TARGET_COUNTRIES:
        try:
            df = await run_full_pipeline(country, start_year, end_year)
            results[country] = df
        except Exception as e:
            logger.error("Pipeline failed for %s: %s", country, e)
            results[country] = pd.DataFrame()
    return results
