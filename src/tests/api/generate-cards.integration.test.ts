/**
 * Integration Tests for generate-cards API Route
 * 
 * These tests follow TDD principles and FIRST guidelines:
 * - Fast: Mocks external AI service
 * - Independent: Each test has isolated state
 * - Repeatable: Deterministic mocks
 * - Self-validating: Clear expect assertions
 * - Timely: Written to verify API contract
 */

import { describe, it, expect, beforeEach, mock, afterEach } from 'bun:test'
import { NextRequest } from 'next/server'
import { mockGeminiResponse, resetAllMocks } from '../setup'

// Mock the dependencies before importing the route
const mockCheckAndIncrementAIUsage = mock(() => Promise.resolve({ 
  allowed: true, 
  remaining: 9, 
  resetAt: new Date() 
}))

const mockGenerateContentWithRotation = mock(() => Promise.resolve({
  text: mockGeminiResponse.text
}))

const mockUploadFileWithRotation = mock(() => Promise.resolve({ 
  uploadedFile: { name: 'test-file' },
  ai: {
    files: {
      get: mock(() => Promise.resolve({ state: 'ACTIVE', uri: 'mock-uri' }))
    }
  }
}))

const mockGetApiKeyCount = mock(() => 1)

// Mock modules before importing the route
mock.module('@/services/rateLimit', () => ({
  checkAndIncrementAIUsage: mockCheckAndIncrementAIUsage
}))

mock.module('@/services/geminiClient', () => ({
  generateContentWithRotation: mockGenerateContentWithRotation,
  uploadFileWithRotation: mockUploadFileWithRotation,
  getApiKeyCount: mockGetApiKeyCount
}))

// Import the actual route handler AFTER mocking dependencies
import { POST } from '@/app/api/generate-cards/route'

/**
 * Helper to create a NextRequest with FormData
 */
function createFormDataRequest(data: { textContent?: string; file?: File }): NextRequest {
  const formData = new FormData()
  
  if (data.textContent !== undefined) {
    formData.append('textContent', data.textContent)
  }
  
  if (data.file) {
    formData.append('file', data.file)
  }
  
  return new NextRequest('http://localhost:3000/api/generate-cards', {
    method: 'POST',
    body: formData,
  })
}

