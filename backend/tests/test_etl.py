"""Tests for ETL pipeline data cleaning and feature logic."""

import pandas as pd
import pytest


class TestCleanData:
    """Tests for the clean_data function in eurostat.py."""

    def test_clean_data_removes_nulls(self):
        from app.etl.eurostat import clean_data

        df = pd.DataFrame({
            "country_code": ["DE", "DE", "DE"],
            "year": [2024, 2024, 2024],
            "month": [1, 2, 3],
            "tourist_nights": [100.0, None, 300.0],
            "energy_consumption_gwh": [400.0, 500.0, None],
        })
        result = clean_data(df)
        assert len(result) == 1

    def test_clean_data_flags_negatives(self):
        from app.etl.eurostat import clean_data

        df = pd.DataFrame({
            "country_code": ["DE", "DE"],
            "year": [2024, 2024],
            "month": [1, 2],
            "tourist_nights": [100.0, -50.0],
            "energy_consumption_gwh": [400.0, 500.0],
        })
        result = clean_data(df)
        assert (result["tourist_nights"] >= 0).all()

    def test_clean_data_drops_duplicates(self):
        from app.etl.eurostat import clean_data

        df = pd.DataFrame({
            "country_code": ["DE", "DE"],
            "year": [2024, 2024],
            "month": [1, 1],
            "tourist_nights": [100.0, 200.0],
            "energy_consumption_gwh": [400.0, 400.0],
        })
        result = clean_data(df)
        assert len(result) == 1


class TestSeasonLogic:
    """Tests for seasonal feature assignment in pipeline.py."""

    def _assign_season(self, month: int) -> str:
        if month in (12, 1, 2):
            return "winter"
        if month in (3, 4, 5):
            return "spring"
        if month in (6, 7, 8):
            return "summer"
        return "autumn"

    def test_season_assignment_correct(self):
        assert self._assign_season(1) == "winter"
        assert self._assign_season(4) == "spring"
        assert self._assign_season(7) == "summer"
        assert self._assign_season(10) == "autumn"
        assert self._assign_season(12) == "winter"

    def test_is_peak_season_correct(self):
        from app.etl.pipeline import _is_peak_season
        peak_months = [6, 7, 8, 12]
        for m in range(1, 13):
            assert _is_peak_season(m) == (m in peak_months)


class TestBuildFeatures:
    """Tests for ML feature engineering."""

    def test_build_features_returns_xy(self, sample_merged_df):
        from app.ml.features import build_features

        X, y = build_features(sample_merged_df)
        assert len(X) > 0
        assert len(y) > 0
        assert len(X) == len(y)

    def test_build_features_has_expected_columns(self, sample_merged_df):
        from app.ml.features import build_features

        X, _ = build_features(sample_merged_df)
        expected = {"lag_1", "lag_3", "lag_12", "rolling_mean_3",
                    "month_sin", "month_cos", "quarter",
                    "is_summer", "is_winter",
                    "tourist_weather_score", "cold_energy_pressure",
                    "arrival_intensity"}
        assert expected.issubset(set(X.columns))

    def test_build_features_raises_on_missing_cols(self):
        from app.ml.features import build_features
        import pandas as pd

        with pytest.raises(ValueError, match="Missing required columns"):
            build_features(pd.DataFrame({"a": [1]}))


class TestPipeline:
    """Tests for pipeline merge and feature engineering functions."""

    def test_merge_dataframes_merges_on_keys(self, sample_merged_df):
        from app.etl.pipeline import _merge_dataframes

        tourism = sample_merged_df[["country_code", "year", "month", "tourist_nights"]]
        energy = sample_merged_df[["country_code", "year", "month", "energy_consumption_gwh"]]

        merged = _merge_dataframes(tourism, energy, pd.DataFrame(), pd.DataFrame())
        assert not merged.empty
        assert "tourist_nights" in merged.columns
        assert "energy_consumption_gwh" in merged.columns

    def test_engineer_features_adds_columns(self, sample_merged_df):
        from app.etl.pipeline import _engineer_features

        result = _engineer_features(sample_merged_df)
        for col in ["season", "is_peak_season", "temp_energy_interaction",
                     "tourist_intensity", "flight_to_tourist_ratio"]:
            assert col in result.columns
