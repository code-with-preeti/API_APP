# API Sentinel

API monitoring app with a React dashboard and a Node.js backend.

## Frontend vs backend (read this first)

| | **Backend** | **Frontend** |
|---|-------------|--------------|
| **Folder** | Project root (`API_APP/`) | `frontend/` |
| **What it does** | REST API, WebSocket, DB, job queue | Login, register, dashboard UI |
| **Start (dev)** | `npm run dev` (from root) | `npm run dev` (from `frontend/`) |
| **URL (dev)** | http://localhost:4000 | http://localhost:5173 |

The backend needs **3 processes**: `server`, `scheduler`, and `worker`. `npm run dev` starts all three.

**Full deployment guide:** see [DEPLOY.md](./DEPLOY.md)

## Quickest way to run everything (Docker)

```bash
./deploy.sh
# Open http://localhost:8080
```

## Local development

```bash
# 1) Database + Redis
docker compose up -d postgres redis

# 2) Backend (project root)
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate:deploy
npm run dev

# 3) Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Features

- Postman-style monitor creation (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`)
- Redis + BullMQ queue architecture
- Separate scheduler, worker, and server processes
- WebSocket real-time updates
- PostgreSQL history (latest 10 checks per API)
- Rate limiting + JWT auth

## Tech stack

- Backend: Node.js, Express, Prisma, PostgreSQL, Redis, BullMQ, WebSocket
- Frontend: React, Vite, TypeScript, Tailwind
