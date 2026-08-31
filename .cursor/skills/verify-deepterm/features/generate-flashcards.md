# Generate flashcards API

`POST /api/generate-cards` turns text or a document into `{ cards: [{ term, definition }] }`.

## Sub-features

- MIME allowlist + size guard
- DOCX via mammoth; PDF/images via Gemini Files API
- Daily AI quota + Turnstile + same-origin CSRF

## How to get to it (user POV)

Create wizard → Flashcards → Generate.

## Driving it with verify-deepterm

```bash
bun test src/tests/api/generate-cards.integration.test.ts
```

Expect: >4MB file → 400 `File too large`; valid text → 200 with cards (mocked Gemini in tests).

## Gotchas

`maxDuration` is 90s. Client aborts at 90s. Do not raise upload size without a Blob/direct-to-Gemini path around Vercel’s 4.5MB body cap.
