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

cd "$APP_DIR"

current_user=$(id -un)
current_group=$(id -gn)

if [ ! -w "$APP_DIR" ] || { [ -d "$APP_DIR/.git" ] && [ ! -w "$APP_DIR/.git" ]; }; then
  app_meta=$(stat -c '%A %U:%G' "$APP_DIR")
  git_meta=$(stat -c '%A %U:%G' "$APP_DIR/.git" 2>/dev/null || echo 'unknown')
  echo "Deployment user ${current_user}:${current_group} cannot write to $APP_DIR." >&2
  echo "Current permissions: $APP_DIR=$app_meta, $APP_DIR/.git=$git_meta" >&2
  echo "Fix on the host: sudo chown -R ${current_user}:${current_group} \"$APP_DIR\" && sudo chmod -R u+rwX \"$APP_DIR\"" >&2
  exit 1
fi

if ! git config --global --get-all safe.directory | grep -Fx "$APP_DIR" >/dev/null 2>&1; then
  git config --global --add safe.directory "$APP_DIR"
fi

if [ ! -d .git ]; then
  git init
fi

if git remote | grep -Fx origin >/dev/null 2>&1; then
  git remote set-url origin "$REPO_URL"
else
  git remote add origin "$REPO_URL"
fi

git fetch origin "$DEPLOY_BRANCH"
git checkout -B "$DEPLOY_BRANCH" "origin/$DEPLOY_BRANCH"
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
