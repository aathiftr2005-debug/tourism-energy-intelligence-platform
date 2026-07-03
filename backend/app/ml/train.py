"""Model training module for XGBoost, Prophet, and full training pipeline.

Provides:
  - train_xgboost()        — XGBoost with TimeSeriesSplit CV
  - train_prophet()        — Prophet with custom tourism seasonality
  - train_all_countries()  — orchestrate training for all 10 target countries
"""

import logging
import os
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from prophet import Prophet
from sklearn.metrics import mean_absolute_error, mean_absolute_percentage_error, r2_score
from sklearn.model_selection import TimeSeriesSplit
from xgboost import XGBRegressor

from app.core.config import settings
from app.core.database import get_supabase
from app.etl.utils import TARGET_COUNTRIES
from app.ml.features import build_features

logger = logging.getLogger(__name__)

SAVED_MODELS_DIR = Path(__file__).resolve().parent / "saved_models"


def _model_path(country_code: str, model_type: str) -> str:
    """Return the filesystem path for a saved model."""
    SAVED_MODELS_DIR.mkdir(parents=True, exist_ok=True)
    return str(SAVED_MODELS_DIR / f"{country_code}_{model_type}.pkl")


def _load_data_from_supabase(country_code: str) -> pd.DataFrame:
    """Load merged ETL data for a country from Supabase.

    Returns a DataFrame with columns matching the pipeline output.
    """
    supabase = get_supabase()
    try:
        response = (
            supabase.table("energy_tourism_data")
            .select("*")
            .eq("country_code", country_code)
            .order("year")
            .order("month")
            .execute()
        )
        records = response.data or []
        if not records:
            logger.warning("No Supabase data found for %s", country_code)
            return pd.DataFrame()
        df = pd.DataFrame(records)
        for col in ["year", "month"]:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce")
        logger.info("Loaded %d rows from Supabase for %s", len(df), country_code)
        return df
    except Exception as e:
        logger.error("Failed to load data from Supabase for %s: %s", country_code, e)
        return pd.DataFrame()


def train_xgboost(X: pd.DataFrame, y: pd.Series, country_code: str) -> dict[str, Any]:
    """Train an XGBoost regressor with time-series cross-validation.

    Parameters
    ----------
    X : pd.DataFrame   feature matrix
    y : pd.Series      target vector
    country_code : str  for model naming

    Returns
    -------
    dict with keys: model, metrics, feature_importance
    """
    logger.info("Training XGBoost for %s — X: %s, y: %s", country_code, X.shape, y.shape)

    model = XGBRegressor(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        verbosity=0,
    )

    tscv = TimeSeriesSplit(n_splits=5)

    mae_scores: list[float] = []
    rmse_scores: list[float] = []
    mape_scores: list[float] = []
    r2_scores: list[float] = []

    X_arr = X.values
    y_arr = y.values

    for fold, (train_idx, val_idx) in enumerate(tscv.split(X_arr)):
        X_train, X_val = X_arr[train_idx], X_arr[val_idx]
        y_train, y_val = y_arr[train_idx], y_arr[val_idx]

        fold_model = XGBRegressor(
            n_estimators=300,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            verbosity=0,
        )
        fold_model.fit(X_train, y_train)
        y_pred = fold_model.predict(X_val)

        mae_scores.append(mean_absolute_error(y_val, y_pred))
        rmse_scores.append(np.sqrt(((y_val - y_pred) ** 2).mean()))
        mape_scores.append(mean_absolute_percentage_error(y_val, y_pred))
        r2_scores.append(r2_score(y_val, y_pred))
        logger.debug("Fold %d — MAE: %.2f, RMSE: %.2f, MAPE: %.4f, R2: %.4f",
                     fold + 1, mae_scores[-1], rmse_scores[-1],
                     mape_scores[-1], r2_scores[-1])

    model.fit(X_arr, y_arr)

    path = _model_path(country_code, "xgb")
    joblib.dump(model, path)
    logger.info("XGBoost model saved to %s", path)

    importance = model.feature_importances_
    feature_names = list(X.columns)

    metrics = {
        "mae": float(np.mean(mae_scores)),
        "rmse": float(np.mean(rmse_scores)),
        "mape": float(np.mean(mape_scores)),
        "r2": float(np.mean(r2_scores)),
    }

    return {
        "model": model,
        "metrics": metrics,
        "feature_importance": dict(zip(feature_names, [float(v) for v in importance])),
    }


