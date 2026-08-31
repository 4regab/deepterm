# Materials library

Auth-gated `/materials` lists saved flashcard sets and reviewers; open detail for study/practice.

## Sub-features

- Folders, rename, delete, share
- Practice tests built client-side from cards (not from upload)

## How to get to it (user POV)

Sign in → Materials in sidebar.

## Driving it with verify-deepterm

Browser: `/materials` after auth. Empty state should offer Create.

## Gotchas

Soft-deleted accounts are restricted by `src/proxy.ts` to `/`, `/auth`, `/account`.
