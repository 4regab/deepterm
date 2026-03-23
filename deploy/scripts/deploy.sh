#!/usr/bin/env bash

set -euo pipefail

APP_DIR=${APP_DIR:-/opt/deepterm}
DEPLOY_BRANCH=${DEPLOY_BRANCH:-main}
DEEPTERM_ENV_FILE=${DEEPTERM_ENV_FILE:-/opt/deepterm/.env}
REPO_URL=${REPO_URL:-https://github.com/4regab/deepterm.git}

for command in git docker; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "Missing required command: $command" >&2
    exit 1
  fi
done

if ! docker compose version >/dev/null 2>&1; then
  echo 'docker compose is required on the deployment host' >&2
  exit 1
fi

if [ ! -f "$DEEPTERM_ENV_FILE" ]; then
  echo "Missing environment file: $DEEPTERM_ENV_FILE" >&2
  exit 1
fi

mkdir -p "$APP_DIR"

if [ ! -d "$APP_DIR/.git" ]; then
  git clone --branch "$DEPLOY_BRANCH" "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"

git fetch origin "$DEPLOY_BRANCH"
git reset --hard "origin/$DEPLOY_BRANCH"

set -a
# shellcheck disable=SC1090
. "$DEEPTERM_ENV_FILE"
set +a

export DEEPTERM_ENV_FILE

docker compose build --pull
docker compose up -d --remove-orphans
docker compose ps
docker image prune -f >/dev/null 2>&1 || true