def train_prophet(df: pd.DataFrame, country_code: str) -> dict[str, Any]:
    """Train a Prophet model with custom tourism-peak seasonality.

    Prophet requires columns: ds (date), y (energy_consumption_gwh).

    Parameters
    ----------
    df : pd.DataFrame   must contain year, month, energy_consumption_gwh
    country_code : str

    Returns
    -------
    dict with keys: forecast_df, model
    """
    logger.info("Training Prophet for %s — %d rows", country_code, len(df))

    required = {"year", "month", "energy_consumption_gwh"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns for Prophet: {missing}")

    prophet_df = df[["year", "month", "energy_consumption_gwh"]].copy()
    prophet_df["ds"] = pd.to_datetime(
        prophet_df[["year", "month"]].assign(day=1)
    )
    prophet_df = prophet_df.rename(columns={"energy_consumption_gwh": "y"})
    prophet_df = prophet_df.sort_values("ds").reset_index(drop=True)

    model = Prophet(
        yearly_seasonality=True,
        weekly_seasonality=False,
        daily_seasonality=False,
        seasonality_mode="multiplicative",
    )

    model.add_seasonality(
        name="tourism_peak",
        period=365.25 / 2,
        fourier_order=5,
    )

    model.fit(prophet_df[["ds", "y"]])

    future = model.make_future_dataframe(periods=12, freq="ME")
    forecast = model.predict(future)

    forecast_df = forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]].copy()
    forecast_df["ds"] = forecast_df["ds"].dt.strftime("%Y-%m-%d")

    path = _model_path(country_code, "prophet")
    with open(path, "wb") as f:
        joblib.dump(model, f)
    logger.info("Prophet model saved to %s", path)

    return {
        "forecast_df": forecast_df,
        "model": model,
    }


def train_all_countries() -> dict[str, dict[str, Any]]:
    """Load data from Supabase for all countries and train both models.

    Returns
    -------
    dict of { country_code: { xgboost_metrics, prophet_status } }
    """
    summary: dict[str, dict[str, Any]] = {}

    for country in TARGET_COUNTRIES:
        logger.info("=" * 50)
        logger.info("Training models for %s", country)
        logger.info("=" * 50)

        result: dict[str, Any] = {"country_code": country}

        df = _load_data_from_supabase(country)
        if df.empty:
            logger.warning("No data for %s — skipping", country)
            summary[country] = {"error": "No data available"}
            continue

        try:
            X, y = build_features(df)

            if len(X) < 30:
                logger.warning("Insufficient data for %s (%d rows) — skipping", country, len(X))
                summary[country] = {"error": f"Insufficient data: {len(X)} rows"}
                continue

            xgb_result = train_xgboost(X, y, country)
            result["xgboost"] = {
                "metrics": xgb_result["metrics"],
                "feature_importance": xgb_result["feature_importance"],
            }
            logger.info(
                "XGBoost %s — MAE: %.2f, RMSE: %.2f, MAPE: %.4f, R2: %.4f",
                country,
                xgb_result["metrics"]["mae"],
                xgb_result["metrics"]["rmse"],
                xgb_result["metrics"]["mape"],
                xgb_result["metrics"]["r2"],
            )

            prophet_result = train_prophet(df, country)
            result["prophet"] = {
                "forecast_rows": len(prophet_result["forecast_df"]),
            }
            logger.info("Prophet %s — forecast generated: %d rows", country, len(prophet_result["forecast_df"]))

        except Exception as e:
            logger.error("Training failed for %s: %s", country, e, exc_info=True)
            result["error"] = str(e)

        summary[country] = result

    logger.info("Training complete for %d countries", len(summary))
    return summary


def load_xgboost_model(country_code: str) -> XGBRegressor:
    """Load a saved XGBoost model from disk."""
    path = _model_path(country_code, "xgb")
    if not os.path.exists(path):
        raise FileNotFoundError(f"No saved XGBoost model for {country_code} at {path}")
    return joblib.load(path)


def load_prophet_model(country_code: str) -> Prophet:
    """Load a saved Prophet model from disk."""
    path = _model_path(country_code, "prophet")
    if not os.path.exists(path):
        raise FileNotFoundError(f"No saved Prophet model for {country_code} at {path}")
    return joblib.load(path)
