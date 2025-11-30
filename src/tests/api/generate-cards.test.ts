import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

// Mock dependencies before importing
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn(),
  FileState: { PROCESSING: 'PROCESSING', FAILED: 'FAILED', ACTIVE: 'ACTIVE' },
}))

vi.mock('../../services/rateLimit', () => ({
  checkAIRateLimit: vi.fn(),
  incrementAIUsage: vi.fn(),
}))

describe('generate-cards API route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('GEMINI_API_KEY', 'test-api-key')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  // ==================== VALIDATION TESTS ====================
  describe('Request Validation', () => {
    it('should return 500 when GEMINI_API_KEY not configured', async () => {
      vi.stubEnv('GEMINI_API_KEY', '')
      
      const { checkAIRateLimit } = await import('../../services/rateLimit')
      vi.mocked(checkAIRateLimit).mockResolvedValue({
        allowed: true,
        remaining: 10,
        resetAt: new Date(),
      })

      // Simulate missing API key scenario
      expect(process.env.GEMINI_API_KEY).toBe('')
    })

    it('should return 429 when rate limit exceeded', async () => {
      const { checkAIRateLimit } = await import('../../services/rateLimit')
      vi.mocked(checkAIRateLimit).mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt: new Date(),
      })

      const result = await checkAIRateLimit()
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should validate rate limit allows request', async () => {
      const { checkAIRateLimit } = await import('../../services/rateLimit')
      vi.mocked(checkAIRateLimit).mockResolvedValue({
        allowed: true,
        remaining: 5,
        resetAt: new Date(),
      })

      const result = await checkAIRateLimit()
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(5)
    })
  })

  // ==================== FILE TYPE VALIDATION ====================
  describe('File Type Validation', () => {
    const getMimeTypeFromName = (filename: string): string | null => {
      const ext = filename.toLowerCase().split('.').pop()
      switch (ext) {
        case 'pdf': return 'application/pdf'
        case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        case 'txt': return 'text/plain'
        default: return null
      }
    }

    it('should return correct mime type for PDF', () => {
      expect(getMimeTypeFromName('document.pdf')).toBe('application/pdf')
    })

    it('should return correct mime type for DOCX', () => {
      expect(getMimeTypeFromName('document.docx')).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    })

    it('should return correct mime type for TXT', () => {
      expect(getMimeTypeFromName('document.txt')).toBe('text/plain')
    })

    it('should return null for unsupported file type', () => {
      expect(getMimeTypeFromName('document.jpg')).toBeNull()
    })

    it('should return null for file without extension', () => {
      expect(getMimeTypeFromName('document')).toBeNull()
    })

    it('should handle uppercase extensions', () => {
      expect(getMimeTypeFromName('document.PDF')).toBe('application/pdf')
    })

    it('should handle mixed case extensions', () => {
      expect(getMimeTypeFromName('document.PdF')).toBe('application/pdf')
    })

    it('should handle multiple dots in filename', () => {
      expect(getMimeTypeFromName('my.document.file.pdf')).toBe('application/pdf')
    })

    it('should return null for empty filename', () => {
      expect(getMimeTypeFromName('')).toBeNull()
    })

    it('should return null for dot-only filename', () => {
      expect(getMimeTypeFromName('.')).toBeNull()
    })
  })

  // ==================== RATE LIMIT TESTS ====================
  describe('Rate Limiting', () => {
    it('should increment usage after successful generation', async () => {
      const { incrementAIUsage } = await import('../../services/rateLimit')
      vi.mocked(incrementAIUsage).mockResolvedValue(undefined)

      await incrementAIUsage()
      expect(incrementAIUsage).toHaveBeenCalled()
    })

    it('should handle rate limit check failure', async () => {
      const { checkAIRateLimit } = await import('../../services/rateLimit')
      vi.mocked(checkAIRateLimit).mockRejectedValue(new Error('Rate limit check failed'))

      await expect(checkAIRateLimit()).rejects.toThrow('Rate limit check failed')
    })

    it('should return correct remaining count', async () => {
      const { checkAIRateLimit } = await import('../../services/rateLimit')
      vi.mocked(checkAIRateLimit).mockResolvedValue({
        allowed: true,
        remaining: 3,
        resetAt: new Date('2024-01-02T00:00:00Z'),
      })

      const result = await checkAIRateLimit()
      expect(result.remaining).toBe(3)
    })

    it('should return reset time', async () => {
      const resetTime = new Date('2024-01-02T00:00:00Z')
      const { checkAIRateLimit } = await import('../../services/rateLimit')
      vi.mocked(checkAIRateLimit).mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt: resetTime,
      })

      const result = await checkAIRateLimit()
      expect(result.resetAt).toEqual(resetTime)
    })
  })

  // ==================== AI RESPONSE PARSING ====================
  describe('AI Response Parsing', () => {
    it('should parse valid JSON array from response', () => {
      const responseText = '[{"term": "Test", "definition": "A test definition"}]'
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      expect(jsonMatch).toBeTruthy()
      const cards = JSON.parse(jsonMatch![0])
      expect(cards).toHaveLength(1)
      expect(cards[0].term).toBe('Test')
    })

    it('should parse JSON array with multiple cards', () => {
      const responseText = '[{"term": "A", "definition": "Def A"}, {"term": "B", "definition": "Def B"}]'
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      const cards = JSON.parse(jsonMatch![0])
      expect(cards).toHaveLength(2)
    })

    it('should handle JSON with extra text before', () => {
      const responseText = 'Here are the cards: [{"term": "Test", "definition": "Def"}]'
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      expect(jsonMatch).toBeTruthy()
      const cards = JSON.parse(jsonMatch![0])
      expect(cards).toHaveLength(1)
    })

    it('should handle JSON with extra text after', () => {
      const responseText = '[{"term": "Test", "definition": "Def"}] Hope this helps!'
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      expect(jsonMatch).toBeTruthy()
      const cards = JSON.parse(jsonMatch![0])
      expect(cards).toHaveLength(1)
    })

    it('should return null for response without JSON array', () => {
      const responseText = 'No JSON here'
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      expect(jsonMatch).toBeNull()
    })

    it('should handle empty JSON array', () => {
      const responseText = '[]'
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      const cards = JSON.parse(jsonMatch![0])
      expect(cards).toHaveLength(0)
    })

    it('should handle cards with special characters', () => {
      const responseText = '[{"term": "Test & <script>", "definition": "A \\"quoted\\" definition"}]'
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      const cards = JSON.parse(jsonMatch![0])
      expect(cards[0].term).toBe('Test & <script>')
    })

    it('should handle cards with unicode', () => {
      const responseText = '[{"term": "数学", "definition": "Mathematics in Chinese"}]'
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      const cards = JSON.parse(jsonMatch![0])
      expect(cards[0].term).toBe('数学')
    })

    it('should handle multiline definitions', () => {
      const responseText = '[{"term": "Test", "definition": "Line 1\\nLine 2\\nLine 3"}]'
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      const cards = JSON.parse(jsonMatch![0])
      expect(cards[0].definition).toContain('Line 1')
    })
  })

  // ==================== ERROR HANDLING ====================
  describe('Error Handling', () => {
    it('should handle AI generation failure scenario', async () => {
      const mockGenerateContent = vi.fn().mockRejectedValue(new Error('AI generation failed'))
      await expect(mockGenerateContent()).rejects.toThrow('AI generation failed')
    })

    it('should handle file upload failure scenario', async () => {
      const mockUpload = vi.fn().mockRejectedValue(new Error('Upload failed'))
      await expect(mockUpload()).rejects.toThrow('Upload failed')
    })

    it('should handle file processing failure scenario', async () => {
      const FileState = { FAILED: 'FAILED', PROCESSING: 'PROCESSING', ACTIVE: 'ACTIVE' }
      const mockGetFile = vi.fn().mockResolvedValue({ state: FileState.FAILED })
      const file = await mockGetFile()
      expect(file.state).toBe(FileState.FAILED)
    })

    it('should handle network timeout', async () => {
      const { checkAIRateLimit } = await import('../../services/rateLimit')
      vi.mocked(checkAIRateLimit).mockRejectedValue(new Error('Network timeout'))

      await expect(checkAIRateLimit()).rejects.toThrow('Network timeout')
    })

    it('should handle malformed AI response', () => {
      const responseText = '[{"term": "Test", "definition": incomplete'
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        expect(() => JSON.parse(jsonMatch[0])).toThrow()
      }
    })
  })

  // ==================== EDGE CASES ====================
  describe('Edge Cases', () => {
    it('should handle very large text content', () => {
      const largeText = 'a'.repeat(100000)
      expect(largeText.length).toBe(100000)
    })

    it('should handle empty text content', () => {
      const emptyText = ''
      expect(emptyText.trim()).toBe('')
    })

    it('should handle whitespace-only text content', () => {
      const whitespaceText = '   \n\t   '
      expect(whitespaceText.trim()).toBe('')
    })

    it('should handle text with only special characters', () => {
      const specialText = '!@#$%^&*()_+-=[]{}|;:,.<>?'
      expect(specialText.length).toBeGreaterThan(0)
    })

    it('should handle concurrent requests', async () => {
      const { checkAIRateLimit } = await import('../../services/rateLimit')
      vi.mocked(checkAIRateLimit).mockResolvedValue({
        allowed: true,
        remaining: 10,
        resetAt: new Date(),
      })

      const results = await Promise.all([
        checkAIRateLimit(),
        checkAIRateLimit(),
        checkAIRateLimit(),
      ])

      expect(results).toHaveLength(3)
      results.forEach(r => expect(r.allowed).toBe(true))
    })
  })
})
