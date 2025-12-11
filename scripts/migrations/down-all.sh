#!/bin/bash

ENV_FILE=".env"
export $(cat $ENV_FILE | grep -v '^#' | xargs)

echo "Running migration for $ENV environment..."

# Test rollback
migrate -database "${DATABASE_URL}" -path src/db/migrations down