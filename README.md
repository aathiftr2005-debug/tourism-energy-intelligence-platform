# Tourism Energy Intelligence 🌍⚡

> AI-powered seasonal energy demand forecasting platform for European tourism regions

[![CI/CD Pipeline](https://github.com/aathiftr2005-debug/tourism-energy-intelligence/actions/workflows/ci.yml/badge.svg)](https://github.com/aathiftr2005-debug/tourism-energy-intelligence/actions/workflows/ci.yml)

## Problem & Solution

European tourism regions face extreme seasonal energy demand spikes driven by tourist influx, weather patterns, and large-scale events. Grid operators struggle to balance supply and demand, often resorting to expensive last-minute capacity purchases or risking brownouts.

Tourism Energy Intelligence solves this by combining multi-source ETL pipelines (Eurostat, OpenMeteo, OpenSky Network) with ensemble ML models (XGBoost + Prophet) to produce accurate 12-month energy demand forecasts. A novel Tourism Energy Stress Score (0-100) with traffic-light classification provides an at-a-glance risk assessment, while SHAP explainability and a Gemini-powered AI assistant make the insights actionable.

## Architecture

```
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   Eurostat API   │    │  OpenMeteo API   │    │ OpenSky Network  │
│ (tourism/energy) │    │ (weather archive)│    │ (flight arrivals)│
└────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘
         │                       │                       │
         ▼                       ▼                       ▼
    ┌─────────────────────────────────────────────────────────┐
    │                   ETL Pipeline (async)                   │
    │          Caching · Retry · Validation · Logging          │
    └──────────────────────────┬──────────────────────────────┘
                               │
                               ▼
                    ┌──────────────────┐
                    │    Supabase DB   │
                    │ (PostgreSQL)     │
                    └────────┬─────────┘
                             │
                    ┌────────▼────────┐
                    │ Feature Engine  │
                    │ (lags, rolling, │
                    │  calendar, int.)│
                    └────────┬────────┘
                             │
               ┌─────────────┼─────────────┐
               ▼             ▼             ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ XGBoost  │  │ Prophet  │  │  SHAP    │
        │ (TSS CV) │  │(season.) │  │Explain.  │
        └────┬─────┘  └────┬─────┘  └────┬─────┘
             │             │             │
             ▼             ▼             ▼
        ┌─────────────────────────────────────┐
        │        Ensemble Forecast (6:4)       │
        └──────────────────┬──────────────────┘
                           │
                           ▼
        ┌─────────────────────────────────────┐
        │      Stress Score Engine (0-100)     │
        │   🟢 Normal · 🟡 Elevated · 🔴 Critical │
        └──────────────────┬──────────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
      ┌──────────┐  ┌──────────┐  ┌──────────┐
      │ Next.js  │  │  Public  │  │ SendGrid │
      │Dashboard │  │ REST API │  │  Alerts  │
      └──────────┘  └──────────┘  └──────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), Tailwind CSS, Framer Motion, Recharts, react-simple-maps |
| Backend | FastAPI, Python 3.11, Pydantic |
| ML | XGBoost, Prophet, SHAP, scikit-learn, TimeSeriesSplit CV |
| Database | Supabase (PostgreSQL) |
| AI | Google Gemini API (RAG-based assistant) |
| Maps | react-simple-maps (SVG choropleth) |
| Alerts | SendGrid (HTML email with dark theme) |
| DevOps | Docker, docker-compose, GitHub Actions CI/CD |
| Deploy | Vercel (frontend) + Render (backend) |

## Features

- ⚡ **Multi-source ETL** — Automated pipelines ingesting Eurostat tourism/energy data, OpenMeteo weather, and OpenSky flight arrivals with caching + retry
- 🤖 **Ensemble ML Forecasting** — XGBoost (TimeSeriesSplit cross-validation) + Prophet (custom tourism seasonality) weighted 60:40
- 🧠 **Explainable AI** — SHAP TreeExplainer with global importance, per-prediction breakdown, and Gemini-generated plain-English explanations
- 🚦 **Tourism Energy Stress Score** — 0-100 score with 🔴 CRITICAL / 🟡 ELEVATED / 🟢 NORMAL classification from 4 weighted factors
- 🗺️ **Interactive Europe Map** — Country-level stress visualisation with clickable detail panel
- 📧 **Automated Email Alerts** — Dark-themed HTML alerts sent via SendGrid when stress is elevated or critical
- 🔄 **Scenario Simulator** — Adjust tourist arrivals, temperature, flights, and events to see projected stress impact
- 🤖 **AI Assistant** — Chat interface powered by Gemini for natural-language questions about forecasts and stress scores
- 🔑 **Public REST API** — Key-authenticated API with rate limiting (100 req/h) for forecast and stress score data
- 🐳 **Docker + CI/CD** — Production-ready containers with GitHub Actions automated testing and Docker build

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+
- Docker & docker-compose (optional)
- Supabase account
- SendGrid account (for email alerts)
- Google Gemini API key (for AI assistant)

### Local Setup

```bash
# Clone
git clone https://github.com/aathiftr2005-debug/tourism-energy-intelligence
cd tourism-energy-intelligence

# Backend
cd backend
cp .env.example .env
# Edit .env with your API keys
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:3000 for the dashboard and http://localhost:8000/docs for the API.

### Docker Setup

```bash
docker-compose up --build
```

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | Yes |
| `SENDGRID_API_KEY` | SendGrid API key for alerts | For alerts |
| `ALERT_RECIPIENT_EMAIL` | Default alert destination | For alerts |
| `GEMINI_API_KEY` | Google Gemini API key | For AI features |
| `WEATHER_API_KEY` | OpenWeatherMap API key | Weather fallback |
| `ENVIRONMENT` | `development` or `production` | No |

### Frontend (`frontend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:8000` |

## API Usage

### Get an API Key

```bash
curl -X POST https://your-api.com/api/v1/public/keys/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Your Name", "email": "you@email.com"}'
```

### Query the API

```bash
# 12-month ensemble forecast for Germany
curl https://your-api.com/api/v1/public/forecast/DE \
  -H "X-API-Key: TEI-your-key-here"

# Latest stress score for Spain
curl https://your-api.com/api/v1/public/stress-score/ES \
  -H "X-API-Key: TEI-your-key-here"

# All stress scores
curl https://your-api.com/api/v1/public/stress-score/all \
  -H "X-API-Key: TEI-your-key-here"

# Supported regions
curl https://your-api.com/api/v1/public/regions \
  -H "X-API-Key: TEI-your-key-here"
```

### Internal Endpoints (no auth)

```bash
# Health check
curl https://your-api.com/health

# API documentation (no auth)
curl https://your-api.com/api/v1/public/docs-info

# Trigger ETL pipeline (all 10 countries)
curl -X POST https://your-api.com/api/v1/etl/run

# Trigger ML model training (background job)
curl -X POST https://your-api.com/api/v1/ml/train
```

## Data Sources

| Source | Dataset | Variables | Update Frequency |
|--------|---------|-----------|-----------------|
| **Eurostat** | `tour_occ_nim` | Tourist nights by country/month | Monthly |
| **Eurostat** | `nrg_cb_em` | Energy consumption (GWh) | Monthly |
| **OpenMeteo** | Archive API | Temperature, precipitation, sunshine | Daily |
| **OpenSky** | Flight arrivals | International arrival counts | Real-time |

**Target countries:** Germany (DE), France (FR), Spain (ES), Italy (IT), Austria (AT), Greece (GR), Portugal (PT), Netherlands (NL), Belgium (BE), Czech Republic (CZ)

## Deployment

### Backend (Render)

1. Create a new Web Service on Render
2. Set root directory to `backend`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add all environment variables from `backend/.env.example`

### Frontend (Vercel)

1. Import repository on Vercel
2. Set root directory to `frontend`
3. Framework preset: Next.js
4. Add environment variable: `NEXT_PUBLIC_API_URL` = your Render backend URL
5. Deploy

## Project Structure

```
tourism-energy-intelligence/
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── api/routes/       # API endpoints (7 route files)
│   │   ├── core/             # Config, database, auth
│   │   ├── etl/              # Eurostat, Weather, Flights, Pipeline
│   │   ├── ml/               # Features, Train, Forecast, SHAP, Stress Score
│   │   ├── services/         # Alerts, Scheduler
│   │   └── main.py           # FastAPI entry point
│   ├── tests/                # Pytest test suite
│   ├── supabase/migrations/  # SQL migrations
│   └── requirements.txt
│
├── frontend/                 # Next.js 14 application
│   ├── app/                  # 8 route pages
│   ├── components/           # UI + Chart components
│   ├── lib/                  # API client + TypeScript types
│   └── package.json
│
├── ml/                       # ML notebooks & data
├── .github/workflows/        # CI/CD pipeline
├── docker-compose.yml
└── README.md
```

## Roadmap

- [ ] **Real-time WebSocket** stress score updates
- [ ] **Mobile app** (React Native)
- [ ] **Additional countries** (Nordics, Baltics, Balkans)
- [ ] **Carbon footprint** correlation layer
- [ ] **Multi-language** support (DE, FR, ES)
- [ ] **Historical backtesting** dashboard
- [ ] **Slack/Discord** alert integrations

## License

MIT License — see [LICENSE](LICENSE) for details.

## Author

**Aathif TR** — [GitHub](https://github.com/aathiftr2005-debug) — [LinkedIn](https://www.linkedin.com/in/aathif-tr-)

---

<p align="center">Built with ⚡ for European energy resilience</p>
