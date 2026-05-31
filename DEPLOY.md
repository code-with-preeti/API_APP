# How to deploy API Sentinel

This repo has **two separate apps**. Deploy them in the right folder.

| What | Folder | Technology | Port (local) |
|------|--------|------------|--------------|
| **Backend** (API, database, queues) | Project **root** (`API_APP/`) | Node.js + Express | `4000` |
| **Frontend** (website UI) | **`frontend/`** | React + Vite | `5173` dev, `8080` Docker |

The backend also runs two **background workers** (not a website):

- `scheduler` — queues health checks every 5 seconds  
- `worker` — runs the checks and saves results  

You need **Postgres**, **Redis**, and all **3 backend processes** for monitoring to work.

---

## Option A — Easiest: one command (Docker)

Runs database, backend, scheduler, worker, and frontend together.

```bash
cd /path/to/API_APP
chmod +x deploy.sh
./deploy.sh
```

Or without the script:

```bash
docker compose up -d --build
```

Then open: **http://localhost:8080**

- UI = port **8080**  
- Raw API (optional) = port **4000**  

Stop:

```bash
docker compose down
```

Set a real secret before production (in your shell or a `.env` file in the project root):

```bash
export JWT_SECRET="your-long-random-secret"
docker compose up -d --build
```

---

## Option B — Local development (no Docker for the apps)

### 1. Start only database + Redis

```bash
docker compose up -d postgres redis
```

### 2. Backend (from project root — **not** `frontend/`)

```bash
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate:deploy
npm run dev
```

This starts server + scheduler + worker on port **4000**.

### 3. Frontend (separate terminal)

```bash
cd frontend
npm install
npm run dev
```

Open: **http://localhost:5173**

---

## Option C — Deploy frontend and backend separately (Railway, Render, VPS)

### Backend (root folder)

1. Create a **PostgreSQL** database and **Redis** instance (managed or self-hosted).  
2. Set environment variables:

   | Variable | Example |
   |----------|---------|
   | `DATABASE_URL` | `postgres://user:pass@host:5432/db` |
   | `REDIS_URL` | `redis://host:6379` |
   | `JWT_SECRET` | long random string |
   | `CORS_ORIGIN` | your frontend URL, e.g. `https://myapp.com` |
   | `PORT` | `4000` (or what the host provides) |

3. Build command: `npm install && npm run prisma:generate && npm run build && npm run prisma:migrate:deploy`  
4. Start **three** processes (or three services):

   - `node dist/server.js`  
   - `node dist/scheduler.js`  
   - `node dist/worker.js`  

   Or one dyno: `npm run start:prod`

### Frontend (`frontend/` folder)

1. Build: `npm install && npm run build`  
2. Serve the `frontend/dist` folder with any static host (Vercel, Netlify, Nginx).  
3. Point `/api` and `/ws` to your backend URL (same as `frontend/nginx.conf` in Docker).

If the frontend and backend are on **different domains**, set `CORS_ORIGIN` on the backend to the frontend URL and configure your host to proxy `/api` → backend, or update the frontend to call the full API URL.

---

## Project layout (quick reference)

```
API_APP/                    ← BACKEND lives here
├── src/                    ← API code (server, routes, workers)
├── prisma/                 ← database schema + migrations
├── package.json            ← backend dependencies
├── Dockerfile              ← backend image
├── docker-compose.yml      ← full stack
└── .env                    ← backend secrets (copy from .env.example)

API_APP/frontend/           ← FRONTEND lives here
├── src/                    ← React pages (login, dashboard)
├── package.json            ← frontend dependencies
├── Dockerfile              ← frontend image (Nginx)
└── nginx.conf              ← proxies /api and /ws to backend
```

---

## Common problems

| Problem | Fix |
|---------|-----|
| `Can't reach database` | Start Postgres: `docker compose up -d postgres` |
| `Redis connection refused` | Start Redis: `docker compose up -d redis` |
| Tables missing | Run `npm run prisma:migrate:deploy` from project root |
| Dashboard empty / no checks | Ensure **scheduler** and **worker** are running, not only `server` |
| CORS errors in browser | Set `CORS_ORIGIN` to your frontend URL (with `http://` or `https://`) |
| Ran `npm install` in wrong folder | Root = backend. `cd frontend` = frontend. |
