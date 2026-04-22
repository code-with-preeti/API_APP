# API Sentinel

Backend service that lets users register/login and monitor APIs on a fixed interval.  
It stores status + response time history (last 10 checks) and calculates uptime.

## Prerequisites

- Node.js \(>= 18; you have Node 22\)
- PostgreSQL running locally

## 1) Configure environment

Create/update `.env` in the repo root:

```env
DATABASE_URL="postgres://<user>:<password>@localhost:5432/<db>?schema=public"
JWT_SECRET="change-me"
# Optional (comma-separated). Example:
# CORS_ORIGIN="http://localhost:5173"
```

### Quick local Postgres setup (Ubuntu)

If you want a dedicated DB user/password (recommended):

```bash
sudo -u postgres psql
```

Then inside psql:

```sql
CREATE USER api_sentinel WITH PASSWORD 'mysecret';
CREATE DATABASE My_api_senital OWNER api_sentinel;
GRANT ALL PRIVILEGES ON DATABASE My_api_senital TO api_sentinel;
```

And set:

```env
DATABASE_URL="postgres://api_sentinel:mysecret@localhost:5432/My_api_senital?schema=public"
```

## 2) Install & migrate

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
```

## 3) Run backend (server + worker)

```bash
npm run dev
```

Backend runs at `http://localhost:4000`.

## Frontend (React)

The frontend lives in `frontend/`.

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173` and calls the backend via Vite proxy (`/api` → `http://localhost:4000`).

