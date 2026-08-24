import { describe, expect, it } from 'bun:test'
import { fisherYatesShuffle } from '@/utils/shuffle'

describe('fisherYatesShuffle', () => {
  it('returns a permutation of the input', () => {
    const input = [1, 2, 3, 4, 5]
    let seq = 0
    const shuffled = fisherYatesShuffle(input, () => {
      seq += 0.17
      return seq % 1
    })
    expect(shuffled.sort()).toEqual(input)
    expect(shuffled).not.toBe(input)
  })

  it('is deterministic for a fixed random source', () => {
    const random = () => 0.3
    expect(fisherYatesShuffle(['a', 'b', 'c'], random)).toEqual(
      fisherYatesShuffle(['a', 'b', 'c'], random),
    )
  })
})
