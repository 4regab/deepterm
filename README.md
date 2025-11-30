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

### Productivity Features

- **Pomodoro Timer** - Customizable focus timer with:
  - Configurable work/break durations (25/5/15 min defaults)
  - Session tracking and streak counting
  - Task list integration
  - Global notification system for phase transitions


- **Achievement System** - Gamified progress with unlockable achievements
- **XP & Leveling** - Experience points system with level progression and rank titles (Novice to Grandmaster)

### Account & Settings

- **Google OAuth** - Sign in with Google account
- **Daily Rate Limits** - 10 AI generations per day per user (with unlimited user whitelist support)
- **Help Center** - In-app documentation and support
- **Account Deletion** - Self-service account deletion

## Tech Stack

- **Framework**: Next.js 16 (App Router) with React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Supabase Auth (Google OAuth)
- **AI**: Google Gemini 2.5 Flash-Lite (with multi-key rotation)
- **State Management**: Zustand 5
- **Animations**: Framer Motion, GSAP
- **PDF Generation**: jsPDF
- **DOCX Generation**: docx
- **Validation**: Zod 4
- **Testing**: Vitest 4 with fast-check for property-based testing
- **Deployment**: Vercel

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
│   │   ├── practice/       # Practice mode
│   │   └── reviewer/       # Reviewer view
│   ├── api/                # API routes
│   │   ├── generate-cards/ # Flashcard generation endpoint
│   │   ├── generate-reviewer/ # Reviewer generation endpoint
│   │   ├── materials/      # Materials CRUD
│   │   └── share/          # Sharing endpoints
│   ├── auth/               # Auth callback
│   ├── help/               # Help center
│   ├── share/              # Public share pages
│   └── ...                 # Static pages
├── components/             # React components
│   ├── Dashboard/          # Dashboard widgets
│   ├── Header/             # Header component
│   └── Sidebar/            # Navigation sidebar
├── config/                 # Configuration
│   └── supabase/           # Supabase client setup
├── lib/                    # Core libraries
│   ├── schemas/            # Zod validation schemas
│   ├── stores/             # Zustand state stores
│   └── supabase/           # Database schema
├── services/               # Business logic
│   ├── activity.ts         # Activity tracking
│   ├── geminiClient.ts     # AI client with key rotation
│   └── rateLimit.ts        # Rate limiting
├── styles/                 # Global styles
├── tests/                  # Test files
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

### Security Features

- Row Level Security (RLS) on all tables
- Atomic rate limiting with database functions
- Input validation with Zod schemas
- XP bounds checking (1-100 per operation)
- Secure share access via RPC functions
- Content Security Policy headers
- HTTPS enforcement with HSTS

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- Google Gemini API key(s)

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Support for multiple API keys with rotation
GEMINI_API_KEY_1=your_gemini_api_key_1
GEMINI_API_KEY_2=your_gemini_api_key_2
GEMINI_API_KEY_3=your_gemini_api_key_3
GEMINI_API_KEY_4=your_gemini_api_key_4
GEMINI_API_KEY_5=your_gemini_api_key_5
```

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
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests with Vitest |
| `npm run test:watch` | Run tests in watch mode |

## Rate Limiting

AI generation is rate-limited to 10 requests per user per day to manage API costs. The limit resets at midnight UTC. Users in the `unlimited_users` table bypass this limit.

The system uses atomic check-and-increment operations to prevent race conditions.

## API Endpoints

### POST /api/generate-cards
Generate flashcards from PDF or text content.

- **Input**: FormData with `file` (PDF) or `textContent` (string)
- **Output**: `{ cards: [{term, definition}], remaining: number }`
- **Rate Limited**: Yes (10/day)

### POST /api/generate-reviewer
Generate categorized reviewer content from PDF or text.

- **Input**: FormData with `file`, `textContent`, and `extractionMode` (full/sentence/keywords)
- **Output**: `{ title, extractionMode, categories: [{name, color, terms}], remaining }`
- **Rate Limited**: Yes (10/day)

### Share API (/api/share)
- **GET**: Get share info for a material
- **POST**: Create or update share link
- **PATCH**: Toggle active status or change code
- **DELETE**: Remove share

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm run test`, `npm run build`, `npx eslint src/`
5. Submit a pull request

