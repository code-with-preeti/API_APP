#!/usr/bin/env bash
# One-command deploy: Postgres + Redis + Backend + Frontend
set -euo pipefail

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required. Install Docker, then run this script again."
  exit 1
fi

echo "Building and starting all services..."
docker compose up -d --build

echo ""
echo "Done."
echo "  Frontend (open in browser): http://localhost:8080"
echo "  Backend API (optional):     http://localhost:4000"
echo ""
echo "Stop everything: docker compose down"
