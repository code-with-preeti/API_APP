# Frontend (React UI)

This folder is the **website** users see in the browser (login, register, dashboard).

The **backend API** is in the parent folder (`../`). Do not run `npm install` for the API here.

## Development

```bash
npm install
npm run dev
```

Open http://localhost:5173 (Vite proxies `/api` to the backend on port 4000).

## Production build

```bash
npm run build
```

Output is in `dist/`. In Docker, Nginx serves this and proxies API calls to the backend.

Full instructions: [../DEPLOY.md](../DEPLOY.md)
