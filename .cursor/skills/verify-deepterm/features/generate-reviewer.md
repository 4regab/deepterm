# Generate study guide API

`POST /api/generate-reviewer` turns text or a document into categorized terms (`extractionMode`: full | sentence | keywords).

## Sub-features

- Same upload ceiling as flashcards (4MB)
- Exhaustive extraction prompt

## How to get to it (user POV)

Create wizard → Reviewer / study guide → pick extraction mode → Generate.

## Driving it with verify-deepterm

Prefer UI path when signed in. Contract checks: shared `MAX_REVIEWER_FILE_SIZE` === `MAX_GENERATE_UPLOAD_BYTES` via `generateUploadLimits` tests.

## Gotchas

Users may call this “AI slides” or “squeeze”; product name is study guide / reviewer.
