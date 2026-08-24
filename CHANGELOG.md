# Changelog

All notable changes to DeepTerm will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.3.0] - 2026-08-25

### Added

- Gemini now loads `GEMINI_API_KEY` as well as numbered rotation keys
- Practice keyboard shortcuts (1–9 / A–D, T/F, Enter)
- Remaining daily AI generations on the create page
- DOCX and image uploads for generation (PDF still supported)
- SM-2 review fields, due dates, folders, share expiry, and usage refund RPCs (see `src/lib/supabase/004_study_integrity.sql`)
- Materials list grouping and folder labels (degrades if the `folder` column is not applied yet)
- Share copy prefers a single transactional RPC, with the previous path as fallback
- Cached share lookups so metadata and the page share one RPC call

### Fixed

- Fill-in-the-blank prompts now show a blank; true/false never lies on a one-card deck
- Practice shuffle uses Fisher–Yates
- Match mode no longer drops flashcard status writes
- Stat/XP increments are chunked so live RPC caps no longer silently drop progress
- Failed or aborted generations refund the daily AI quota
- Reviewer generation now supports abort/timeout, DOCX/images, Zod validation, and quota refunds
- Practice, Learn, and Match persist SM-2 reviews
- Share links can expire after 7 or 30 days
- Practice sessions are saved; dashboard lists cards due today
- Email magic-link sign-in and a basic PWA service worker

---

## [0.2.1] - 2026-01-20

### Added

- Browser tab title now shows Pomodoro timer countdown when running (e.g., "24:55 - Focus Time | DeepTerm")
- Paused timer indicator in tab title with ⏸ symbol
- Tab title automatically restores when navigating away from Pomodoro page

---

## [0.2.0] - 2025-12-27

### Added

- Blog with study tips and guides
- SEO-optimized article pages
- Blog categories and filtering
- Previous/Next article navigation
- Related articles section
- Dynamic OG images for sharing
- Blog link in header and footer
- Sitemap with all blog posts

### Changed

- Updated Resources navigation menu
- Improved footer links

---

## [0.1.3] - 2025-12-10

### Added

- hCaptcha integration for bot protection on authentication
- Graceful fallback when captcha fails to load
- Error handling for captcha script loading issues

### Security

- Bot protection on Google OAuth sign-in flow
- hCaptcha verification before authentication
- Enhanced security against automated attacks

---

## [0.1.2] - 2025-12-08

### Added

- FAQ section on landing page with common questions
- Step-by-step guide showing how to get started
- Sticky header with glass effect on scroll
- Resources dropdown menu (Help, Changelog, About)

### Changed

- Improved landing page layout and visual hierarchy
- Enhanced feature showcase with realistic dashboard previews
- Better mobile navigation experience

---

## [0.1.1] - 2025-12-01

### Added

- ShareModal component for material sharing
- Filter dropdown menu for mobile devices
- Delete functionality with Supabase integration
- PomodoroNotification component tests
- Expanded achievements test coverage

### Changed

- Extract Gemini client into dedicated service module
- Replace custom 404.tsx with Next.js not-found.tsx convention
- Refactor materials list UI with better mobile/desktop layout
- Improve API error handling for card/reviewer generation
- Enhance accessibility and visual hierarchy in dashboard

### Security

- Add Cross-Origin-Opener-Policy and Cross-Origin-Resource-Policy headers
- Update CSP to include Google Fonts
- Update RLS policies for secure sharing features

---

## [0.1.0] - 2025-11-30

### Added

- AI flashcard & reviewer generation from PDF/text (Gemini 2.5 Flash-Lite)
- Three extraction modes: full, sentence, keywords
- Study modes: flashcards, learn, match game, practice test
- Pomodoro timer with task list and session tracking
- XP system with levels and achievements
- Activity calendar (GitHub-style)
- PDF/DOCX export
- Shareable links with custom codes
- Google OAuth via Supabase
- Multi-key API rotation for reliability
- Rate limiting (10 AI generations/day)

### Security

- Row Level Security on all tables
- Input validation with Zod
- Atomic rate limit operations
- CSP and HSTS headers

---
