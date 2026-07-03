-- =============================================================================
-- Tourism Energy Intelligence — PostgreSQL Schema
-- =============================================================================

-- ── Users & Authentication ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    name            VARCHAR(255) NOT NULL,
    role            VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'analyst', 'operator', 'viewer')),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ── Sessions ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      VARCHAR(255) NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    ip_address      VARCHAR(45),
    user_agent      TEXT
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- ── API Keys (for external API consumers) ────────────────────────────────────

CREATE TABLE IF NOT EXISTS api_keys (
    id              SERIAL PRIMARY KEY,
    key_hash        VARCHAR(64) UNIQUE NOT NULL,
    name            TEXT,
    email           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    last_used       TIMESTAMPTZ,
    is_active       BOOLEAN DEFAULT TRUE,
    request_count   INT DEFAULT 0
);

CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);

-- ── Countries ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS countries (
    code            CHAR(2) PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    region          VARCHAR(50),
    population      BIGINT,
    latitude        DOUBLE PRECISION,
    longitude       DOUBLE PRECISION,
    timezone        VARCHAR(50)
);

-- ── Energy Data ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS energy_data (
    id              SERIAL PRIMARY KEY,
    country_code    CHAR(2) NOT NULL REFERENCES countries(code),
    year            INTEGER NOT NULL,
    month           INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    consumption     DOUBLE PRECISION,
    grid_health     DOUBLE PRECISION,
    carbon_emissions DOUBLE PRECISION,
    renewable_pct   DOUBLE PRECISION,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (country_code, year, month)
);

CREATE INDEX idx_energy_country ON energy_data(country_code);
CREATE INDEX idx_energy_date ON energy_data(year, month);

-- ── Tourism Data ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tourism_data (
    id              SERIAL PRIMARY KEY,
    country_code    CHAR(2) NOT NULL REFERENCES countries(code),
    year            INTEGER NOT NULL,
    month           INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    tourist_count   BIGINT,
    tourist_nights  BIGINT,
    occupancy_rate  DOUBLE PRECISION,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (country_code, year, month)
);

CREATE INDEX idx_tourism_country ON tourism_data(country_code);
CREATE INDEX idx_tourism_date ON tourism_data(year, month);

-- ── Weather Data ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS weather_data (
    id              SERIAL PRIMARY KEY,
    country_code    CHAR(2) NOT NULL REFERENCES countries(code),
    recorded_at     TIMESTAMPTZ NOT NULL,
    temperature     DOUBLE PRECISION,
    humidity        DOUBLE PRECISION,
    condition       VARCHAR(100),
    wind_speed      DOUBLE PRECISION,
    precipitation   DOUBLE PRECISION,
    cloud_cover     DOUBLE PRECISION,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_weather_country ON weather_data(country_code);
CREATE INDEX idx_weather_recorded_at ON weather_data(recorded_at);

-- ── Forecast Data ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS forecasts (
    id              SERIAL PRIMARY KEY,
    country_code    CHAR(2) NOT NULL REFERENCES countries(code),
    year            INTEGER NOT NULL,
    month           INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    ensemble        DOUBLE PRECISION,
    xgb_prediction  DOUBLE PRECISION,
    prophet_prediction DOUBLE PRECISION,
    lower_bound     DOUBLE PRECISION,
    upper_bound     DOUBLE PRECISION,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (country_code, year, month)
);

CREATE INDEX idx_forecasts_country ON forecasts(country_code);
CREATE INDEX idx_forecasts_date ON forecasts(year, month);

-- ── Stress Scores ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS stress_scores (
    id              SERIAL PRIMARY KEY,
    country_code    CHAR(2) NOT NULL REFERENCES countries(code),
    year            INTEGER NOT NULL,
    month           INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    stress_score    DOUBLE PRECISION NOT NULL,
    stress_level    VARCHAR(20) NOT NULL CHECK (stress_level IN ('NORMAL', 'ELEVATED', 'CRITICAL')),
    traffic_light   VARCHAR(10),
    contributing_factors JSONB,
    recommendation  TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (country_code, year, month)
);

CREATE INDEX idx_stress_country ON stress_scores(country_code);
CREATE INDEX idx_stress_level ON stress_scores(stress_level);
CREATE INDEX idx_stress_date ON stress_scores(year, month);

-- ── Alerts ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS alerts (
    id              SERIAL PRIMARY KEY,
    country_code    CHAR(2) REFERENCES countries(code),
    priority        VARCHAR(10) NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    source          VARCHAR(100),
    is_active       BOOLEAN DEFAULT TRUE,
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alerts_priority ON alerts(priority);
CREATE INDEX idx_alerts_active ON alerts(is_active);

-- ── ETL Run Logs ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS etl_run_logs (
    id              SERIAL PRIMARY KEY,
    country_code    CHAR(2) REFERENCES countries(code),
    run_at          TIMESTAMPTZ DEFAULT NOW(),
    rows_inserted   INTEGER DEFAULT 0,
    status          VARCHAR(20) DEFAULT 'pending',
    error_message   TEXT,
    duration_ms     INTEGER
);

CREATE INDEX idx_etl_status ON etl_run_logs(status);

-- ── Air Quality ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS air_quality_data (
    id              SERIAL PRIMARY KEY,
    country_code    CHAR(2) NOT NULL REFERENCES countries(code),
    recorded_at     TIMESTAMPTZ NOT NULL,
    aqi             INTEGER,
    pm25            DOUBLE PRECISION,
    pm10            DOUBLE PRECISION,
    no2             DOUBLE PRECISION,
    so2             DOUBLE PRECISION,
    o3              DOUBLE PRECISION,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_aq_country ON air_quality_data(country_code);
CREATE INDEX idx_aq_recorded_at ON air_quality_data(recorded_at);

-- ── Emergency / Disaster Alerts ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS disaster_alerts (
    id              SERIAL PRIMARY KEY,
    source          VARCHAR(50) NOT NULL,
    external_id     VARCHAR(100),
    event_type      VARCHAR(50),
    alert_level     VARCHAR(20),
    title           TEXT,
    description     TEXT,
    country_code    CHAR(2) REFERENCES countries(code),
    latitude        DOUBLE PRECISION,
    longitude       DOUBLE PRECISION,
    occurred_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_disaster_type ON disaster_alerts(event_type);
CREATE INDEX idx_disaster_country ON disaster_alerts(country_code);

-- =============================================================================
-- Functions & Triggers
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
