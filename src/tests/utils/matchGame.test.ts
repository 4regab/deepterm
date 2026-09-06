import { describe, expect, it } from 'bun:test'
import { createGameCards, selectMatchPairs } from '@/utils/matchGame'
import { fisherYatesShuffle } from '@/utils/shuffle'

describe('matchGame', () => {
  it('does not always pick the first N cards from a larger set', () => {
    const cards = Array.from({ length: 12 }, (_, i) => ({
      id: `card-${i}`,
      term: `Term ${i}`,
      definition: `Def ${i}`,
    }))

    const selectedIds = new Set<string>()
    for (let seed = 0; seed < 40; seed++) {
      let i = seed
      const random = () => {
        i += 1
        return (i * 17 % 100) / 100
      }
      selectMatchPairs(cards, 6, random).forEach((card) => selectedIds.add(card.id))
    }

    expect(selectedIds.has('card-11') || selectedIds.has('card-10') || selectedIds.has('card-9')).toBe(true)
    expect(selectedIds.size).toBeGreaterThan(6)
  })

  it('returns all cards when the set is smaller than the pair count', () => {
    const cards = [
      { id: 'a', term: 'A', definition: '1' },
      { id: 'b', term: 'B', definition: '2' },
    ]
    const selected = selectMatchPairs(cards, 6, () => 0.1)
    expect(selected).toHaveLength(2)
  })

  it('creates shuffled term/definition pairs without duplicating pair ids', () => {
    const game = createGameCards([
      { id: '1', term: 'Cell', definition: 'Unit of life' },
      { id: '2', term: 'DNA', definition: 'Genetic material' },
    ], 6, () => 0.2)

    expect(game).toHaveLength(4)
    expect(game.filter((card) => card.type === 'term')).toHaveLength(2)
    expect(game.filter((card) => card.type === 'definition')).toHaveLength(2)
    expect(new Set(game.map((card) => card.id)).size).toBe(4)
  })

  it('shuffles without mutating the original array', () => {
    const original = [1, 2, 3, 4]
    const shuffled = fisherYatesShuffle(original, () => 0.9)
    expect(original).toEqual([1, 2, 3, 4])
    expect(shuffled).toHaveLength(4)
  })
})
