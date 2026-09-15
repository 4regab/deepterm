#!/usr/bin/env bash
set -euo pipefail

# pnpm is the dependency manager; Bun is the project's test runner and dev runtime.
# The environment must provide Node.js 20+ with Corepack.
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 20+ is required" >&2
  exit 1
fi
if ! command -v corepack >/dev/null 2>&1; then
  echo "Corepack is required to install the pinned pnpm version" >&2
  exit 1
fi

# Install Bun once (idempotent) into the user's home, which is captured by the
# environment snapshot so subsequent boots reuse it.
if [ ! -x "$HOME/.bun/bin/bun" ]; then
  curl -fsSL https://bun.sh/install | bash
fi

export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

bun --version
corepack enable
corepack install
pnpm --version
pnpm install --frozen-lockfile
