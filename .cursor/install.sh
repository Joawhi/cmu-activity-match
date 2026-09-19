#!/usr/bin/env bash
# Idempotent setup for the CMU Activity Match dev environment.
#
# The backend talks to Postgres via DATABASE_URL and forces an SSL connection
# in code (ssl: { rejectUnauthorized: false } in backend/server.js). The real
# project uses a shared Supabase Postgres, which is unsafe to drive from an
# autonomous agent, so this environment runs a self-contained local Postgres
# (SSL is on by default on Debian/Ubuntu clusters) with throwaway dev
# credentials. No production secret is required.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

DB_USER="cmu"
DB_PASSWORD="cmu_dev_password"
DB_NAME="cmu_activity_match"

echo "==> Installing PostgreSQL (if missing)"
if ! command -v psql >/dev/null 2>&1; then
  sudo apt-get update -y
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql postgresql-contrib
fi

PG_VERSION="$(pg_lsclusters -h | awk 'NR==1{print $1}')"
: "${PG_VERSION:=16}"

echo "==> Ensuring the '$PG_VERSION main' cluster exists and is running"
if ! pg_lsclusters -h | awk '{print $1"/"$2}' | grep -qx "$PG_VERSION/main"; then
  sudo pg_createcluster "$PG_VERSION" main
fi
if ! pg_lsclusters -h | grep -q "online"; then
  sudo pg_ctlcluster "$PG_VERSION" main start
fi

echo "==> Ensuring role and database exist"
sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASSWORD}';
  END IF;
END \$\$;
SQL
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
  sudo -u postgres createdb -O "${DB_USER}" "${DB_NAME}"
fi

echo "==> Writing backend/.env (if missing)"
if [ ! -f backend/.env ]; then
  cat > backend/.env <<ENV
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}
PORT=3001
ENV
fi

echo "==> Writing frontend/.env (if missing)"
if [ ! -f frontend/.env ]; then
  cat > frontend/.env <<ENV
VITE_API_URL=http://localhost:3001
ENV
fi

echo "==> Installing backend dependencies"
(cd backend && npm install)

echo "==> Installing frontend dependencies"
(cd frontend && npm install)

echo "==> Install complete"
