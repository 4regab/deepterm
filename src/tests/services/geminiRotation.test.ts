import { describe, expect, it } from 'bun:test'
import { rotationOrder } from '@/utils/geminiRotation'

describe('gemini key rotation order', () => {
  it('starts at the preferred key so file uploads and generation share the same key', () => {
    expect(rotationOrder(3, 0)).toEqual([0, 1, 2])
    expect(rotationOrder(3, 2)).toEqual([2, 0, 1])
    expect(rotationOrder(1, 0)).toEqual([0])
  })

  it('wraps negative or oversized start indexes', () => {
    expect(rotationOrder(4, 5)).toEqual([1, 2, 3, 0])
    expect(rotationOrder(0, 0)).toEqual([])
  })
})
