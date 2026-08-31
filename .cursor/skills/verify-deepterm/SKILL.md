---
name: verify-deepterm
description: "Drive DeepTerm (Next.js study app) the way a user does — landing, auth-gated materials create, and generate APIs. Use when proving upload→AI convert, create wizard, or dashboard flows work."
---

# Verify DeepTerm

Project-local control skill for agents. Read cold: this is how you launch, doctor, drive, capture evidence, and clean up without guessing.

## Launch

```bash
cd /workspace
test -f .env.local || echo "missing .env.local (Supabase + Gemini + optional Turnstile)"
bun install
bun run dev
```

Ready when stdout shows `Local: http://localhost:3000` (or the next free port). Default port **3000**.

Teardown: kill the PID you started (from the terminal header / `lsof -i :3000`), never `pkill -f next`.

## Doctor

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
bun -e 'import { MAX_GENERATE_UPLOAD_BYTES, VERCEL_FUNCTION_BODY_LIMIT_BYTES } from "./src/utils/generateInput.ts"; if (!(MAX_GENERATE_UPLOAD_BYTES < VERCEL_FUNCTION_BODY_LIMIT_BYTES)) process.exit(1)'
test -n "$NEXT_PUBLIC_SUPABASE_URL" -o -f .env.local
```

Expect: home returns `200`, upload ceiling is under Vercel’s 4.5MB body limit, env present.

## Drive

Primary surface: **web UI** via browser/CDP (`computerUse` or Browser-use). Auth-gated paths need a signed-in session cookie.

Stable entry points:

| Path | Gate | Purpose |
|------|------|---------|
| `/` | public | Landing |
| `/materials/create` | auth | Upload → flashcards / study guide (reviewer) |
| `/materials` | auth | Library |
| `POST /api/generate-cards` | auth + CSRF + Turnstile | AI flashcards |
| `POST /api/generate-reviewer` | auth + CSRF + Turnstile | AI study guide |

Create wizard selectors (prefer role/text over coordinates):

- Source step: dropzone “Drag and drop your document”, “Up to 4MB”
- Configure: Flashcards vs Reviewer / study guide
- Generate: primary generate CTA; Captcha modal when Turnstile site key is set

Without a browser session, drive the **API contract** with `bun test src/tests/api/generate-cards.integration.test.ts` and `bun test src/tests/utils/generateUploadLimits.test.ts`.

Helper:

```bash
.cursor/skills/verify-deepterm/scripts/doctor.sh
```

## Evidence

Store proofs under `/opt/cursor/artifacts/verify-deepterm/` (or `/tmp/verify-deepterm/` locally). Keep:

1. Screenshot or video of `/materials/create` source step showing the **4MB** limit copy
2. Test transcript proving >4MB files are rejected (`File too large`)
3. Optional: successful text-paste generate (auth required)

Proof standards: real user path when authenticated; otherwise the integration tests above. Do not treat “page compiles” as proof of upload→AI.

## Cleanup

Stop only the `bun run dev` / `next` process you started. Leave evidence files in place. Do not delete `/opt/cursor/artifacts/verify-deepterm/*` proofs.

## Helpers

- `scripts/doctor.sh` — port + limit + env sanity
- Feature map: `features/` (index + one file per feature)
