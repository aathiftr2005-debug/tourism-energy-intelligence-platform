# Architecture

## Overview

Tourism Energy Intelligence is a full-stack application for AI-powered seasonal energy demand forecasting in European tourism regions. The system integrates multiple external data sources, processes them through an ML pipeline, and presents actionable insights through a dark-themed dashboard.

```
┌──────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js 14)                    │
│                                                                  │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌───────────────────┐  │
│  │  Pages  │  │Components│  │ Services│  │   API Clients     │  │
│  │ (App    │  │ (UI,     │  │ (Domain │  │ (internal routes) │  │
│  │  Router)│  │  Charts) │  │  Logic) │  │                   │  │
│  └────┬────┘  └────┬─────┘  └────┬────┘  └────────┬──────────┘  │
│       │            │             │                │              │
│       └────────────┴─────────────┴────────────────┘              │
│                            │                                     │
│                   ┌────────┴────────┐                            │
│                   │  Next.js API    │                            │
│                   │  Routes (proxy) │                            │
│                   └────────┬────────┘                            │
└────────────────────────────┼──────────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
         External APIs    Backend       PostgreSQL
         (Open-Meteo,    (FastAPI,      (via Docker)
          ENTSO-E,        ML models)
          Electricity
          Maps, GDACS,
          OpenAQ)
```

## Frontend Architecture

### Layer 1: Pages (`app/`)
Next.js 14 App Router pages for each route.

### Layer 2: Components (`components/`)
Reusable UI components organized by domain:
- `UI/` — Sidebar, KPI cards, loading states, toasts
- `cards/` — Country cards, comparison cards
- `Charts/` — Energy and forecast charts
- `executive/` — AI executive command center panels
- `maps/` — Interactive Europe map and digital twin
- `reports/` — Report generation and export

### Layer 3: Services (`lib/services/`)
Domain services that encapsulate business logic:
- **WeatherService** — Temperature, humidity, conditions
- **EnergyService** — Consumption, grid health, carbon
- **RenewableService** — Renewable percentage by country
- **EmergencyService** — Alerts, risks, recommendations
- **CountryService** — Country metadata and positions
- **TourismService** — Tourist counts
- **ForecastService** — ML forecast data

### Layer 4: API Layer (`lib/api/`)
- `lib/api/*Client.ts` — Five API clients calling internal Next.js routes
- `lib/api/base.ts` — Fetch wrapper with retry and timeout
- `lib/api/cache.ts` — In-memory cache with configurable TTL
- `lib/api/errors.ts` — Typed error hierarchy

### Layer 5: API Routes (`app/api/`)
Next.js Route Handlers that proxy external API calls server-side:
- `/api/weather` → Open-Meteo
- `/api/energy` → ENTSO-E
- `/api/carbon` → Electricity Maps
- `/api/emergency` → GDACS
- `/api/tourism` → Eurostat

### Layer 6: Auth (`lib/auth/`)
- `middleware.ts` — Route protection via JWT cookie validation
- `AuthContext.tsx` — React context for client-side auth state
- `authService.ts` — Login/logout/session management
- `types.ts` — Role definitions and permissions

## Data Flow

1. **User requests** a page → Page component calls a service
2. **Service** calls API client (synchronous return with background refresh)
3. **API client** calls internal Next.js API route
4. **API route** proxies to external API with server-side credentials
5. **Response** flows back: API route → API client → Service → Component
6. **Cache** stores results client-side with domain-specific TTL
7. **Fallback** JSON data loads automatically if any API fails

## External API Dependencies

| API | Service | Auth | TTL |
|-----|---------|------|-----|
| Open-Meteo | Weather | None | 15 min |
| ENTSO-E | Energy | API Key | 15 min |
| Electricity Maps | Carbon/Renewable | API Token | 10 min |
| OpenAQ | Air Quality | Optional | 30 min |
| GDACS | Emergency | None | 5 min |
| Eurostat | Tourism | None | 24 h |
