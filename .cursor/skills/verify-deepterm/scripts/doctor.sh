#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
cd "$ROOT"

code="$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ || true)"
if [[ "$code" != "200" ]]; then
  echo "doctor: home not ready (HTTP $code). Start with: bun run dev"
  exit 1
fi

bun -e '
import {
  MAX_GENERATE_UPLOAD_BYTES,
  VERCEL_FUNCTION_BODY_LIMIT_BYTES,
} from "./src/utils/generateInput.ts"
if (!(MAX_GENERATE_UPLOAD_BYTES < VERCEL_FUNCTION_BODY_LIMIT_BYTES)) {
  console.error("doctor: upload ceiling exceeds Vercel body limit")
  process.exit(1)
}
console.log("doctor: upload ceiling", MAX_GENERATE_UPLOAD_BYTES, "<", VERCEL_FUNCTION_BODY_LIMIT_BYTES)
'

if [[ ! -f .env.local ]] && [[ -z "${NEXT_PUBLIC_SUPABASE_URL:-}" ]]; then
  echo "doctor: missing Supabase env"
  exit 1
fi

echo "doctor: ok"
