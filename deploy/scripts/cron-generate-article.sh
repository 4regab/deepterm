#!/usr/bin/env bash

set -euo pipefail

APP_URL=${APP_URL:-http://127.0.0.1:3000}
DEEPTERM_ENV_FILE=${DEEPTERM_ENV_FILE:-/opt/deepterm/.env}

if [ ! -f "$DEEPTERM_ENV_FILE" ]; then
  echo "Missing environment file: $DEEPTERM_ENV_FILE" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
. "$DEEPTERM_ENV_FILE"
set +a

if [ -z "${CRON_SECRET:-}" ]; then
  echo 'CRON_SECRET must be set in the environment file' >&2
  exit 1
fi

curl \
  --fail \
  --silent \
  --show-error \
  --max-time 300 \
  --retry 3 \
  --retry-delay 5 \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  "${APP_URL}/api/cron/generate-article"
