/**
 * Test Setup Configuration
 * 
 * This file provides common test utilities, mocks, and setup/teardown
 * following FIRST principles:
 * - Fast: Mocks external services to avoid network calls
 * - Independent: Each test gets fresh state
 * - Repeatable: Deterministic mocks for consistent results
 * - Self-validating: Clear assertions
 * - Timely: Written alongside features (TDD)
 */

import { mock } from 'bun:test'

// Mock Supabase client
export const mockSupabaseClient = {
  auth: {
    getUser: mock(() => Promise.resolve({ data: { user: { id: 'test-user-id' } }, error: null })),
    signOut: mock(() => Promise.resolve({ error: null })),
  },
  from: mock(() => ({
    select: mock(() => ({
      eq: mock(() => ({
        single: mock(() => Promise.resolve({ data: null, error: null })),
        order: mock(() => ({
          limit: mock(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      order: mock(() => ({
        limit: mock(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
    insert: mock(() => ({
      select: mock(() => ({
        single: mock(() => Promise.resolve({ data: { id: 'new-id' }, error: null })),
      })),
    })),
    update: mock(() => ({
      eq: mock(() => Promise.resolve({ data: null, error: null })),
    })),
    delete: mock(() => ({
      eq: mock(() => Promise.resolve({ data: null, error: null })),
    })),
    upsert: mock(() => Promise.resolve({ data: null, error: null })),
  })),
  rpc: mock(() => Promise.resolve({ data: null, error: null })),
}

// Mock Gemini AI client
export const mockGeminiResponse = {
  text: '[{"term": "Test Term", "definition": "Test Definition"}]',
}

export const mockGeminiClient = {
  generateContent: mock(() => Promise.resolve({
    response: {
      text: () => mockGeminiResponse.text,
    },
  })),
}

// Mock localStorage for browser-dependent tests
export const mockLocalStorage = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
    get length() { return Object.keys(store).length },
    key: (index: number) => Object.keys(store)[index] || null,
  }
})()

// Mock Date for time-dependent tests (FIRST: Repeatable)
export const mockDate = (isoString: string) => {
  const fixedDate = new Date(isoString)
  const OriginalDate = globalThis.Date
  
  class MockDate extends OriginalDate {
    constructor(value?: string | number | Date) {
      if (value === undefined) {
        super(fixedDate.getTime())
      } else {
        super(value as string | number)
      }
    }
    static override now() { return fixedDate.getTime() }
  }
  
  globalThis.Date = MockDate as DateConstructor
  return () => { globalThis.Date = OriginalDate }
}

// Test data factories (FIRST: Independent - fresh data each test)
export const createTestUser = (overrides = {}) => ({
  id: `user-${Date.now()}`,
  email: 'test@example.com',
  created_at: new Date().toISOString(),
  ...overrides,
})

export const createTestFlashcardSet = (overrides = {}) => ({
  id: `set-${Date.now()}`,
  user_id: 'test-user-id',
  title: 'Test Flashcard Set',
  flashcards: [{ term: 'Term 1', definition: 'Definition 1' }],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

export const createTestAchievement = (overrides = {}) => ({
  id: `achievement-${Date.now()}`,
  title: 'Test Achievement',
  description: 'Test description',
  icon: 'Trophy',
  requirement_type: 'flashcards_created',
  requirement_value: 10,
  progress: 0,
  unlocked: false,
  ...overrides,
})

// Request/Response helpers for API route testing
export const createMockRequest = (options: {
  method?: string
  body?: unknown
  headers?: Record<string, string>
  url?: string
}) => {
  const { method = 'GET', body, headers = {}, url = 'http://localhost:3000/api/test' } = options
  
  return new Request(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
}

// Async test helper with timeout
export const withTimeout = <T>(promise: Promise<T>, ms: number = 5000): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout>
  return Promise.race([
    promise.then((result) => {
      clearTimeout(timeoutId)
      return result
    }),
    new Promise<T>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(`Test timed out after ${ms}ms`)), ms)
    }),
  ])
}

// Reset all mocks between tests
export const resetAllMocks = () => {
  mockSupabaseClient.auth.getUser.mockClear()
  mockSupabaseClient.auth.signOut.mockClear()
  mockSupabaseClient.from.mockClear()
  mockSupabaseClient.rpc.mockClear()
  mockGeminiClient.generateContent.mockClear()
  mockLocalStorage.clear()
}
