# Development Setup Guide

This guide helps you set up DeepTerm for local development.

## Prerequisites

### Required Software
- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher
- **Git** (latest version)
- **Modern web browser** (Chrome, Firefox, Safari, Edge)

### API Requirements
- **Google Gemini API Key** - Get one from [Google AI Studio](https://makersuite.google.com/app/apikey)

## Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/deepterm.git
cd deepterm

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### 2. Configure Environment

Edit the `.env` file:

```bash
# Required: Add your Google Gemini API key
VITE_GEMINI_API_KEY=your_actual_gemini_api_key_here

# Optional: Development settings
VITE_DEV_MODE=true
VITE_APP_NAME=DeepTerm
VITE_APP_URL=http://localhost:8080
```

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

## Project Structure

```
deepterm/
├── public/                 # Static assets
│   ├── audio/             # Sound files
│   ├── icons/             # Favicon and app icons
│   └── og-image.jpg       # Social sharing image
├── src/
│   ├── components/        # React components
│   │   ├── ui/           # Shadcn/ui components
│   │   ├── flashcard/    # Flashcard components
│   │   ├── quiz/         # Quiz components
│   │   └── shared/       # Shared components
│   ├── context/          # React Context providers
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility libraries
│   ├── pages/            # Route components
│   ├── services/         # API services
│   ├── types/            # TypeScript types
│   ├── utils/            # Helper functions
│   └── main.tsx          # App entry point
├── .env.example          # Environment template
├── package.json          # Dependencies
├── tailwind.config.ts    # Tailwind configuration
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite configuration
└── README.md            # Project documentation
```

## Development Tools

### Available Scripts

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run ESLint
npm run lint
```

### Code Quality Tools

- **ESLint** - Code linting with React-specific rules
- **TypeScript** - Type checking and IntelliSense
- **Prettier** - Code formatting (optional, configure in your editor)

## Working with Components

### Adding New Components

1. Create component in appropriate folder under `src/components/`
2. Use TypeScript interfaces for props
3. Follow existing naming conventions
4. Add to appropriate index file if needed

Example component structure:

```typescript
import React from 'react';

interface MyComponentProps {
  title: string;
  isActive?: boolean;
}

const MyComponent: React.FC<MyComponentProps> = ({ title, isActive = false }) => {
  return (
    <div className={`component-base ${isActive ? 'active' : ''}`}>
      <h2>{title}</h2>
    </div>
  );
};

export default MyComponent;
```

### Styling with Tailwind

- Use Tailwind CSS classes for styling
- Custom colors are defined in `tailwind.config.ts`
- Follow the neobrutalism design system
- Use shadow utilities: `shadow-neo`, `shadow-neo-sm`, `shadow-neo-lg`

## Working with State Management

### Context Providers

The app uses React Context for state management:

- **UserProfileContext** - User data, achievements, levels
- **PomodoroContext** - Timer state and sessions
- **FlashcardContext** - Flashcard data and progress
- **QuizContext** - Quiz data and statistics

### Adding New Context

1. Create context definition in `src/context/`
2. Implement provider component
3. Add custom hook for easier usage
4. Wrap app or specific components as needed

## API Integration

### Gemini AI Service

The `geminiService.ts` handles all AI-related functionality:

- Text extraction from documents
- Quiz generation
- Flashcard creation
- File processing

### Adding New AI Features

1. Add function to `geminiService.ts`
2. Handle API errors appropriately
3. Add loading states in UI
4. Test with various input types

## Testing

### Manual Testing Checklist

- [ ] API key validation works
- [ ] File upload and processing
- [ ] Quiz creation and taking
- [ ] Flashcard creation and study
- [ ] Pomodoro timer functionality
- [ ] Achievement system
- [ ] Data persistence in localStorage
- [ ] Responsive design on mobile

### Browser Testing

Test in multiple browsers:
- Chrome (primary development target)
- Firefox
- Safari
- Edge

## Performance Considerations

### Bundle Size

- Monitor bundle size with `npm run build`
- Use dynamic imports for large components
- Optimize images and assets

### Runtime Performance

- Use React.memo for expensive components
- Implement proper dependency arrays in useEffect
- Avoid unnecessary re-renders

## Debugging

### Common Issues

1. **API Key Problems**
   - Check environment variable name and value
   - Verify API key permissions in Google AI Studio
   - Check browser developer tools for CORS errors

2. **Build Issues**
   - Clear node_modules: `rm -rf node_modules package-lock.json && npm install`
   - Check TypeScript errors: `npx tsc --noEmit`

3. **Styling Issues**
   - Verify Tailwind classes are available
   - Check for CSS conflicts
   - Use browser dev tools to inspect styles

### Developer Tools

Recommended browser extensions:
- React Developer Tools
- Redux DevTools (if using Redux)
- Web Vitals extension

## Contributing

### Code Style

- Use TypeScript for all new code
- Follow existing component patterns
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Keep components focused and single-purpose

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/new-feature
```

### Commit Message Format

Use conventional commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

## Getting Help

### Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Vite Documentation](https://vitejs.dev)
- [Google AI Studio](https://makersuite.google.com)

### Community

- GitHub Issues - Bug reports and feature requests
- GitHub Discussions - General questions and ideas

---

Happy coding! 🚀
