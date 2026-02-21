import { describe, it, expect } from 'bun:test'
import { parseGeneratedArticleResponse, RetryableGenerationError } from '@/lib/blog/generator'

function buildLongContent(wordCount = 950): string {
  return Array.from({ length: wordCount }, (_, i) => `term${i}`).join(' ')
}

describe('blog generator parsing', () => {
  it('parses valid JSON responses and preserves generated keywords', () => {
    const content = buildLongContent()
    const response = JSON.stringify({
      title: 'How to Study Better',
      metaDescription: 'A practical guide to stronger study outcomes.',
      excerpt: 'You can study better with deliberate methods.',
      content,
      keywords: ['study', 'learning', 'focus'],
    })

    const parsed = parseGeneratedArticleResponse(response, 'Fallback Topic', ['fallback'])

    expect(parsed.title).toBe('How to Study Better')
    expect(parsed.keywords).toEqual(['study', 'learning', 'focus'])
    expect(parsed.content).toContain('term0')
  })

  it('parses a valid article object when other JSON objects are present', () => {
    const content = buildLongContent()
    const noisyResponse = `Here are intermediate stats: {"source":"web","ok":true}\n${JSON.stringify({
      title: 'How to Study Better',
      metaDescription: 'A practical guide to stronger study outcomes.',
      excerpt: 'You can study better with deliberate methods.',
      content,
      keywords: ['study', 'learning', 'focus'],
    })}`

    const parsed = parseGeneratedArticleResponse(noisyResponse, 'Fallback Topic', ['fallback'])
    expect(parsed.title).toBe('How to Study Better')
    expect(parsed.content).toContain('term0')
  })

  it('uses fallback keywords when generated keywords are missing', () => {
    const content = buildLongContent()
    const response = JSON.stringify({
      title: 'How to Study Better',
      metaDescription: 'A practical guide to stronger study outcomes.',
      excerpt: 'You can study better with deliberate methods.',
      content,
    })

    const parsed = parseGeneratedArticleResponse(response, 'Fallback Topic', ['focus', 'memory'])
    expect(parsed.keywords).toEqual(['focus', 'memory'])
  })

  it('parses fenced JSON when extra wrapper text is present', () => {
    const content = buildLongContent()
    const response = `Output below:\n\n\`\`\`json\n${JSON.stringify({
      title: 'How to Study Better',
      metaDescription: 'A practical guide to stronger study outcomes.',
      excerpt: 'You can study better with deliberate methods.',
      content,
      keywords: ['study'],
    })}\n\`\`\`\n\nDone.`

    const parsed = parseGeneratedArticleResponse(response, 'Fallback Topic', ['fallback'])
    expect(parsed.keywords).toEqual(['study'])
    expect(parsed.content).toContain('term949')
  })

  it('rejects truncated JSON payloads', () => {
    const truncated = `{"title":"How to Study Better","metaDescription":"Good desc","excerpt":"Short excerpt","content":"This content ends abruptly`

    expect(() =>
      parseGeneratedArticleResponse(truncated, 'How to Study Better', ['study'])
    ).toThrow(RetryableGenerationError)
  })

  it('rejects responses that are too short', () => {
    const shortResponse = JSON.stringify({
      title: 'How to Study Better',
      metaDescription: 'A practical guide to stronger study outcomes.',
      excerpt: 'You can study better with deliberate methods.',
      content: 'This is too short to be a complete article.',
      keywords: ['study'],
    })

    expect(() =>
      parseGeneratedArticleResponse(shortResponse, 'How to Study Better', ['study'])
    ).toThrow(RetryableGenerationError)
  })
})
