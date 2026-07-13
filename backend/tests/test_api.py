"""Tests for FastAPI endpoints using TestClient."""


class TestHealthEndpoint:
    """Tests for the /health endpoint."""

    def test_health_endpoint_returns_ok(self, client, mock_supabase):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "app" in data
        assert "version" in data

    def test_health_has_correct_fields(self, client, mock_supabase):
        response = client.get("/health")
        data = response.json()
        assert data["app"] == "Tourism Energy Intelligence"


class TestETLEndpoints:
    """Tests for ETL API endpoints."""

    def test_etl_status_endpoint(self, client):
        response = client.get("/api/v1/etl/status")
        assert response.status_code in (200, 422)

    def test_etl_data_missing_params(self, client):
        response = client.get("/api/v1/etl/data")
        assert response.status_code == 422


class TestForecastEndpoints:
    """Tests for forecast API endpoints."""

    def test_forecast_endpoint_missing_country(self, client):
        response = client.get("/api/v1/forecast/")
        assert response.status_code == 404

    def test_forecast_endpoint_invalid_country(self, client):
        response = client.get("/api/v1/forecast/XX")
        assert response.status_code == 200


class TestStressScoreEndpoints:
    """Tests for stress score API endpoints."""

    def test_stress_score_endpoint(self, client):
        response = client.get("/api/v1/stress-score/DE?year=2024&month=7")
        assert response.status_code in (200, 422)


class TestPublicEndpoints:
    """Tests for public API endpoints (no auth required)."""

    def test_public_docs_info_no_auth(self, client):
        response = client.get("/api/v1/public/docs-info")
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert "endpoints" in data

    def test_invalid_api_key_returns_401(self, client):
        response = client.get(
            "/api/v1/public/regions",
            headers={"X-API-Key": "TEST_INVALID_API_KEY"},
        )
        assert response.status_code == 401

    def test_missing_api_key_returns_422_or_401(self, client):
        response = client.get("/api/v1/public/regions")
        assert response.status_code in (401, 422)