describe('POST /api/generate-cards', () => {
  beforeEach(() => {
    resetAllMocks()
    mockCheckAndIncrementAIUsage.mockClear()
    mockGenerateContentWithRotation.mockClear()
    mockUploadFileWithRotation.mockClear()
    mockGetApiKeyCount.mockClear()
    
    // Reset to default successful responses
    mockGetApiKeyCount.mockReturnValue(1)
    mockCheckAndIncrementAIUsage.mockResolvedValue({ 
      allowed: true, 
      remaining: 9, 
      resetAt: new Date() 
    })
    mockGenerateContentWithRotation.mockResolvedValue({
      text: mockGeminiResponse.text
    })
  })

  afterEach(() => {
    mock.restore()
  })

  describe('API Key Configuration', () => {
    it('should return 500 when no API keys are configured', async () => {
      mockGetApiKeyCount.mockReturnValue(0)
      
      const request = createFormDataRequest({ textContent: 'Test content' })
      const response = await POST(request)
      
      expect(response.status).toBe(500)
      const body = await response.json()
      expect(body.error).toBe('No Gemini API keys configured')
    })
  })

  describe('Rate Limiting', () => {
    it('should return 429 when rate limit exceeded', async () => {
      const resetTime = new Date('2024-01-02T00:00:00Z')
      mockCheckAndIncrementAIUsage.mockResolvedValueOnce({ 
        allowed: false, 
        remaining: 0, 
        resetAt: resetTime 
      })

      const request = createFormDataRequest({ textContent: 'Test content' })
      const response = await POST(request)
      
      expect(response.status).toBe(429)
      const body = await response.json()
      expect(body.error).toBe('Daily AI generation limit reached (10/day)')
      expect(body.remaining).toBe(0)
      expect(body.resetAt).toBe(resetTime.toISOString())
    })

    it('should include remaining count in successful response', async () => {
      mockCheckAndIncrementAIUsage.mockResolvedValueOnce({ 
        allowed: true, 
        remaining: 5, 
        resetAt: new Date() 
      })

      const request = createFormDataRequest({ textContent: 'Test content' })
      const response = await POST(request)
      
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.remaining).toBe(5)
    })
  })

  describe('Input Validation', () => {
    it('should return 400 when no file or text content provided', async () => {
      const request = createFormDataRequest({})
      const response = await POST(request)
      
      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.error).toBe('No file or text content provided')
    })

    it('should return 400 when text content exceeds maximum length', async () => {
      const longText = 'a'.repeat(100001) // Exceeds 100k character limit
      
      const request = createFormDataRequest({ textContent: longText })
      const response = await POST(request)
      
      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.error).toBe('Invalid input')
      expect(body.details).toBeDefined()
    })

    it('should accept valid text content', async () => {
      const request = createFormDataRequest({ textContent: 'Valid study material content' })
      const response = await POST(request)
      
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.cards).toBeDefined()
      expect(Array.isArray(body.cards)).toBe(true)
    })
  })

  describe('File Validation', () => {
    it('should return 400 for unsupported file types', async () => {
      const textFile = new File(['test content'], 'test.txt', { type: 'text/plain' })
      
      const request = createFormDataRequest({ file: textFile })
      const response = await POST(request)
      
      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.error).toBe('Unsupported file type. Only PDF files are allowed.')
    })

    it('should return 400 for files exceeding size limit', async () => {
      // Create a file larger than 20MB
      const largeContent = new Uint8Array(21 * 1024 * 1024) // 21MB
      const largeFile = new File([largeContent], 'large.pdf', { type: 'application/pdf' })
      
      const request = createFormDataRequest({ file: largeFile })
      const response = await POST(request)
      
      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.error).toContain('File too large')
    })
  })

  describe('Successful Card Generation', () => {
    it('should return generated cards from text content', async () => {
      const request = createFormDataRequest({ textContent: 'Photosynthesis is the process by which plants convert sunlight into energy.' })
      const response = await POST(request)
      
      expect(response.status).toBe(200)
      const body = await response.json()
      
      expect(body.cards).toBeDefined()
      expect(Array.isArray(body.cards)).toBe(true)
      expect(body.cards.length).toBeGreaterThan(0)
      expect(body.cards[0]).toHaveProperty('term')
      expect(body.cards[0]).toHaveProperty('definition')
    })

    it('should call generateContentWithRotation with correct parameters', async () => {
      const testContent = 'Test study material'
      const request = createFormDataRequest({ textContent: testContent })
      
      await POST(request)
      
      expect(mockGenerateContentWithRotation).toHaveBeenCalledTimes(1)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const calls = (mockGenerateContentWithRotation.mock.calls as any[])
      expect(calls.length).toBeGreaterThan(0)
      
      const callArgs = calls[0]?.[0] as { model: string; contents: Array<{ parts: Array<{ text?: string }> }> } | undefined
      expect(callArgs).toBeDefined()
      expect(callArgs?.model).toBe('gemini-2.5-flash-lite')
      expect(callArgs?.contents[0]?.parts[0]?.text).toContain(testContent)
    })
  })

  describe('AI Response Processing', () => {
    it('should parse valid JSON array from AI response', async () => {
      mockGenerateContentWithRotation.mockResolvedValueOnce({
        text: '[{"term": "Mitosis", "definition": "Cell division process"}]'
      })

      const request = createFormDataRequest({ textContent: 'Test content' })
      const response = await POST(request)
      
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.cards).toEqual([{ term: 'Mitosis', definition: 'Cell division process' }])
    })

    it('should return 500 when AI response has extra text around JSON (structured output guarantees pure JSON)', async () => {
      // Note: With responseMimeType: "application/json" and responseSchema, Gemini returns pure JSON.
      // This test verifies the route correctly rejects malformed responses that shouldn't occur in production.
      mockGenerateContentWithRotation.mockResolvedValueOnce({
        text: 'Here are the flashcards: [{"term": "A", "definition": "B"}] Hope this helps!'
      })

      const request = createFormDataRequest({ textContent: 'Test content' })
      const response = await POST(request)
      
      // Route uses JSON.parse directly since structured output guarantees valid JSON
      // Extra text around JSON will fail parsing as expected
      expect(response.status).toBe(500)
      const body = await response.json()
      expect(body.error).toBe('Failed to parse AI response')
    })

    it('should return 500 when AI response has no valid JSON', async () => {
      mockGenerateContentWithRotation.mockResolvedValueOnce({
        text: 'Invalid response without JSON array'
      })

      const request = createFormDataRequest({ textContent: 'Test content' })
      const response = await POST(request)
      
      expect(response.status).toBe(500)
      const body = await response.json()
      expect(body.error).toBe('Failed to parse AI response')
    })
  })

  describe('Edge Cases', () => {
    it('should handle unicode content in cards', async () => {
      mockGenerateContentWithRotation.mockResolvedValueOnce({
        text: '[{"term": "数学", "definition": "Mathematics in Chinese"}]'
      })

      const request = createFormDataRequest({ textContent: '数学 means mathematics' })
      const response = await POST(request)
      
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.cards[0].term).toBe('数学')
    })

    it('should handle special characters in cards', async () => {
      mockGenerateContentWithRotation.mockResolvedValueOnce({
        text: '[{"term": "Test & <tag>", "definition": "A \\"quoted\\" value"}]'
      })

      const request = createFormDataRequest({ textContent: 'Test content' })
      const response = await POST(request)
      
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.cards[0].term).toBe('Test & <tag>')
    })

    it('should handle empty cards array from AI', async () => {
      mockGenerateContentWithRotation.mockResolvedValueOnce({
        text: '[]'
      })

      const request = createFormDataRequest({ textContent: 'Test content' })
      const response = await POST(request)
      
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.cards).toEqual([])
    })

    it('should handle multiple cards in response', async () => {
      mockGenerateContentWithRotation.mockResolvedValueOnce({
        text: '[{"term": "Term1", "definition": "Def1"}, {"term": "Term2", "definition": "Def2"}, {"term": "Term3", "definition": "Def3"}]'
      })

      const request = createFormDataRequest({ textContent: 'Test content with multiple concepts' })
      const response = await POST(request)
      
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.cards).toHaveLength(3)
    })
  })

  describe('Error Handling', () => {
    it('should return 500 with sanitized error message on unexpected errors', async () => {
      mockGenerateContentWithRotation.mockRejectedValueOnce(new Error('Internal AI service error'))

      const request = createFormDataRequest({ textContent: 'Test content' })
      const response = await POST(request)
      
      expect(response.status).toBe(500)
      const body = await response.json()
      // Should return sanitized error, not internal details
      expect(body.error).toBe('Failed to generate cards. Please try again.')
    })
  })
})
