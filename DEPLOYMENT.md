# Deployment

## Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)
- Python 3.11+ (for backend development)
- PostgreSQL 16 (for database)

## Quick Start (Docker)

```bash
# 1. Clone and enter the project
git clone <repo-url>
cd tourism-energy-intelligence

# 2. Set up environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit .env files with your API keys

# 3. Build and start all services
docker compose up --build
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/docs
- **Database**: localhost:5432

## Local Development

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your configuration
npm run dev
```

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your Supabase credentials
uvicorn app.main:app --reload --port 8000
```

## Environment Variables

See `.env.example` files in both `frontend/` and `backend/` directories for all required variables.

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API URL |
| `AUTH_SECRET` | Yes | JWT signing secret |
| `OPEN_METEO_BASE_URL` | No | Weather API endpoint |
| `ENTSOE_API_KEY` | No* | ENTSO-E Transparency key |
| `ELECTRICITY_MAPS_TOKEN` | No* | Electricity Maps token |
| `OPENAQ_API_KEY` | No | OpenAQ API key |
| `GDACS_RSS_URL` | No | GDACS RSS feed URL |
| `DATABASE_URL` | No | PostgreSQL connection string |

\* Without these keys, the corresponding features gracefully fall back to local JSON data.

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_KEY` | Yes | Supabase service role key |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `SENDGRID_API_KEY` | No | SendGrid for email alerts |

## Production Build

### Frontend

```bash
cd frontend
npm run build
npm start
```

The frontend Dockerfile uses multi-stage builds for optimal size:
1. `deps` — Install npm dependencies
2. `builder` — Build the Next.js application
3. `runner` — Production runtime with standalone output

### Backend

```bash
cd backend
docker build -t tei-backend .
docker run -p 8000:8000 tei-backend
```

## CI/CD

GitHub Actions workflows are in `.github/workflows/`:

- **ci.yml** — Runs on push/PR to main/develop:
  1. Frontend lint & TypeScript check
  2. Frontend production build
  3. Backend Python tests
  4. Docker image build

- **deploy.yml** — Runs on push to main:
  1. Builds and pushes Docker images to GitHub Container Registry
  2. Tags with `latest` and commit SHA

## Database Migrations

Migrations are in `database/migrations/` and are applied automatically when using Docker Compose (via the postgres init script). For manual application:

```bash
psql -h localhost -U postgres -d tei -f database/migrations/001_initial.sql
psql -h localhost -U postgres -d tei -f database/seed.sql
```
