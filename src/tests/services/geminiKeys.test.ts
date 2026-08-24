import { describe, expect, it } from 'bun:test'
import { loadApiKeys } from '@/services/geminiClient'

describe('loadApiKeys', () => {
  it('includes GEMINI_API_KEY before numbered keys and skips duplicates', () => {
    const keys = loadApiKeys({
      GEMINI_API_KEY: 'base-key',
      GEMINI_API_KEY_1: 'base-key',
      GEMINI_API_KEY_2: 'second-key',
      GEMINI_API_KEY_3: '',
    } as unknown as NodeJS.ProcessEnv)
    expect(keys).toEqual(['base-key', 'second-key'])
  })

  it('returns numbered keys when the base key is absent', () => {
    const keys = loadApiKeys({
      GEMINI_API_KEY_1: 'one',
      GEMINI_API_KEY_5: 'five',
    } as unknown as NodeJS.ProcessEnv)
    expect(keys).toEqual(['one', 'five'])
  })
})
