# DeepTerm Test Suite

This test suite follows **Test-Driven Development (TDD)** principles and the **FIRST** guidelines for effective unit testing.

## FIRST Principles

Our tests adhere to the FIRST principles:

- **F**ast: Tests run quickly by mocking external dependencies (Supabase, Gemini AI)
- **I**ndependent: Each test has isolated state via `beforeEach` resets
- **R**epeatable: Deterministic mocks ensure consistent results across runs
- **S**elf-validating: Clear `expect` assertions with meaningful comparisons
- **T**imely: Tests written alongside features (TDD approach)

## Directory Structure

```
src/tests/
├── setup.ts                    # Common mocks, utilities, and test helpers
├── README.md                   # This file
├── api/                        # API route tests
│   ├── generate-cards.test.ts          # Unit tests for card generation
│   └── generate-cards.integration.test.ts  # Integration tests
├── stores/                     # Zustand store tests
│   └── pomodoroStore.test.ts   # Pomodoro timer store tests
├── utils/                      # Utility function tests
│   ├── achievements.test.ts    # Achievement calculation tests
│   └── xp.test.ts              # XP/ranking utility tests
└── *.test.ts                   # Legacy tests (being migrated)
```

## Running Tests

```bash
# Run all tests
bun test

# Run specific test file
bun test src/tests/stores/pomodoroStore.test.ts

# Run tests with coverage
bun test --coverage

# Run tests in watch mode
bun test --watch
```

## Writing Tests (TDD Approach)

### 1. Write a Failing Test First

```typescript
it('should calculate XP progress correctly', () => {
  const progress = calculateProgress(50, 100)
  expect(progress).toBe(50)
})
```

### 2. Write Minimal Code to Pass

```typescript
function calculateProgress(current: number, total: number): number {
  return (current / total) * 100
}
```

### 3. Refactor

Improve code quality while keeping tests green.

## Test Categories

### Unit Tests
Test individual functions/components in isolation:
- Utility functions (`utils/`)
- Store actions (`stores/`)
- Pure calculations

### Integration Tests
Test multiple components working together:
- API routes with mocked dependencies
- Store interactions with services

### Edge Case Tests
Cover boundary conditions:
- Empty inputs
- Large values
- Invalid data
- Concurrent operations

## Mocking Strategy

### External Services
All external services are mocked in `setup.ts`:

```typescript
// Supabase
export const mockSupabaseClient = { ... }

// Gemini AI
export const mockGeminiClient = { ... }

// localStorage
export const mockLocalStorage = { ... }
```

### Time-Dependent Tests
Use `mockDate()` for deterministic time:

```typescript
const restore = mockDate('2024-01-15T10:00:00Z')
// ... test code
restore() // Cleanup
```

## Test Data Factories

Use factories for consistent test data:

```typescript
import { createTestUser, createTestFlashcardSet } from './setup'

const user = createTestUser({ email: 'custom@test.com' })
const flashcards = createTestFlashcardSet({ title: 'Custom Title' })
```

## Best Practices

1. **One assertion per test** (when practical)
2. **Descriptive test names**: `should [action] when [condition]`
3. **Arrange-Act-Assert** pattern
4. **Clean up** in `afterEach` when needed
5. **Avoid test interdependence**

## Coverage Goals

- Stores: 90%+
- Utilities: 95%+
- API Routes: 80%+
- Components: 70%+

## Contributing

When adding new features:

1. Write failing tests first (TDD)
2. Follow FIRST principles
3. Add tests to appropriate directory
4. Update this README if adding new patterns
