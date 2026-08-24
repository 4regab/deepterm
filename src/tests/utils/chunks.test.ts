import { describe, expect, it } from 'bun:test'
import { splitIntoChunks } from '@/utils/chunks'

describe('splitIntoChunks', () => {
  it('splits amounts the live increment_stat cap would reject', () => {
    expect(splitIntoChunks(25, 10)).toEqual([10, 10, 5])
    expect(splitIntoChunks(10, 10)).toEqual([10])
    expect(splitIntoChunks(0, 10)).toEqual([])
  })
})
