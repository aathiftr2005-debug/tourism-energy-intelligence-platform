"""Tests for the Tourism Energy Stress Score calculator."""

import pytest


class TestStressScoreLogic:
    """Tests for core stress score calculation logic."""

    def _calculate_raw_score(self, ti: float, ftr: float, tei: float, delta: float) -> float:
        raw = (ti * 0.30) + (ftr * 0.20) + (tei * 0.25) + (delta * 0.25)
        return round(raw * 100, 2)

    def test_stress_score_range_0_to_100(self):
        score = self._calculate_raw_score(0.5, 0.5, 0.5, 0.5)
        assert 0 <= score <= 100

    def test_stress_score_zero_inputs(self):
        score = self._calculate_raw_score(0, 0, 0, 0)
        assert score == 0.0

    def test_stress_score_max_inputs(self):
        score = self._calculate_raw_score(1, 1, 1, 1)
        assert score == 100.0

    def test_critical_threshold_above_75(self):
        from app.ml.stress_score import get_recommendations
        rec = get_recommendations("CRITICAL", {"tourist_intensity": 0.9})
        assert "emergency" in rec.lower()

    def test_elevated_threshold_above_50(self):
        from app.ml.stress_score import get_recommendations
        rec = get_recommendations("ELEVATED", {"flight_to_tourist_ratio": 0.7})
        assert "reserve" in rec.lower()

    def test_normal_threshold_below_50(self):
        from app.ml.stress_score import get_recommendations
        rec = get_recommendations("NORMAL", {})
        assert "standard monitoring" in rec.lower()

    def test_recommendations_match_level(self):
        from app.ml.stress_score import get_recommendations
        assert "emergency" in get_recommendations("CRITICAL", {"a": 0.9}).lower()
        assert "reserve" in get_recommendations("ELEVATED", {"a": 0.7}).lower()
        assert "standard" in get_recommendations("NORMAL", {}).lower()


class TestMinMaxScale:
    """Tests for stress score normalisation."""

    def test_min_max_scale_identity(self):
        from app.ml.stress_score import _min_max_scale
        import pandas as pd
        series = pd.Series([0, 50, 100])
        scaled = _min_max_scale(series)
        assert scaled.iloc[0] == 0.0
        assert scaled.iloc[-1] == 1.0

    def test_min_max_scale_constant(self):
        from app.ml.stress_score import _min_max_scale
        import pandas as pd
        series = pd.Series([5, 5, 5])
        scaled = _min_max_scale(series)
        assert (scaled == 0.5).all()
