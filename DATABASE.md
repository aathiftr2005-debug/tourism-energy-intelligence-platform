# Database

## Overview

PostgreSQL 16 database storing all application data including energy metrics, tourism statistics, weather data, ML forecasts, and user sessions.

## Schema

### `users`
User accounts for the dashboard login system.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `email` | VARCHAR(255) | Unique email |
| `password_hash` | VARCHAR(255) | bcrypt hash |
| `name` | VARCHAR(255) | Display name |
| `role` | VARCHAR(50) | `admin`, `analyst`, `operator`, `viewer` |
| `is_active` | BOOLEAN | Soft delete flag |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### `sessions`
Active user sessions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to users |
| `token_hash` | VARCHAR(255) | Hashed session token |
| `expires_at` | TIMESTAMPTZ | Session expiry |
| `ip_address` | VARCHAR(45) | Client IP |
| `user_agent` | TEXT | Browser user agent |

### `countries`
Reference data for supported European countries.

| Column | Type | Description |
|--------|------|-------------|
| `code` | CHAR(2) | ISO 3166-1 alpha-2 |
| `name` | VARCHAR(100) | Country name |
| `region` | VARCHAR(50) | Geographic region |
| `latitude` | DOUBLE PRECISION | Center latitude |
| `longitude` | DOUBLE PRECISION | Center longitude |

### `energy_data`
Energy consumption and production metrics.

| Column | Type | Description |
|--------|------|-------------|
| `country_code` | CHAR(2) | FK to countries |
| `year` | INTEGER | Data year |
| `month` | INTEGER | Data month (1-12) |
| `consumption` | DOUBLE PRECISION | Energy consumption (GWh) |
| `grid_health` | DOUBLE PRECISION | Grid health score (0-100) |
| `carbon_emissions` | DOUBLE PRECISION | CO2 emissions (g/kWh) |
| `renewable_pct` | DOUBLE PRECISION | Renewable percentage |

### `tourism_data`
Tourism arrival and occupancy data.

| Column | Type | Description |
|--------|------|-------------|
| `country_code` | CHAR(2) | FK to countries |
| `year` | INTEGER | Data year |
| `month` | INTEGER | Data month |
| `tourist_count` | BIGINT | Number of tourists |
| `tourist_nights` | BIGINT | Total overnight stays |
| `occupancy_rate` | DOUBLE PRECISION | Hotel occupancy rate |

### `weather_data`
Historical and current weather conditions.

| Column | Type | Description |
|--------|------|-------------|
| `country_code` | CHAR(2) | FK to countries |
| `recorded_at` | TIMESTAMPTZ | Measurement timestamp |
| `temperature` | DOUBLE PRECISION | Temperature (°C) |
| `humidity` | DOUBLE PRECISION | Relative humidity (%) |
| `condition` | VARCHAR(100) | Weather condition text |
| `wind_speed` | DOUBLE PRECISION | Wind speed (km/h) |
| `precipitation` | DOUBLE PRECISION | Precipitation (mm) |
| `cloud_cover` | DOUBLE PRECISION | Cloud cover (%) |

### `forecasts`
ML model forecast outputs.

| Column | Type | Description |
|--------|------|-------------|
| `country_code` | CHAR(2) | FK to countries |
| `year` | INTEGER | Forecast year |
| `month` | INTEGER | Forecast month |
| `ensemble` | DOUBLE PRECISION | Ensemble prediction |
| `xgb_prediction` | DOUBLE PRECISION | XGBoost prediction |
| `prophet_prediction` | DOUBLE PRECISION | Prophet prediction |
| `lower_bound` | DOUBLE PRECISION | 95% CI lower bound |
| `upper_bound` | DOUBLE PRECISION | 95% CI upper bound |

### `stress_scores`
Computed Tourism Energy Stress Scores (0-100).

| Column | Type | Description |
|--------|------|-------------|
| `country_code` | CHAR(2) | FK to countries |
| `year` | INTEGER | Score year |
| `month` | INTEGER | Score month |
| `stress_score` | DOUBLE PRECISION | Score value (0-100) |
| `stress_level` | VARCHAR(20) | `NORMAL`, `ELEVATED`, `CRITICAL` |
| `contributing_factors` | JSONB | Factor breakdown |
| `recommendation` | TEXT | AI recommendation |

### `air_quality_data`
Air quality measurements from OpenAQ.

| Column | Type | Description |
|--------|------|-------------|
| `country_code` | CHAR(2) | FK to countries |
| `recorded_at` | TIMESTAMPTZ | Measurement timestamp |
| `aqi` | INTEGER | Air Quality Index |
| `pm25` | DOUBLE PRECISION | PM2.5 concentration |
| `pm10` | DOUBLE PRECISION | PM10 concentration |
| `no2` | DOUBLE PRECISION | NO2 concentration |
| `so2` | DOUBLE PRECISION | SO2 concentration |
| `o3` | DOUBLE PRECISION | Ozone concentration |

### `disaster_alerts`
Disaster events from GDACS.

| Column | Type | Description |
|--------|------|-------------|
| `source` | VARCHAR(50) | Alert source |
| `external_id` | VARCHAR(100) | External alert ID |
| `event_type` | VARCHAR(50) | `flood`, `fire`, `storm`, `earthquake` |
| `alert_level` | VARCHAR(20) | Severity level |
| `country_code` | CHAR(2) | FK to countries |
| `latitude` | DOUBLE PRECISION | Event latitude |
| `longitude` | DOUBLE PRECISION | Event longitude |
| `occurred_at` | TIMESTAMPTZ | Event time |

## Migrations

Migrations are stored in `database/migrations/` and use a tracking table `_migrations` to record which have been applied.

- `001_initial.sql` — All core tables, indexes, and constraints
- Seed data is loaded from `database/seed.sql`

## Running Migrations

### With Docker Compose
Migrations run automatically on first startup via `docker-entrypoint-initdb.d/`.

### Manually
```bash
psql -h localhost -U postgres -d tei -f database/migrations/001_initial.sql
psql -h localhost -U postgres -d tei -f database/seed.sql
```

## Backup

```bash
pg_dump -h localhost -U postgres -d tei > backup_$(date +%Y%m%d).sql
```
