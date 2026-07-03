"""SHAP-based model explainability and LLM-generated plain-English explanations.

Provides:
  - generate_shap_explanation()   — SHAP values + feature importance
  - explain_stress_score()        — Gemini/LLM textual explanation
"""

import json
import logging
import os
from typing import Any, Optional

import numpy as np
import pandas as pd
import shap

from app.core.config import settings
from app.ml.train import load_xgboost_model

logger = logging.getLogger(__name__)


def generate_shap_explanation(
    country_code: str, X: pd.DataFrame
) -> dict[str, Any]:
    """Compute SHAP explanations for a country's XGBoost model.

    Parameters
    ----------
    country_code : str
    X : pd.DataFrame   feature matrix (must match training features)

    Returns
    -------
    dict with:
      global_importance         — top 10 features by mean |SHAP|
      latest_prediction_explanation — per-feature SHAP for the last row
      summary_plot_data         — list of {feature, shap_value, feature_value}
    """
    logger.info("Generating SHAP explanation for %s", country_code)

    try:
        model = load_xgboost_model(country_code)
    except FileNotFoundError as e:
        logger.error("SHAP failed: %s", e)
        return {"error": str(e)}

    X_arr = X.values if hasattr(X, "values") else np.array(X)
    feature_names = list(X.columns)

    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_arr)

    mean_abs_shap = np.abs(shap_values).mean(axis=0)
    top_n = min(10, len(feature_names))
    top_indices = np.argsort(mean_abs_shap)[::-1][:top_n]

    global_importance: dict[str, float] = {
        feature_names[i]: float(mean_abs_shap[i]) for i in top_indices
    }

    latest_shap = shap_values[-1]
    latest_features = X_arr[-1]
    latest_explanation: dict[str, float] = {}
    for i, feature in enumerate(feature_names):
        if feature in global_importance or abs(float(latest_shap[i])) > 0.01:
            latest_explanation[feature] = float(latest_shap[i])

    summary_data: list[dict[str, Any]] = []
    for i, feature in enumerate(feature_names):
        summary_data.append({
            "feature": feature,
            "shap_value": float(shap_values[-1, i]),
            "feature_value": float(latest_features[i]) if hasattr(latest_features, "__len__") else float(latest_features),
        })
    summary_data.sort(key=lambda x: abs(x["shap_value"]), reverse=True)
    summary_data = summary_data[:top_n]

    return {
        "global_importance": global_importance,
        "latest_prediction_explanation": latest_explanation,
        "summary_plot_data": summary_data,
    }


def explain_stress_score(
    country_code: str,
    year: int,
    month: int,
    shap_data: Optional[dict[str, Any]] = None,
    feature_values: Optional[dict[str, float]] = None,
) -> str:
    """Generate a human-readable explanation of a stress score.

    If the GEMINI_API_KEY is configured, uses the Gemini API to produce
    the explanation.  Otherwise falls back to a template-based explanation.

    Parameters
    ----------
    country_code : str
    year : int
    month : int
    shap_data : dict, optional   from generate_shap_explanation()
    feature_values : dict, optional  current feature values

    Returns
    -------
    str — plain-English explanation
    """
    country_names = {
        "DE": "Germany", "FR": "France", "ES": "Spain", "IT": "Italy",
        "AT": "Austria", "GR": "Greece", "PT": "Portugal", "NL": "Netherlands",
        "BE": "Belgium", "CZ": "Czech Republic",
    }
    country_name = country_names.get(country_code, country_code)

    top_features = ""
    if shap_data and "global_importance" in shap_data:
        top = list(shap_data["global_importance"].items())[:3]
        top_features = "Top contributing factors: " + ", ".join(
            f"{feat} ({val:.3f})" for feat, val in top
        )

    month_names = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
    ]
    month_name = month_names[month - 1] if 1 <= month <= 12 else str(month)

    gemini_api_key = os.getenv("GEMINI_API_KEY") or ""
    if gemini_api_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_api_key)

            context = (
                f"For {country_name} in {month_name} {year}, "
                f"the energy stress score was calculated. "
                f"{top_features} "
                f"Feature values: {json.dumps(feature_values or {})}. "
                f"Please explain why this score occurred in 2-3 sentences."
            )

            model = genai.GenerativeModel("gemini-2.0-flash-lite")
            response = model.generate_content(
                f"You are an energy analyst. {context}"
            )
            if response and response.text:
                return response.text.strip()
        except Exception as e:
            logger.warning("Gemini API call failed, using template fallback: %s", e)

    template = (
        f"In {month_name} {year}, {country_name}'s energy stress score "
        f"reflects the combined impact of tourism demand, "
        f"weather conditions, and grid capacity. "
        f"{top_features} "
        f"This suggests that tourism-related energy consumption "
        f"is the primary driver during this period."
    )
    return template
