"""Ensemble forecasting — combine XGBoost and Prophet predictions.

The ensemble weights XGBoost at 60% and Prophet at 40%.
"""

import logging
from typing import Any

import numpy as np
import pandas as pd

from app.etl.utils import TARGET_COUNTRIES
from app.ml.features import build_features
from app.ml.train import load_prophet_model, load_xgboost_model

logger = logging.getLogger(__name__)


def _generate_future_X(
    last_df: pd.DataFrame, months_ahead: int
) -> pd.DataFrame:
    """Build a feature matrix for future months by repeating the most recent
    known values and advancing the calendar / lag features step by step.

    This is a simplified recursive approach for demonstration.  A production
    system would use a more sophisticated method or a dedicated time-series
    framework.
    """
    if last_df.empty:
        return pd.DataFrame()

    last_row = last_df.iloc[-1:].copy()
    max_month = int(last_row["month"].iloc[0]) if "month" in last_row.columns else 12
    max_year = int(last_row["year"].iloc[0]) if "year" in last_row.columns else 2024

    future_rows: list[dict[str, Any]] = []
    for step in range(1, months_ahead + 1):
        new_month = max_month + step
        new_year = max_year
        if new_month > 12:
            new_month -= 12
            new_year += 1

        row = last_row.iloc[0].to_dict()
        row["month"] = new_month
        row["year"] = new_year
        row["is_peak_season"] = new_month in (6, 7, 8, 12)
        future_rows.append(row)

    future = pd.DataFrame(future_rows)
    repeated = pd.concat([last_df, future], ignore_index=True)
    X_future, _ = build_features(repeated)
    return X_future.tail(months_ahead).reset_index(drop=True)


def generate_ensemble_forecast(
    country_code: str, months_ahead: int = 12
) -> pd.DataFrame:
    """Generate an ensemble forecast combining XGBoost and Prophet.

    Parameters
    ----------
    country_code : str
    months_ahead : int   number of future months to forecast (default 12)

    Returns
    -------
    pd.DataFrame with columns:
      date, xgb_prediction, prophet_prediction,
      ensemble_prediction, lower_bound, upper_bound, country_code
    """
    logger.info("Generating ensemble forecast for %s (%d months)", country_code, months_ahead)

    xgb_model = load_xgboost_model(country_code)
    prophet_model = load_prophet_model(country_code)

    prophet_future = prophet_model.make_future_dataframe(periods=months_ahead, freq="ME")
    prophet_forecast = prophet_model.predict(prophet_future)

    prophet_recent = prophet_forecast.tail(months_ahead)

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
        if records:
            df = pd.DataFrame(records)
            for col in ["year", "month"]:
                if col in df.columns:
                    df[col] = pd.to_numeric(df[col], errors="coerce")
            X_future = _generate_future_X(df, months_ahead)
        else:
            logger.warning("No Supabase data for %s — using placeholders", country_code)
            X_future = _generate_future_X(
                pd.DataFrame({"year": [2024], "month": [12], "energy_consumption_gwh": [100]}),
                months_ahead,
            )
    except Exception as e:
        logger.error("Failed to load data for XGBoost features: %s", e)
        X_future = pd.DataFrame()

    if X_future.empty or len(X_future) < months_ahead:
        logger.warning("Feature matrix incomplete — using Prophet-only forecast")
        xgb_preds = np.zeros(months_ahead)
    else:
        xgb_preds = xgb_model.predict(X_future.values)

    prophet_vals = prophet_recent["yhat"].values[:months_ahead]
    prophet_lower = prophet_recent["yhat_lower"].values[:months_ahead]
    prophet_upper = prophet_recent["yhat_upper"].values[:months_ahead]

    ensemble = 0.6 * xgb_preds + 0.4 * prophet_vals

    start_date = pd.Timestamp.today().replace(day=1)
    dates = pd.date_range(start=start_date, periods=months_ahead, freq="ME")

    result = pd.DataFrame({
        "date": dates.strftime("%Y-%m-%d"),
        "xgb_prediction": np.round(xgb_preds, 2),
        "prophet_prediction": np.round(prophet_vals, 2),
        "ensemble_prediction": np.round(ensemble, 2),
        "lower_bound": np.round(prophet_lower, 2),
        "upper_bound": np.round(prophet_upper, 2),
        "country_code": country_code,
    })

    logger.info("Ensemble forecast for %s: %d months generated", country_code, len(result))
    return result


def forecast_all_countries(months_ahead: int = 12) -> dict[str, pd.DataFrame]:
    """Generate ensemble forecasts for all 10 target countries.

    Returns
    -------
    dict of { country_code: forecast_DataFrame }
    """
    results: dict[str, pd.DataFrame] = {}
    for country in TARGET_COUNTRIES:
        try:
            results[country] = generate_ensemble_forecast(country, months_ahead)
        except Exception as e:
            logger.error("Forecast failed for %s: %s", country, e)
            results[country] = pd.DataFrame()
    return results
