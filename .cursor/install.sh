#!/usr/bin/env bash
set -euo pipefail

# Bun is the project's package manager, test runner, and dev runtime.
# Install it once (idempotent) into the user's home, which is captured by the
# environment snapshot so subsequent boots reuse it.
if [ ! -x "$HOME/.bun/bin/bun" ]; then
  curl -fsSL https://bun.sh/install | bash
fi

export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

bun --version
bun install --frozen-lockfile
