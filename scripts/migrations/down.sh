#!/bin/bash

DOWNS=$1

if [ -z "$DOWNS" ]; then
    echo "Error: Number of rollbacks is required"
    echo "Usage: ./scripts/migrate-down.sh <number_of_rollbacks>"
    exit 1
fi

ENV_FILE=".env"
export $(cat $ENV_FILE | grep -v '^#' | xargs)

echo ""
echo "Rolling back (down ${DOWNS})..."
migrate -database "${DATABASE_URL}" -path src/db/migrations down ${DOWNS}