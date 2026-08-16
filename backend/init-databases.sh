#!/bin/bash
# This script runs when the PostgreSQL container starts
# It creates the main database (tenants database is created by POSTGRES_DB env var)

set -e

echo "Creating main database..."

# Create the main database (using old syntax for compatibility)
psql -v ON_ERROR_STOP=0 --username "$POSTGRES_USER" --dbname "postgres" <<-EOSQL
  CREATE DATABASE maryaipgdb_main;
EOSQL

echo "✓ Main database created: maryaipgdb_main"
echo "✓ Tenants database: maryaipgdb (created via POSTGRES_DB env var)"
