# Changelog

All notable changes to DeepTerm will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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
