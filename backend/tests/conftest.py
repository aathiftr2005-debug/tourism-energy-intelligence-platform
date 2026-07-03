"""Shared fixtures for backend tests."""

import os
from typing import Any, Generator
from unittest.mock import Mock, patch

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.etl.utils import TARGET_COUNTRIES


@pytest.fixture
def app():
    """Return the FastAPI application instance."""
    from app.main import app as _app
    return _app


@pytest.fixture
def client(app) -> Generator:
    """Return a TestClient for the FastAPI app."""
    with TestClient(app) as c:
        yield c


@pytest.fixture
def sample_merged_df():
    """Return a minimal merged DataFrame for testing."""
    import pandas as pd
    import numpy as np
    np.random.seed(42)
    rows = []
    for country in ["DE", "FR", "ES"]:
        for year in [2023, 2024]:
            for month in range(1, 13):
                rows.append({
                    "country_code": country,
                    "year": year,
                    "month": month,
                    "season": "summer" if month in [6, 7, 8] else "winter" if month in [12, 1, 2] else "spring" if month in [3, 4, 5] else "autumn",
                    "is_peak_season": month in [6, 7, 8, 12],
                    "tourist_nights": abs(np.random.normal(500000, 100000)),
                    "energy_consumption_gwh": abs(np.random.normal(400, 80)),
                    "temp_mean": np.random.uniform(5, 30),
                    "precipitation_sum": np.random.uniform(0, 100),
                    "sunshine_duration": np.random.uniform(100, 400),
                    "flight_arrivals": int(abs(np.random.normal(5000, 1000))),
                    "temp_energy_interaction": np.random.uniform(1000, 12000),
                    "tourist_intensity": np.random.uniform(0.5, 1.5),
                    "flight_to_tourist_ratio": np.random.uniform(0.01, 0.03),
                })
    return pd.DataFrame(rows)


@pytest.fixture
def mock_supabase():
    """Mock Supabase client for tests that don't need real DB."""
    with patch("app.core.database.get_supabase") as mock:
        mock_instance = Mock()
        mock.return_value = mock_instance

        mock_table = Mock()
        mock_instance.table.return_value = mock_table

        mock_query = Mock()
        mock_table.select.return_value = mock_query
        mock_query.eq.return_value = mock_query
        mock_query.order.return_value = mock_query
        mock_query.limit.return_value = mock_query
        mock_query.execute.return_value = Mock(data=[])

        yield mock_instance
