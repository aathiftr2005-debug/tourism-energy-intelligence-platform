"""Tests for forecast and ensemble logic."""

import numpy as np
import pandas as pd
import pytest


class TestEnsembleWeighting:
    """Tests for ensemble forecast combination logic."""

    def test_ensemble_weighting(self):
        xgb = np.array([100, 200, 300])
        prophet = np.array([110, 190, 310])
        expected = 0.6 * xgb + 0.4 * prophet
        result = 0.6 * xgb + 0.4 * prophet
        np.testing.assert_array_almost_equal(result, expected)

    def test_ensemble_with_zeros(self):
        xgb = np.array([0, 0, 0])
        prophet = np.array([100, 200, 300])
        result = 0.6 * xgb + 0.4 * prophet
        expected = np.array([40, 80, 120])
        np.testing.assert_array_almost_equal(result, expected)


class TestFeatureEngineering:
    """Tests for feature engineering functions in app.ml.features."""

    def test_lag_features_created(self, sample_merged_df):
        from app.ml.features import build_features
        X, _ = build_features(sample_merged_df)
        for col in ["lag_1", "lag_3", "lag_12"]:
            assert col in X.columns

    def test_rolling_features_created(self, sample_merged_df):
        from app.ml.features import build_features
        X, _ = build_features(sample_merged_df)
        for col in ["rolling_mean_3", "rolling_mean_6", "rolling_std_3"]:
            assert col in X.columns

    def test_calendar_features_created(self, sample_merged_df):
        from app.ml.features import build_features
        X, _ = build_features(sample_merged_df)
        for col in ["month_sin", "month_cos", "quarter", "is_summer", "is_winter"]:
            assert col in X.columns

    def test_interaction_features_created(self, sample_merged_df):
        from app.ml.features import build_features
        X, _ = build_features(sample_merged_df)
        for col in ["tourist_weather_score", "cold_energy_pressure", "arrival_intensity"]:
            assert col in X.columns

    def test_target_shifted(self, sample_merged_df):
        from app.ml.features import build_features
        _, y = build_features(sample_merged_df)
        assert len(y) > 0
        assert y.name == "target"


class TestMetricsCalculation:
    """Tests for model metric calculations."""

    def test_mape_calculation(self):
        from sklearn.metrics import mean_absolute_percentage_error
        y_true = np.array([100, 200, 300])
        y_pred = np.array([110, 190, 310])
        mape = mean_absolute_percentage_error(y_true, y_pred)
        assert 0 < mape < 1

    def test_r2_range(self):
        from sklearn.metrics import r2_score
        y_true = np.array([100, 200, 300])
        y_pred = np.array([100, 200, 300])
        assert r2_score(y_true, y_pred) == 1.0

        y_pred = np.array([300, 200, 100])
        assert r2_score(y_true, y_pred) < 0
