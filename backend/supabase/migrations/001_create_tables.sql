-- 001_create_tables.sql
-- Tourism Energy Intelligence — Supabase schema migration
-- Creates the core data and logging tables.

-- ============================================================
-- Table: energy_tourism_data
-- Stores merged, cleaned, and feature-engineered records
-- produced by the ETL pipeline.
-- Upsert key: (country_code, year, month)
-- ============================================================
CREATE TABLE IF NOT EXISTS energy_tourism_data (
    id                  SERIAL PRIMARY KEY,
    country_code        VARCHAR(3) NOT NULL,
    year                INT NOT NULL,
    month               INT NOT NULL,
    season              VARCHAR(10),
    is_peak_season      BOOLEAN,
    tourist_nights      FLOAT,
    energy_consumption_gwh FLOAT,
    temp_mean           FLOAT,
    precipitation_sum   FLOAT,
    sunshine_duration   FLOAT,
    flight_arrivals     INT,
    temp_energy_interaction FLOAT,
    tourist_intensity   FLOAT,
    flight_to_tourist_ratio FLOAT,
    created_at          TIMESTAMP DEFAULT NOW(),
    UNIQUE(country_code, year, month)
);

-- Index for fast queries by country and time range
CREATE INDEX IF NOT EXISTS idx_energy_tourism_country_year
    ON energy_tourism_data (country_code, year, month);

-- ============================================================
-- Table: etl_run_logs
-- Records each ETL pipeline run for observability.
-- ============================================================
CREATE TABLE IF NOT EXISTS etl_run_logs (
    id              SERIAL PRIMARY KEY,
    run_at          TIMESTAMP DEFAULT NOW(),
    country_code    VARCHAR(3),
    rows_inserted   INT,
    status          VARCHAR(20),   -- 'started', 'completed', 'failed'
    error_message   TEXT
);

CREATE INDEX IF NOT EXISTS idx_etl_run_logs_status
    ON etl_run_logs (status, run_at DESC);

-- ============================================================
-- Table: stress_scores
-- Stores calculated Tourism Energy Stress Scores per country/month.
-- Upsert key: (country_code, year, month)
-- ============================================================
CREATE TABLE IF NOT EXISTS stress_scores (
    id                      SERIAL PRIMARY KEY,
    country_code            VARCHAR(3) NOT NULL,
    year                    INT NOT NULL,
    month                   INT NOT NULL,
    stress_score            FLOAT,
    stress_level            VARCHAR(20),
    contributing_factors    JSONB,
    recommendation          TEXT,
    created_at              TIMESTAMP DEFAULT NOW(),
    UNIQUE(country_code, year, month)
);

CREATE INDEX IF NOT EXISTS idx_stress_scores_country
    ON stress_scores (country_code, year, month);

-- ============================================================
-- Table: alert_history
-- Tracks every alert email sent by the system.
-- ============================================================
CREATE TABLE IF NOT EXISTS alert_history (
    id              SERIAL PRIMARY KEY,
    country_code    VARCHAR(3),
    stress_level    VARCHAR(20),
    stress_score    FLOAT,
    sent_at         TIMESTAMP DEFAULT NOW(),
    recipient_email TEXT,
    status          VARCHAR(20)   -- 'sent', 'failed', 'error: ...'
);

CREATE INDEX IF NOT EXISTS idx_alert_history_sent
    ON alert_history (sent_at DESC);

-- ============================================================
-- Table: api_keys
-- Stores SHA-256 hashes of issued API keys.
-- ============================================================
CREATE TABLE IF NOT EXISTS api_keys (
    id              SERIAL PRIMARY KEY,
    key_hash        VARCHAR(64) UNIQUE NOT NULL,
    name            TEXT,
    email           TEXT,
    created_at      TIMESTAMP DEFAULT NOW(),
    last_used       TIMESTAMP,
    is_active       BOOLEAN DEFAULT TRUE,
    request_count   INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash
    ON api_keys (key_hash);
