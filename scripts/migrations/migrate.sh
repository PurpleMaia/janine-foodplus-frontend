#!/bin/bash

ENV_ARG=$1

case $ENV_ARG in
  d|dev)
    ENV="dev"
    ;;
  p|prod)
    ENV="prod"
    ;;
  *)
    echo "Error: Invalid environment specified"
    echo "Usage: ./scripts/migrate.sh [d|dev|p|prod]"
    exit 1
    ;;
esac

case $ENV in
  dev)
    ENV_FILE=".env"
    export $(cat $ENV_FILE | grep -v '^#' | xargs)
    ;;
  prod)
    ENV_FILE=".env.none"
    export PATH=../bin/:$PATH
    ;;
  *)
    exit 1
    ;;
esac



echo "Running migration test cycle for $ENV environment..."

# Run migration up
echo ""
echo "Running migration up..."
migrate -database "${DATABASE_URL}" -path src/db/migrations up

# Test rollback
echo ""
echo "Testing rollback (down 1)..."
migrate -database "${DATABASE_URL}" -path src/db/migrations down 1

# Run migration up again
echo ""
echo "Running migration back up..."
migrate -database "${DATABASE_URL}" -path src/db/migrations up

echo ""
echo "Migration test cycle completed successfully!"