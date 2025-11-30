# DeepTerm

AI-powered study tools that work for you. Transform your learning experience with intelligent flashcards, quizzes, reviewers, and productivity features.

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
  - Confetti celebrations on completion

- **Activity Calendar** - GitHub-style contribution graph showing daily study activity
- **Achievement System** - Gamified progress with unlockable achievements
- **XP & Leveling** - Experience points system with level progression

### Account & Settings

- **Google OAuth** - Sign in with Google account
- **Daily Rate Limits** - 10 AI generations per day per user
- **Help Center** - In-app documentation and support

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Google OAuth)
- **AI**: Google Gemini 2.5 Flash-Lite
- **State Management**: Zustand
- **Animations**: Framer Motion
- **PDF Generation**: jsPDF
- **DOCX Generation**: docx
- **Validation**: Zod
- **Testing**: Vitest


## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- Google Gemini API key

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

### Database Setup

1. Create a new Supabase project
2. Run `supabase-schema.sql` in the SQL Editor
3. Run `supabase-xp-system.sql` for XP/leveling features
4. Enable Google OAuth in Authentication settings

### Installation

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests with Vitest

## Rate Limiting

AI generation is rate-limited to 10 requests per user per day to manage API costs. The limit resets at midnight UTC.

## License

MIT
