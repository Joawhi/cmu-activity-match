#!/usr/bin/env bash
# Per-boot startup: bring the local Postgres cluster online before the backend
# and frontend terminals launch. Safe to run repeatedly.
set -euo pipefail

DB_USER="cmu"
DB_PASSWORD="cmu_dev_password"
DB_NAME="cmu_activity_match"

PG_VERSION="$(pg_lsclusters -h | awk 'NR==1{print $1}')"
: "${PG_VERSION:=16}"

echo "==> Starting PostgreSQL cluster '$PG_VERSION main' (if not already running)"
if ! pg_lsclusters -h | grep -q "online"; then
  sudo pg_ctlcluster "$PG_VERSION" main start
fi

# Wait for the server to accept connections.
for _ in $(seq 1 30); do
  if sudo -u postgres pg_isready -q; then break; fi
  sleep 1
done

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

echo "==> Postgres is ready"
