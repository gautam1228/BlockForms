#!/usr/bin/env bash
# Always loads .env.production for compose variable substitution + container env.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-.env.production}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE — copy .env.production.example and fill it in."
  exit 1
fi

exec docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" "$@"
