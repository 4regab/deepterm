# DeepTerm

Stop grinding through notes the hard way. DeepTerm uses AI to turn your PDFs and study material into flashcards, reviewers, and practice tests in seconds. Study smarter, not harder.

## Features

### AI-Powered Study Tools

- **Flashcard Maker** - Upload PDF or paste text to automatically extract key terms and definitions using Google Gemini AI. Supports spaced repetition with card status tracking (new, learning, review, mastered).

- **Reviewer Maker** - Transform dense content into organized, categorized study materials with three extraction modes:
  - Full Mode: Complete definitions with examples and context
  - Sentence Mode: Concise one-sentence summaries
  - Keywords Mode: Key phrases and concepts only

### Study Modes

- **Flashcards** - Interactive flashcard review with flip animations
- **Learn Mode** - Adaptive learning with progress tracking
- **Match Game** - Memory matching game for term-definition pairs
- **Practice Test** - Mixed question types based on card mastery level

### Material Management

- **Edit Terms** - Add, edit, and delete terms/definitions directly in the app
- **Category Management** - Organize reviewer terms into categories with color coding
- **Delete Categories** - Remove entire categories with all associated terms
- **Drag & Drop Reorder** - Reorder flashcard terms with drag and drop

### Export & Sharing

- **PDF Export** - Export reviewers and flashcards to compact two-column PDF format
- **DOCX Export** - Export to Microsoft Word format with proper formatting
- **Share Links** - Generate shareable links with custom codes for materials
- **Copy to Library** - Allow others to copy shared materials to their account
- **Screenshot Export** - Capture and export content as images using html2canvas

### Productivity Features

- **Pomodoro Timer** - Customizable focus timer with:
  - Configurable work/break durations (25/5/15 min defaults)
  - Session tracking and streak counting
  - Task list integration
  - Global notification system for phase transitions
  - Sound effects for timer events

- **Achievement System** - Gamified progress with unlockable achievements
- **XP & Leveling** - Experience points system with level progression and rank titles (Novice to Grandmaster)

### Blog System

- **AI-Generated Articles** - Automated blog content generation using Google Gemini
- **Category Organization** - Articles organized by categories (study-tips, productivity, learning-science, etc.)
- **Auto-Publishing** - Scheduled article generation via cron jobs (2x daily at 8 AM & 8 PM UTC)
- **Dynamic OG Images** - Auto-generated Open Graph images for social sharing

### Interactive Experience

- **Smooth Scrolling** - Buttery smooth scroll experience with Lenis
- **Sound Effects** - Audio feedback for interactions using use-sound
- **Fluid Animations** - Rich animations with Framer Motion and GSAP

### Account & Settings

- **Google OAuth** - Sign in with Google account
- **Cloudflare Turnstile** - Bot protection on authentication (optional)
- **Daily Rate Limits** - 10 AI generations per day per user (with unlimited user whitelist support)
- **Help Center** - In-app documentation and support
- **Account Deletion** - Self-service account deletion

## Tech Stack

### Core Framework
- **Next.js 16.0.10** - App Router with React Server Components
- **React 19.2.0** - Latest React with concurrent features
- **React Compiler** - Automatic memoization via babel-plugin-react-compiler
- **TypeScript 5** - Type-safe development
- **Bun** - Fast JavaScript runtime, bundler, and package manager

### Styling & Animation
- **Tailwind CSS 4** - Utility-first CSS framework
- **Framer Motion 12** - Production-ready motion library
- **GSAP 3.13** - Professional-grade animations
- **Lenis 1.3** - Smooth scroll library

### Backend & Database
- **Supabase** - PostgreSQL database with Row Level Security
- **Supabase Auth** - Authentication (Google OAuth)
- **Google Gemini 2.5 Flash-Lite** - AI with multi-key rotation

### State & Validation
- **Zustand 5.0** - Lightweight state management
- **Zod 4.1** - TypeScript-first schema validation

### Document Generation
- **jsPDF 4.0** - PDF generation
- **docx 9.5** - Word document generation
- **html2canvas 1.4** - Screenshot capture
- **marked 17.0** - Markdown parsing

### Analytics & Security
- **PostHog** - Product analytics (with proxy for ad-blocker bypass)
- **Cloudflare Turnstile** - Bot protection (optional)

### Testing
- **Bun Test** - Fast test runner
- **fast-check 4.3** - Property-based testing

### Deployment
- **Vercel** - Edge deployment with cron jobs

## Architecture

### Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (dashboard)/        # Protected dashboard routes
│   │   ├── account/        # Account settings
│   │   ├── achievements/   # Achievements page
│   │   ├── dashboard/      # Main dashboard
│   │   ├── materials/      # Materials management
│   │   ├── pomodoro/       # Pomodoro timer
│   │   └── practice/       # Practice mode
│   ├── about/              # About page
│   ├── blog/               # Blog system
│   │   ├── category/[cat]/ # Category pages
│   │   ├── [slug]/         # Individual articles
│   │   └── components/     # Blog-specific components
│   ├── changelog/          # Changelog page
│   ├── privacy-policy/     # Privacy policy
│   ├── terms/              # Terms of service
│   ├── api/                # API routes
│   │   ├── blog/generate/  # Article generation
│   │   ├── cron/           # Scheduled jobs
│   │   ├── generate-cards/ # Flashcard generation
│   │   ├── generate-reviewer/ # Reviewer generation
│   │   ├── og/             # Open Graph images
│   │   └── share/          # Sharing endpoints
│   ├── auth/callback/      # Auth callback
│   ├── help/               # Help center
│   └── share/[code]/       # Public share pages
├── components/             # React components
│   ├── Dashboard/          # Dashboard widgets
│   ├── Turnstile/          # Captcha components
│   ├── Header/             # Header component
│   └── Sidebar/            # Navigation sidebar
├── config/                 # Configuration
│   └── supabase/           # Supabase client setup
├── lib/                    # Core libraries
│   ├── auth/               # Auth utilities
│   ├── blog/               # Blog service layer
│   ├── hooks/              # Custom React hooks
│   ├── schemas/            # Zod validation schemas
│   ├── stores/             # Zustand state stores
│   └── supabase/           # Database schema
├── services/               # Business logic
│   ├── activity.ts         # Activity tracking
│   ├── geminiClient.ts     # AI client with key rotation
│   └── rateLimit.ts        # Rate limiting
├── styles/                 # Global styles
├── tests/                  # Test files (see Testing section)
└── utils/                  # Utility functions
```

### State Management

The application uses Zustand stores for client-side state:

- **profileStore** - User profile data
- **uiStore** - UI state (sidebar, menus)
- **materialsStore** - Study materials with filtering
- **achievementsStore** - Achievement progress
- **activityStore** - Study activity calendar
- **pomodoroStore** - Timer state and settings
- **xpStore** - XP and leveling system

### Database Schema

Key tables in Supabase:

- `profiles` - User profiles
- `flashcard_sets` / `flashcards` - Flashcard data
- `reviewers` / `reviewer_categories` / `reviewer_terms` - Reviewer data
- `quizzes` / `quiz_questions` / `quiz_attempts` - Quiz system
- `study_activity` / `user_stats` - Activity tracking
- `pomodoro_sessions` - Pomodoro history
- `achievement_definitions` / `user_achievements` - Achievements
- `material_shares` - Sharing system
- `ai_usage` / `unlimited_users` - Rate limiting
- `blog_articles` / `blog_categories` - Blog system

### Security Features

- **Row Level Security (RLS)** on all database tables
- **Atomic rate limiting** with database functions
- **Input validation** with Zod schemas
- **XP bounds checking** (1-100 per operation)
- **Secure share access** via RPC functions
- **Cloudflare Turnstile** bot protection on authentication

#### Security Headers

The application enforces comprehensive security headers:

- **Content-Security-Policy** - Restricts resource loading sources (with documented exceptions for Next.js compatibility)
- **Strict-Transport-Security** - Enforces HTTPS with 2-year max-age, includeSubDomains, and preload
- **X-Frame-Options: DENY** - Prevents clickjacking
- **X-Content-Type-Options: nosniff** - Prevents MIME sniffing
- **X-DNS-Prefetch-Control: on** - Enables DNS prefetching for performance
- **Referrer-Policy: strict-origin-when-cross-origin** - Controls referrer information
- **Permissions-Policy** - Restricts browser features (camera, microphone, geolocation)
- **Cross-Origin-Opener-Policy: same-origin** - Isolates browsing context
- **Cross-Origin-Resource-Policy: same-origin** - Prevents cross-origin resource loading

Note: X-XSS-Protection is intentionally omitted as it's deprecated and can introduce vulnerabilities in older browsers.

## Performance Optimizations

### React Compiler

The application uses the React Compiler (`babel-plugin-react-compiler`) for automatic memoization, eliminating the need for manual `useMemo`, `useCallback`, and `React.memo` in most cases.

### Barrel File Optimization

Next.js `optimizePackageImports` is configured for:
- `lucide-react` - Icon library (1,500+ icons)
- `framer-motion` - Animation library

This transforms barrel imports into direct imports at build time, reducing bundle size and improving cold start times.

### PostHog Proxy

Analytics requests are proxied through Next.js rewrites to avoid ad-blocker interference:
- `/ingest/static/*` → PostHog static assets
- `/ingest/*` → PostHog API

### Image Optimization

- Next.js Image component with automatic optimization
- Remote patterns configured for Google user content (profile images)
- Lazy loading for below-fold images

## Getting Started

### Prerequisites

- Bun 1.0+ (install from [bun.sh](https://bun.sh))
- Supabase account
- Google Gemini API key(s)

### Environment Variables

Create a `.env.local` file:

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Gemini AI - Support for multiple API keys with rotation (at least one required)
GEMINI_API_KEY=your_gemini_api_key
GEMINI_API_KEY_1=your_gemini_api_key_1
GEMINI_API_KEY_2=your_gemini_api_key_2
GEMINI_API_KEY_3=your_gemini_api_key_3
GEMINI_API_KEY_4=your_gemini_api_key_4
GEMINI_API_KEY_5=your_gemini_api_key_5

# Cloudflare Turnstile - Bot protection (optional, auth works without it)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_turnstile_site_key
TURNSTILE_SECRET=your_turnstile_secret
TURNSTILE_HOSTNAMES=deepterm.app,www.deepterm.app,localhost,127.0.0.1

# Unsplash - Blog hero images (optional)
UNSPLASH_ACCESS_KEY=your_unsplash_access_key

# PostHog - Analytics (optional)
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Cron Jobs - Blog generation (optional, for production)
CRON_SECRET=your_cron_secret
```

**Where to get these:**
- **Supabase**: [Dashboard → Project Settings → API](https://supabase.com/dashboard/project/_/settings/api)
- **Gemini**: [Google AI Studio](https://aistudio.google.com/app/apikey)
- **Cloudflare Turnstile**: [Cloudflare Dashboard → Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile) (optional)
- **Unsplash**: [Unsplash Developers](https://unsplash.com/developers) (optional)
- **PostHog**: [PostHog Dashboard](https://posthog.com/) (optional)

### Google Cloud Setup (OAuth)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services > OAuth consent screen**
   - Choose "External" user type
   - Fill in app name, user support email, and developer contact
   - Add scopes: `email`, `profile`, `openid`
   - Add test users if in testing mode
4. Navigate to **APIs & Services > Credentials**
   - Click **Create Credentials > OAuth client ID**
   - Select "Web application"
   - Add authorized redirect URI: `https://<your-supabase-project>.supabase.co/auth/v1/callback`
   - Copy the **Client ID** and **Client Secret**

### Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run `src/lib/supabase/schema.sql` and `supabase-rls-policies.sql` in the SQL Editor (Dashboard > SQL Editor)
3. Configure Google OAuth:
   - Go to **Authentication > Providers > Google**
   - Enable Google provider
   - Paste your Google Client ID and Client Secret
   - Save changes

### Installation

```bash
# Install Bun (if not already installed)
curl -fsSL https://bun.sh/install | bash

# Install dependencies
bun install

# Start development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Build for production |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun test` | Run tests |
| `bun test --watch` | Run tests in watch mode |

## Testing

The test suite follows **TDD principles** and **FIRST guidelines** (Fast, Independent, Repeatable, Self-validating, Timely).

### Test Structure

```
src/tests/
├── setup.ts                    # Common mocks and test utilities
├── api/                        # API route tests
│   ├── generate-cards.test.ts
│   ├── generate-cards.integration.test.ts
│   └── generate-reviewer.test.ts
├── stores/                     # Zustand store tests
│   └── pomodoroStore.test.ts
├── utils/                      # Utility function tests
│   ├── achievements.test.ts
│   └── xp.test.ts
└── *.test.ts                   # Additional store and component tests
```

### Running Tests

```bash
# Run all tests
bun test

# Run specific test file
bun test src/tests/stores/pomodoroStore.test.ts

# Run tests in watch mode
bun test --watch
```

### Test Utilities

The `setup.ts` file provides:
- **Mock Supabase client** - Mocked database operations
- **Mock Gemini client** - Mocked AI responses
- **Mock localStorage** - Browser storage simulation
- **Test data factories** - `createTestUser()`, `createTestFlashcardSet()`, `createTestAchievement()`
- **Request helpers** - `createMockRequest()` for API testing
- **Timeout helper** - `withTimeout()` for async tests

## Rate Limiting

AI generation is rate-limited to 10 requests per user per day to manage API costs. The limit resets at midnight UTC. Users in the `unlimited_users` table bypass this limit.

The system uses atomic check-and-increment operations to prevent race conditions.

## API Endpoints

### AI Generation

#### POST /api/generate-cards
Generate flashcards from PDF or text content.

- **Input**: FormData with `file` (PDF) or `textContent` (string)
- **Output**: `{ cards: [{term, definition}], remaining: number }`
- **Rate Limited**: Yes (10/day)

#### POST /api/generate-reviewer
Generate categorized reviewer content from PDF or text.

- **Input**: FormData with `file`, `textContent`, and `extractionMode` (full/sentence/keywords)
- **Output**: `{ title, extractionMode, categories: [{name, color, terms}], remaining }`
- **Rate Limited**: Yes (10/day)

## Deployment

### Vercel Deployment

The application is optimized for Vercel deployment:

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy

### Cron Jobs

Blog auto-generation is configured via `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/generate-article",
      "schedule": "0 8,20 * * *"
    }
  ]
}
```

This runs the blog generation endpoint twice daily at 8 AM and 8 PM UTC.

**Note**: Cron jobs require a Vercel Pro plan or higher.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `bun test`, `bun run build`, `bun run lint`
5. Submit a pull request
