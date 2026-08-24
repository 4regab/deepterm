# DeepTerm

AI study app: notes/PDFs → flashcards, reviewers, practice tests.

- Canonical origin: `https://deepterm.app` (www allowed; nothing else)
- Repo: `4regab/deepterm`
- Live Supabase: `lopurzvtignkqyubqgtz` (`ap-southeast-1`)

Stack: Next.js 16 App Router, React 19, TypeScript, Bun, Tailwind 4, Zustand, Zod, `@supabase/ssr`, Gemini, Cloudflare Turnstile, Vercel.

`README.md` env names and some paths are stale. This file wins.

## Commands

```bash
bun install
bun run dev              # bun --bun next dev
bun run build
bun run lint
bun test                 # bun:test, files under src/tests/
bun test --watch
bunx tsc --noEmit
bun audit                # must be clean before opening a PR
```

No `middleware.ts`. Next 16 entry is `src/proxy.ts`.

## Layout

```
src/app/(dashboard)/                 # auth-gated UI
src/components/DashboardChrome.tsx   # client chrome (sidebar, padding)
src/app/api/                         # Route Handlers
src/app/auth/callback/               # OAuth code exchange
src/config/supabase/                 # browser + server clients
src/lib/auth/                        # origins, CSRF, session cache
src/lib/supabase/                    # SQL notes — lag live DB
src/services/                        # Gemini rotation, Turnstile, rate limit
src/lib/stores/                      # Zustand
src/proxy.ts                         # CSP nonce, CORS, session refresh, gates
```

Protected prefixes in `src/proxy.ts`: `/dashboard`, `/materials`, `/pomodoro`, `/practice`, `/reviewer`, `/account`, `/achievements`, `/api/generate-cards`, `/api/generate-reviewer`, `/api/share`.

## Auth

- Identity: `supabase.auth.getUser()`. Never `getSession()` for authorization.
- RSC helper: `getSession()` in `src/lib/auth/session.ts` (React `cache()` wrapping `getUser()`).
- Cookie client: `createServerSupabaseClient()` from `@/config/supabase/server`.
- Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`.
- Soft-delete: `profiles.deleted_at` set → proxy allows `/`, `/auth`, `/account` only.
- OAuth redirects: `getTrustedOrigin()` in `src/lib/auth/trustedOrigins.ts`. Never reflect `Host`.

## Cookie-auth APIs (CSRF)

Cookie Route Handlers must call `forbiddenUnlessSameOrigin(request)` (`src/lib/auth/assertSameOrigin.ts`).

Wired: `/api/generate-cards`, `/api/generate-reviewer`, `/api/share`, `/api/share/copy`.

Do **not** Origin-check cron. Cron is `Authorization: Bearer ${CRON_SECRET}`:

- `GET /api/cron/generate-article`
- `GET /api/cron/finalize-deletions`
- `POST /api/blog/generate`

Prod: missing Origin and Referer → 403. CORS is `/api/*` only via `isTrustedOrigin`.

## Security invariants

- CSP is per-request in `src/proxy.ts` (nonce). No static CSP in `next.config.ts`.
- `frame-ancestors 'none'`, `object-src 'none'`, `upgrade-insecure-requests` in prod.
- JSON-LD: `serializeJsonLd()` in `src/lib/seo.ts`.
- Generate/share: `Cache-Control: private, no-store`.
- AI usage writes only via RPC `check_and_increment_ai_usage`.
- Share IDs: UUID + type.
- `SUPABASE_SECRET_KEY` is server-only.

## Database

Live DB is ahead of `src/lib/supabase/*.sql`. Those files are notes, not a replay script.

Already true in production:

- RLS on every public table
- SECURITY DEFINER uses `SET search_path = ''`
- Internal helpers live in `private` (not in PostgREST)

App RPC names (what TypeScript calls):

- Public read: `get_published_posts`, `get_post_by_slug`, `get_category_post_counts`, `get_shared_material`
- User: `add_xp`, `check_and_increment_ai_usage`, dashboard/stats/deletion self-service
- Admin / cron: `finalize_account_deletions` (`service_role` only)

`003_security_hardening.sql` is already applied. Do not re-run it blindly.

New SQL: helpers in `private`; `search_path = ''`; grant EXECUTE explicitly; never `GRANT … TO PUBLIC`.

Unlimited bypass: app still `select`s `unlimited_users`. `002` moved `check_user_is_unlimited` to `private` — do not expose it over REST.

## AI / limits

- 10 generations / user / day unless row in `unlimited_users`.
- Keys: `GEMINI_API_KEY` plus `GEMINI_API_KEY_1`…`GEMINI_API_KEY_5`. Rotation: `src/services/geminiClient.ts` (not `src/config/gemini.ts`).
- Turnstile optional. Hostname allowlist: `TURNSTILE_HOSTNAMES`.

## Tests

Bun test + `src/tests/setup.ts`. Prefer factories there.

`fetch` mocks: `as unknown as typeof fetch` (`preconnect` exists on `typeof fetch`).

## UI

- Dashboard layout is a server wrapper; chrome stays in `DashboardChrome`.
- React Compiler is on. Don’t add `useMemo` / `useCallback` unless measured.
- Cache Components (`cacheComponents: true`) is **off**. Don’t flip it in a drive-by.

## Git

- Author: `4regab <4regab@gmail.com>`.
- No `Co-authored-by`, Cursor, or “made with” trailers.
- Don’t commit unless asked. Don’t force-push `main`.
- Messages: `feat(security): …`, `fix(auth): …`.
- Before opening a PR, run `bun audit` and fix every finding (0 vulnerabilities). Nested holes go in `package.json` `overrides`. Use npm nested objects (`"postcss": { ".": "…", "nanoid": "…" }`), never `parent>child` keys — Vercel may run `npm install`. Do not open or update a PR with a dirty audit.

## Don’t

- Don’t trust `auth.getSession()` or the request `Host` header.
- Don’t widen CORS onto documents. Don’t set `frame-ancestors 'self'`.
- Don’t call admin RPCs from the browser.
- Don’t put Origin CSRF on Bearer cron routes.
- Don’t “fix” live grants by replaying `001` / `002` SQL.
- Don’t enable leaked-password protection via SQL — Auth dashboard only.
