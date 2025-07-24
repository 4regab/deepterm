# Contributing to DeepTerm

We love your input! We want to make contributing to DeepTerm as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Pull Request Process

1. **Fork & Clone**: Fork the repository and clone it locally
2. **Branch**: Create a new branch for your feature (`git checkout -b feature/amazing-feature`)
3. **Develop**: Make your changes, following our coding standards
4. **Test**: Test your changes thoroughly
5. **Commit**: Commit your changes with clear, descriptive messages
6. **Push**: Push to your fork and submit a pull request
7. **Review**: Participate in the code review process

## Any contributions you make will be under the MIT Software License

In short, when you submit code changes, your submissions are understood to be under the same [MIT License](http://choosealicense.com/licenses/mit/) that covers the project. Feel free to contact the maintainers if that's a concern.

## Report bugs using GitHub's [issue tracker](https://github.com/4regab/deepterm/issues)

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/4regab/deepterm/issues/new); it's that easy!

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

## Coding Standards

### Code Style
- Use TypeScript for all new code
- Follow the existing code style (ESLint configuration)
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### React/TypeScript Guidelines
- Use functional components with hooks
- Implement proper TypeScript types and interfaces
- Use React Context for state management when appropriate
- Follow React best practices for performance

### UI/UX Standards
- Maintain the neobrutalism design system
- Ensure mobile responsiveness
- Follow accessibility guidelines (WCAG 2.1 AA)
- Test on multiple browsers and devices

### Commit Messages
Use clear and meaningful commit messages:
- `feat: add new flashcard sorting feature`
- `fix: resolve quiz generation timeout issue`
- `docs: update API documentation`
- `style: improve button hover animations`
- `refactor: optimize user profile context`

## Feature Requests

We welcome feature requests! Please:

1. Check if the feature already exists or is being worked on
2. Open a GitHub issue with the "enhancement" label
3. Clearly describe the feature and its benefits
4. Provide mockups or examples if applicable

## Areas Where We Need Help

### High Priority
- 🧪 **Testing**: Add unit tests and integration tests
- 🌍 **Internationalization**: Add support for multiple languages
- 📱 **Mobile App**: React Native or PWA implementation
- ⚡ **Performance**: Bundle optimization and lazy loading

### Medium Priority
- 🎨 **Themes**: Dark mode and additional color schemes
- 🔌 **Integrations**: Connect with popular note-taking apps
- 📊 **Analytics**: Enhanced study analytics and insights
- 🎵 **Audio**: Background music and focus sounds

### Nice to Have
- 📤 **Export**: Additional export formats and cloud sync
- 🤖 **AI Features**: More AI-powered study tools
- 👥 **Collaboration**: Study groups and sharing features
- 🔐 **Authentication**: User accounts and cloud backup

## Development Setup

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- Git
- Code editor (VS Code recommended)

### Local Development
```bash
# Clone your fork
git clone https://github.com/yourusername/deepterm.git
cd deepterm

# Install dependencies
npm install

# Start development server
npm run dev

# Run linter
npm run lint

# Build for production
npm run build
```

### Environment Variables
The app uses client-side API key management, so no environment variables are required for development.

## Code Architecture

### Key Directories
- `/src/components/` - Reusable UI components
- `/src/pages/` - Route components
- `/src/context/` - React Context providers
- `/src/services/` - API and external service integrations
- `/src/types/` - TypeScript type definitions
- `/src/utils/` - Helper functions and utilities

### State Management
- React Context for global state
- Local state for component-specific data
- Local Storage for persistence

### Styling
- Tailwind CSS for styling
- Custom design system in `tailwind.config.ts`
- Shadcn/ui components for UI primitives

## Testing Guidelines

When adding tests:
- Write unit tests for utility functions
- Test React components with React Testing Library
- Mock external API calls
- Test accessibility with automated tools

## Documentation

### Code Documentation
- Add JSDoc comments for complex functions
- Document TypeScript interfaces and types
- Include examples in component documentation

### User Documentation
- Update README.md for new features
- Add inline help text where needed
- Create user guides for complex features

## Questions?

Don't hesitate to ask questions! You can:
- Open a GitHub issue with the "question" label
- Start a discussion in GitHub Discussions
- Contact the maintainers directly

## Recognition

Contributors will be recognized in:
- The README.md contributors section
- Release notes for significant contributions
- Special mentions for major features or fixes

Thank you for contributing to DeepTerm! 🚀
