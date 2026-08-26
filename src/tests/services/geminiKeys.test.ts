import { describe, expect, it } from 'bun:test'
import { isRotatableKeyError, loadApiKeys } from '@/services/geminiClient'

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

describe('isRotatableKeyError', () => {
  it('rotates past quota and dead keys', () => {
    expect(isRotatableKeyError(new Error('429 Too Many Requests'))).toBe(true)
    expect(isRotatableKeyError(new Error('RESOURCE_EXHAUSTED'))).toBe(true)
    expect(isRotatableKeyError(new Error('API key not valid. Please pass a valid API key.'))).toBe(true)
    expect(isRotatableKeyError(new Error('{"reason":"API_KEY_INVALID"}'))).toBe(true)
  })

  it('does not rotate past prompt or model errors', () => {
    expect(isRotatableKeyError(new Error('safety filter blocked the prompt'))).toBe(false)
    expect(isRotatableKeyError(new Error('model not found'))).toBe(false)
  })
})
