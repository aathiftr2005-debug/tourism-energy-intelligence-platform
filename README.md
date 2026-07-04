# Tourism Energy Intelligence Platform (TEI)

**AI-powered platform that quantifies tourism-driven energy stress across 10 European countries — from real-time ETL to ensemble ML forecasting to interactive dashboard.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Last Commit](https://img.shields.io/github/last-commit/aathiftr2005-debug/tourism-energy-intelligence-platform)](https://github.com/aathiftr2005-debug/tourism-energy-intelligence-platform/commits/main)
[![Stack: Next.js + FastAPI](https://img.shields.io/badge/Stack-Next.js_14_|_FastAPI-black?logo=next.js)](https://github.com/aathiftr2005-debug/tourism-energy-intelligence-platform)
[![Live Demo](https://img.shields.io/badge/Live-Vercel-000?logo=vercel)](https://tourism-energy-intelligence-platfor.vercel.app)

[**Live Demo**](https://tourism-energy-intelligence-platfor.vercel.app) · [API Docs](./API.md) · [Architecture](./ARCHITECTURE.md) · [Deployment](./DEPLOYMENT.md)

---

### The Problem

European tourism regions experience extreme seasonal energy demand spikes driven by tourist influx, weather patterns, and large-scale events. Grid operators lack the predictive tools needed to balance supply and demand, often resorting to expensive last-minute capacity purchases or risking brownouts.

### What It Does

| Capability | Description |
|---|---|
| **Multi-source ETL** | Automated pipelines ingest Eurostat tourism/energy data, Open-Meteo weather, and OpenSky flight arrivals with caching + retry |
| **Ensemble ML Forecasting** | XGBoost (TimeSeriesSplit CV) + Prophet (custom seasonality) weighted 60:40 produce 12‑month energy demand forecasts |
| **Stress Score (0‑100)** | Novel composite index from 4 weighted factors with traffic‑light classification: Normal / Elevated / Critical |
| **Explainable AI** | SHAP TreeExplainer with per‑prediction breakdown + Gemini‑generated plain‑English explanations |
| **Digital Twin Map** | Country‑level stress visualization with clickable detail panel, timeline projection, and risk factor breakdown |
| **Public REST API** | Key‑authenticated API (100 req/h) serving forecast, stress score, and region data — fully documented in [API.md](./API.md) |

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), Tailwind CSS, Framer Motion, Recharts |
| Backend | FastAPI, Python 3.11, Pydantic |
| Machine Learning | XGBoost, Prophet, SHAP, scikit-learn, TimeSeriesSplit |
| Database | Supabase / PostgreSQL |
| AI | Google Gemini API (RAG‑based assistant & insight generation) |
| Data Sources | Eurostat, Open‑Meteo, OpenSky Network |
| DevOps | Docker, docker-compose, GitHub Actions CI/CD |
| Deployment | Vercel (frontend) + Render (backend) |

### Architecture

```mermaid
flowchart LR
    A[Eurostat API<br/>Tourism & Energy] --> D[ETL Pipeline]
    B[Open-Meteo<br/>Weather Archive] --> D
    C[OpenSky Network<br/>Flight Arrivals] --> D
    D --> E[Supabase / PostgreSQL]
    E --> F[Feature Engine<br/>Lags · Rolling · Calendar]
    F --> G[XGBoost<br/>TSS CV]
    F --> H[Prophet<br/>Seasonality]
    G --> I[Ensemble Forecast<br/>60:40 Weighted]
    H --> I
    I --> J[Stress Score<br/>0-100 Classifier]
    J --> K[Next.js Dashboard<br/>7 Pages]
    J --> L[REST API<br/>Key-Auth]
```

### Screenshots

<table>
  <tr>
    <td width="50%"><img src="assets/screenshots/dashboard-home.png" alt="TEI Dashboard - KPI cards, Europe stress map, top-10 leaderboard" width="100%"></td>
    <td width="50%"><img src="assets/screenshots/stress-map.png" alt="TEI Stress Map - country heatmap with detail panel and timeline projection" width="100%"></td>
  </tr>
  <tr>
    <td width="50%"><img src="assets/screenshots/forecast-chart.png" alt="TEI Forecast - ensemble ML predictions with model metrics and seasonal analysis" width="100%"></td>
    <td width="50%"><img src="assets/screenshots/overview.png" alt="TEI Executive Overview - strategic summary and decision support" width="100%"></td>
  </tr>
</table>

### Quick Start

```bash
# 1. Clone
git clone https://github.com/aathiftr2005-debug/tourism-energy-intelligence-platform
cd tourism-energy-intelligence-platform

# 2. Backend
cd backend && cp .env.example .env   # add your API keys
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 3. Frontend (new terminal)
cd frontend && cp .env.example .env
npm install && npm run dev
```

Open `http://localhost:3000` for the dashboard and `http://localhost:8000/docs` for the Swagger API.

### Live Highlights

The model currently flags **Spain (78)**, **Greece (71)**, and **Italy (65)** as **CRITICAL** — driven by elevated tourism demand, high summer temperatures, and increased flight traffic. These scores trigger automated email alerts and surface priority recommendations on the dashboard. The system monitors all 10 countries continuously and updates scores with each ETL run.

### Project Structure

```
backend/            FastAPI app — routes, ETL pipelines, ML training, services
frontend/           Next.js 14 app — 8 route pages, UI components, API client
ml/                 Jupyter notebooks for model development and evaluation
database/           Supabase migrations and schema definitions
```

### Documentation

- [**API.md**](./API.md) — Full REST API reference with request/response examples
- [**ARCHITECTURE.md**](./ARCHITECTURE.md) — System design, data flow, component decisions
- [**DATABASE.md**](./DATABASE.md) — Schema, indexes, and migration strategy
- [**DEPLOYMENT.md**](./DEPLOYMENT.md) — Production setup for Vercel + Render + Docker

### Author

**Aathif T.R** — Final-year CSE student  
[GitHub](https://github.com/aathiftr2005-debug) · [LinkedIn](https://www.linkedin.com/in/aathif-tr-)

### License

MIT — see [LICENSE](LICENSE).
