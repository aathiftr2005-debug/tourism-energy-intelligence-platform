"""Feature engineering for energy demand forecasting.

Takes the merged ETL DataFrame and produces a feature matrix X and
target vector y ready for model training.

Expected input columns (from pipeline):
  country_code, year, month, tourist_nights, energy_consumption_gwh,
  temp_mean, precipitation_sum, sunshine_duration, flight_arrivals,
  temp_energy_interaction, tourist_intensity, flight_to_tourist_ratio,
  season, is_peak_season
"""

import logging
from typing import Any

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

REQUIRED_COLS = [
    "country_code", "year", "month", "energy_consumption_gwh",
    "tourist_nights", "temp_mean", "sunshine_duration",
    "flight_arrivals", "is_peak_season",
]


def _create_lag_features(df: pd.DataFrame) -> pd.DataFrame:
    """Create lagged features from energy_consumption_gwh."""
    result = df.copy()
    result["lag_1"] = result["energy_consumption_gwh"].shift(1)
    result["lag_3"] = result["energy_consumption_gwh"].shift(3)
    result["lag_12"] = result["energy_consumption_gwh"].shift(12)
    return result


def _create_rolling_features(df: pd.DataFrame) -> pd.DataFrame:
    """Create rolling window statistics from energy_consumption_gwh."""
    result = df.copy()
    result["rolling_mean_3"] = (
        result["energy_consumption_gwh"].rolling(window=3, min_periods=1).mean()
    )
    result["rolling_mean_6"] = (
        result["energy_consumption_gwh"].rolling(window=6, min_periods=1).mean()
    )
    result["rolling_std_3"] = (
        result["energy_consumption_gwh"].rolling(window=3, min_periods=1).std()
    )
    return result


def _create_calendar_features(df: pd.DataFrame) -> pd.DataFrame:
    """Create cyclical and boolean calendar features."""
    result = df.copy()
    result["month_sin"] = np.sin(2 * np.pi * result["month"] / 12)
    result["month_cos"] = np.cos(2 * np.pi * result["month"] / 12)
    result["quarter"] = result["month"].apply(lambda m: (m - 1) // 3 + 1)
    result["is_summer"] = result["month"].isin([6, 7, 8])
    result["is_winter"] = result["month"].isin([12, 1, 2])
    return result


def _create_interaction_features(df: pd.DataFrame) -> pd.DataFrame:
    """Create interaction features combining two or more source columns."""
    result = df.copy()

    result["tourist_weather_score"] = (
        result["tourist_nights"] * result["sunshine_duration"] / 1000.0
    )

    safe_temp = result["temp_mean"].replace(0, 0.1)
    result["cold_energy_pressure"] = np.where(
        result["temp_mean"] > 0,
        (1.0 / safe_temp) * result["energy_consumption_gwh"],
        0.0,
    )

    result["arrival_intensity"] = (
        result["flight_arrivals"] * result["is_peak_season"].astype(int)
    )

    return result


def build_features(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    """Build feature matrix X and target series y from a merged ETL DataFrame.

    Parameters
    ----------
    df : pd.DataFrame
        Merged DataFrame from the ETL pipeline. Must contain at minimum
        the columns listed in REQUIRED_COLS.

    Returns
    -------
    tuple[pd.DataFrame, pd.Series]
        X : feature matrix with all engineered columns
        y : target series (energy_consumption_gwh shifted -1 month ahead)

    Raises
    ------
    ValueError
        If required columns are missing.
    """
    missing = [c for c in REQUIRED_COLS if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    result = df.copy()
    logger.info("build_features: initial shape %s", result.shape)

    # Step 1 — fill NaN in key numeric columns before feature creation
    numeric_cols = [
        "energy_consumption_gwh", "tourist_nights",
        "flight_arrivals", "tourist_intensity",
        "flight_to_tourist_ratio",
    ]
    for col in numeric_cols:
        if col in result.columns:
            result[col] = result[col].ffill().bfill().fillna(0)
    logger.info("build_features: after NaN fill shape %s", result.shape)

    result = _create_lag_features(result)
    logger.info("build_features: after lags shape %s", result.shape)

    result = _create_rolling_features(result)
    result = _create_calendar_features(result)
    result = _create_interaction_features(result)
    logger.info("build_features: after all features shape %s", result.shape)

    # Step 2 — create target then drop only NaN targets
    result["target"] = result["energy_consumption_gwh"].shift(-1)
    logger.info("build_features: before dropna(target) shape %s", result.shape)

    result = result.dropna(subset=["target"]).reset_index(drop=True)
    logger.info("build_features: after dropna(target) shape %s", result.shape)

    # Step 3 — fill remaining NaN in features with 0
    feature_cols_all = [c for c in result.columns if c != "target"]
    result[feature_cols_all] = result[feature_cols_all].fillna(0)

    # Drop non-numeric and non-feature columns
    cols_to_drop = ["created_at", "country_code", "season", "id"]
    cols_to_drop = [c for c in cols_to_drop if c in result.columns]
    result = result.drop(columns=cols_to_drop)

    # Ensure X contains only numeric columns
    feature_cols = [c for c in result.columns if c != "target"]
    X = result[feature_cols].select_dtypes(include=["number", "bool"])
    y = result["target"]

    logger.info(
        "build_features: X shape=%s, y shape=%s, features=%d",
        X.shape, y.shape, X.shape[1],
    )
    return X, y
