# Create from document

Auth-gated wizard at `/materials/create`: upload or paste → choose Flashcards or Study Guide → AI generate → review → save.

## Sub-features

- File dropzone (PDF, DOCX, PNG, JPG, WebP)
- Paste text / manual entry
- Turnstile captcha when configured
- Draft restore via sessionStorage (file blob cannot restore)

## How to get to it (user POV)

Sign in → Materials → Create, or `/materials/create`.

## Driving it with verify-deepterm

1. Authenticated browser session
2. Open `/materials/create`
3. Confirm copy says **Up to 4MB**
4. Upload a small PDF/DOCX or paste text
5. Choose Flashcards or Reviewer, run Generate
6. Expect review step with cards/sections

Without auth: run `bun test src/tests/utils/generateUploadLimits.test.ts` and the generate-cards integration suite.

## Gotchas

- Vercel Function body limit is **4.5MB**; uploads above ~4MB fail with 413 in production if the UI allowed them
- After refresh, a restored file name without a live `File` must force re-select
- Reviewer and flashcards share the same 4MB upload ceiling
