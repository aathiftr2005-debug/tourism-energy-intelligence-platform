# API Reference

## Overview

The project exposes two API surfaces:
1. **Internal Next.js API Routes** — Frontend-facing proxy endpoints
2. **Backend FastAPI** — ML model inference and data management

## Internal API Routes (Next.js)

These are server-side route handlers that proxy external API calls. They are consumed by the frontend service layer and are **not** intended for external use.

### `GET /api/weather`

Proxies to Open-Meteo API.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `lat` | number | Yes | Latitude |
| `lon` | number | Yes | Longitude |
| `type` | string | No | `current`, `hourly`, or `daily` (default: `current`) |

**Response:** Raw Open-Meteo API response.

---

### `GET /api/energy`

Proxies to ENTSO-E Transparency Platform.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `country` | string | Yes | 2-letter country code (e.g., `DE`, `FR`) |
| `type` | string | No | `load` or `generation` (default: `load`) |

**Response:**
```json
{
  "points": [{ "position": 1, "quantity": 45200.5 }],
  "country": "DE",
  "type": "load"
}
```

---

### `GET /api/carbon`

Proxies to Electricity Maps and OpenAQ.

**Query Parameters (carbon/breakdown):**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `zone` | string | Yes | Electricity Maps zone code |
| `type` | string | No | `carbon-intensity` or `breakdown` |

**Query Parameters (air quality):**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `lat` | number | Yes | Latitude |
| `lon` | number | Yes | Longitude |
| `type` | string | Yes | Must be `air-quality` |

**Response:** Raw Electricity Maps or OpenAQ API response.

---

### `GET /api/emergency`

Proxies to GDACS RSS feed.

**Response:**
```json
{
  "xml": "<rss>...</rss>"
}
```

---

### `GET /api/tourism`

Proxies to Eurostat API.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `country` | string | No | Country code (default: `EU`) |

**Response:** Raw Eurostat API response.

---

### `POST /api/auth/login`

Authenticate a user.

**Request Body:**
```json
{
  "email": "admin@tei.app",
  "password": "demo1234"
}
```

**Response:**
```json
{
  "user": { "id": "...", "email": "...", "name": "...", "role": "admin" },
  "token": "jwt-token",
  "expiresAt": 1700000000000
}
```

---

### `POST /api/auth/logout`

Invalidate the current session.

**Response:**
```json
{ "success": true }
```

---

### `GET /api/auth/session`

Get the current session from the cookie.

**Response:** Session object or 401.

---

## Backend API (FastAPI)

Available at `/api/v1/*` when proxied through the frontend rewrite rule, or directly at `http://localhost:8000/api/v1/*`.

### `GET /api/v1/regions`
List all supported countries with stress scores.

### `GET /api/v1/stress/{country}`
Get stress score for a specific country.

### `GET /api/v1/stress/countries`
List all countries.

### `POST /api/v1/forecast/generate`
Generate ML forecast for a country.

**Request Body:**
```json
{
  "country_code": "ES",
  "months_ahead": 12
}
```

### `POST /api/v1/forecast/explain`
Get SHAP-based explanation for a forecast.

### `POST /api/v1/etl/run`
Trigger ETL pipeline for all countries.

### `POST /api/v1/assistant/chat`
Send a message to the AI assistant (Gemini-powered).

### `GET /health`
Health check endpoint.

## Authentication

### Frontend Auth
- JWT-based session stored in HTTP-only cookies
- Roles: `admin`, `analyst`, `operator`, `viewer`
- Protected routes redirect to `/login`

### API Key Auth (Backend Public API)
- Register at `/api/public/keys/register`
- Include `X-API-Key` header in requests
- Rate limited: 100 req/h per key, 10 req/min per IP
