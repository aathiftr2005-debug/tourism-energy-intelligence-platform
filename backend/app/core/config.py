"""Application configuration loaded from environment variables.

All secrets MUST be provided via environment variables or a .env file.
Never hardcode credentials in source code.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ── Application ──────────────────────────────────────────────
    app_name: str = "Tourism Energy Intelligence"
    app_version: str = "1.0.0"
    environment: str = "production"
    debug: bool = False

    # ── Server ───────────────────────────────────────────────────
    host: str = "0.0.0.0"
    port: int = 8000
    workers: int = 2
    log_level: str = "info"
    request_timeout: int = 120

    # ── CORS ─────────────────────────────────────────────────────
    cors_origins: str = "http://localhost:3000"

    # ── Supabase ─────────────────────────────────────────────────
    supabase_url: str
    supabase_key: str

    # ── AI / ML ──────────────────────────────────────────────────
    gemini_api_key: str = ""

    # ── Email (SendGrid) ─────────────────────────────────────────
    sendgrid_api_key: str = ""
    alert_recipient_email: str = ""

    # ── Weather API ──────────────────────────────────────────────
    weather_api_key: str = ""

    # ── Eurostat ─────────────────────────────────────────────────
    eurostat_base_url: str = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0"

    # ── ML ───────────────────────────────────────────────────────
    model_path: str = "/app/app/ml/saved_models"

    # ── ETL ──────────────────────────────────────────────────────
    etl_cache_max_age_hours: int = 24

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origin_list(self) -> list[str]:
        """Parse comma-separated CORS origins into a list."""
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


settings = Settings()
