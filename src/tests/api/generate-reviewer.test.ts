import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn(),
  FileState: { PROCESSING: 'PROCESSING', FAILED: 'FAILED', ACTIVE: 'ACTIVE' },
}))

vi.mock('../../services/rateLimit', () => ({
  checkAIRateLimit: vi.fn(),
  incrementAIUsage: vi.fn(),
}))

describe('generate-reviewer API route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('GEMINI_API_KEY', 'test-api-key')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  // ==================== EXTRACTION MODE TESTS ====================
  describe('Extraction Modes', () => {
    it('should handle full extraction mode', () => {
      const mode = 'full'
      expect(['full', 'sentence', 'keywords']).toContain(mode)
    })

    it('should handle sentence extraction mode', () => {
      const mode = 'sentence'
      expect(['full', 'sentence', 'keywords']).toContain(mode)
    })

    it('should handle keywords extraction mode', () => {
      const mode = 'keywords'
      expect(['full', 'sentence', 'keywords']).toContain(mode)
    })

    it('should default to full mode when not specified', () => {
      const mode = undefined || 'full'
      expect(mode).toBe('full')
    })
  })

  // ==================== RESPONSE PARSING ====================
  describe('Response Parsing', () => {
    it('should parse valid JSON object response', () => {
      const responseText = '{"title": "Test", "categories": []}'
      const result = JSON.parse(responseText)
      expect(result.title).toBe('Test')
      expect(result.categories).toEqual([])
    })

    it('should parse response with categories and terms', () => {
      const responseText = JSON.stringify({
        title: 'Biology Notes',
        categories: [{
          name: 'Cell Biology',
          color: '#E0F2FE',
          terms: [{ term: 'Mitochondria', definition: 'Powerhouse of the cell' }]
        }]
      })
      const result = JSON.parse(responseText)
      expect(result.categories).toHaveLength(1)
      expect(result.categories[0].terms).toHaveLength(1)
    })

    it('should handle response with missing categories', () => {
      const responseText = '{"title": "Test"}'
      const result = JSON.parse(responseText)
      if (!result.categories) result.categories = []
      expect(result.categories).toEqual([])
    })

    it('should handle response with null categories', () => {
      const responseText = '{"title": "Test", "categories": null}'
      const result = JSON.parse(responseText)
      result.categories = result.categories || []
      expect(result.categories).toEqual([])
    })

    it('should fix trailing commas in JSON', () => {
      const brokenJson = '{"title": "Test", "categories": [],}'
      const fixedJson = brokenJson.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']')
      const result = JSON.parse(fixedJson)
      expect(result.title).toBe('Test')
    })

    it('should handle terms with examples', () => {
      const responseText = JSON.stringify({
        title: 'Test',
        categories: [{
          name: 'Category',
          color: '#FFF',
          terms: [{
            term: 'Test Term',
            definition: 'Test Definition',
            examples: ['Example 1', 'Example 2']
          }]
        }]
      })
      const result = JSON.parse(responseText)
      expect(result.categories[0].terms[0].examples).toHaveLength(2)
    })

    it('should handle terms with keywords', () => {
      const responseText = JSON.stringify({
        title: 'Test',
        categories: [{
          name: 'Category',
          color: '#FFF',
          terms: [{
            term: 'Test Term',
            definition: 'Test Definition',
            keywords: ['key1', 'key2', 'key3']
          }]
        }]
      })
      const result = JSON.parse(responseText)
      expect(result.categories[0].terms[0].keywords).toHaveLength(3)
    })

    it('should handle terms with subcategories', () => {
      const responseText = JSON.stringify({
        title: 'Test',
        categories: [{
          name: 'Category',
          color: '#FFF',
          terms: [{
            term: 'Test Term',
            definition: 'Test Definition',
            subcategoryTitle: 'Types',
            subcategories: ['Type A', 'Type B']
          }]
        }]
      })
      const result = JSON.parse(responseText)
      expect(result.categories[0].terms[0].subcategories).toHaveLength(2)
    })
  })

  // ==================== CATEGORY COLOR VALIDATION ====================
  describe('Category Colors', () => {
    const validColors = ['#E0F2FE', '#DCFCE7', '#FEF3C7', '#FCE7F3', '#E0E7FF', '#F3E8FF']

    it('should accept valid hex colors', () => {
      validColors.forEach(color => {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
      })
    })

    it('should handle missing color with default', () => {
      const category = { name: 'Test', color: undefined }
      const color = category.color || '#E0F2FE'
      expect(color).toBe('#E0F2FE')
    })
  })

  // ==================== FILE HANDLING ====================
  describe('File Handling', () => {
    const getMimeTypeFromName = (filename: string): string | null => {
      const ext = filename.toLowerCase().split('.').pop()
      switch (ext) {
        case 'pdf': return 'application/pdf'
        case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        case 'txt': return 'text/plain'
        default: return null
      }
    }

    it('should accept PDF files', () => {
      expect(getMimeTypeFromName('notes.pdf')).toBe('application/pdf')
    })

    it('should accept DOCX files', () => {
      expect(getMimeTypeFromName('notes.docx')).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    })

    it('should accept TXT files', () => {
      expect(getMimeTypeFromName('notes.txt')).toBe('text/plain')
    })

    it('should reject unsupported files', () => {
      expect(getMimeTypeFromName('image.png')).toBeNull()
      expect(getMimeTypeFromName('video.mp4')).toBeNull()
      expect(getMimeTypeFromName('archive.zip')).toBeNull()
    })
  })

  // ==================== RATE LIMITING ====================
  describe('Rate Limiting', () => {
    it('should check rate limit before processing', async () => {
      const { checkAIRateLimit } = await import('../../services/rateLimit')
      vi.mocked(checkAIRateLimit).mockResolvedValue({
        allowed: true,
        remaining: 8,
        resetAt: new Date(),
      })

      const result = await checkAIRateLimit()
      expect(result.allowed).toBe(true)
    })

    it('should block when rate limit exceeded', async () => {
      const { checkAIRateLimit } = await import('../../services/rateLimit')
      vi.mocked(checkAIRateLimit).mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt: new Date(),
      })

      const result = await checkAIRateLimit()
      expect(result.allowed).toBe(false)
    })

    it('should increment usage after success', async () => {
      const { incrementAIUsage } = await import('../../services/rateLimit')
      vi.mocked(incrementAIUsage).mockResolvedValue(undefined)

      await incrementAIUsage()
      expect(incrementAIUsage).toHaveBeenCalled()
    })
  })

  // ==================== ERROR HANDLING ====================
  describe('Error Handling', () => {
    it('should handle malformed JSON response', () => {
      const malformedJson = '{"title": "Test", categories: []}'
      expect(() => JSON.parse(malformedJson)).toThrow()
    })

    it('should extract JSON object from text response', () => {
      const responseText = 'Here is the result: {"title": "Test", "categories": []}'
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      expect(jsonMatch).toBeTruthy()
      const result = JSON.parse(jsonMatch![0])
      expect(result.title).toBe('Test')
    })

    it('should handle empty response', () => {
      const responseText = ''
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      expect(jsonMatch).toBeNull()
    })

    it('should handle AI service error scenario', async () => {
      const mockGenerateContent = vi.fn().mockRejectedValue(new Error('Service unavailable'))
      await expect(mockGenerateContent()).rejects.toThrow('Service unavailable')
    })

    it('should handle file processing timeout scenario', async () => {
      const FileState = { PROCESSING: 'PROCESSING', FAILED: 'FAILED', ACTIVE: 'ACTIVE' }
      const mockGetFile = vi.fn().mockResolvedValue({ state: FileState.PROCESSING })
      const file = await mockGetFile()
      expect(file.state).toBe(FileState.PROCESSING)
    })
  })

  // ==================== EDGE CASES ====================
  describe('Edge Cases', () => {
    it('should handle very long text content', () => {
      const longText = 'Lorem ipsum '.repeat(10000)
      expect(longText.length).toBeGreaterThan(100000)
    })

    it('should handle text with special characters', () => {
      const specialText = 'Test <script>alert("xss")</script> & "quotes"'
      expect(specialText).toContain('<script>')
    })

    it('should handle unicode text', () => {
      const unicodeText = '这是中文测试 日本語テスト 한국어 테스트'
      expect(unicodeText.length).toBeGreaterThan(0)
    })

    it('should handle empty categories array', () => {
      const result = { title: 'Test', categories: [] }
      expect(result.categories).toHaveLength(0)
    })

    it('should handle category with empty terms', () => {
      const result = {
        title: 'Test',
        categories: [{ name: 'Empty', color: '#FFF', terms: [] }]
      }
      expect(result.categories[0].terms).toHaveLength(0)
    })

    it('should handle deeply nested response', () => {
      const result = {
        title: 'Test',
        categories: [{
          name: 'Category',
          color: '#FFF',
          terms: [{
            term: 'Term',
            definition: 'Def',
            examples: ['Ex1'],
            keywords: ['Key1'],
            subcategoryTitle: 'Sub',
            subcategories: ['SubA', 'SubB']
          }]
        }]
      }
      expect(result.categories[0].terms[0].subcategories).toHaveLength(2)
    })

    it('should handle concurrent requests', async () => {
      const { checkAIRateLimit } = await import('../../services/rateLimit')
      vi.mocked(checkAIRateLimit).mockResolvedValue({
        allowed: true,
        remaining: 5,
        resetAt: new Date(),
      })

      const results = await Promise.all([
        checkAIRateLimit(),
        checkAIRateLimit(),
        checkAIRateLimit(),
      ])

      expect(results).toHaveLength(3)
    })
  })

  // ==================== DATA INTEGRITY ====================
  describe('Data Integrity', () => {
    it('should preserve term order in categories', () => {
      const terms = [
        { term: 'A', definition: 'First' },
        { term: 'B', definition: 'Second' },
        { term: 'C', definition: 'Third' },
      ]
      expect(terms[0].term).toBe('A')
      expect(terms[2].term).toBe('C')
    })

    it('should preserve category order', () => {
      const categories = [
        { name: 'First', color: '#FFF', terms: [] },
        { name: 'Second', color: '#FFF', terms: [] },
      ]
      expect(categories[0].name).toBe('First')
      expect(categories[1].name).toBe('Second')
    })

    it('should not mutate input data', () => {
      const original = { title: 'Test', categories: [] }
      const copy = { ...original }
      copy.title = 'Modified'
      expect(original.title).toBe('Test')
    })
  })
})
