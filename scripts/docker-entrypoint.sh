#!/bin/sh
set -e

echo "Waiting for database..."
until npx prisma migrate deploy; do
  echo "Migration failed — retrying in 3s..."
  sleep 3
done

echo "Starting: $*"
exec "$@"
