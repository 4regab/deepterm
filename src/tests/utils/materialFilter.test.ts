import { describe, expect, it } from 'bun:test'
import { matchesMaterialFilter, selectMaterialSourceItems } from '@/utils/materialFilter'
import type { MaterialItem } from '@/lib/schemas/materials'

const flashcards: MaterialItem = {
  id: '11111111-1111-1111-1111-111111111111',
  title: 'Bio Cards',
  type: 'Flashcards',
  itemsCount: 10,
  lastAccessed: '2024-01-01',
}

const reviewer: MaterialItem = {
  id: '22222222-2222-2222-2222-222222222222',
  title: 'History Reviewer',
  type: 'Reviewer',
  itemsCount: 8,
  lastAccessed: '2024-01-02',
}

describe('materialFilter', () => {
  it('treats the Cards UI filter as Flashcards', () => {
    expect(matchesMaterialFilter('Flashcards', 'Cards')).toBe(true)
    expect(matchesMaterialFilter('Reviewer', 'Cards')).toBe(false)
  })

  it('matches exact types and All', () => {
    expect(matchesMaterialFilter('Reviewer', 'Reviewer')).toBe(true)
    expect(matchesMaterialFilter('Flashcards', 'Reviewer')).toBe(false)
    expect(matchesMaterialFilter('Flashcards', 'All')).toBe(true)
    expect(matchesMaterialFilter('Reviewer', 'All')).toBe(true)
  })

  it('keeps an empty client list after init instead of falling back to stale server items', () => {
    const initialItems = [flashcards, reviewer]
    expect(selectMaterialSourceItems(false, [], initialItems)).toEqual(initialItems)
    expect(selectMaterialSourceItems(true, [], initialItems)).toEqual([])
  })
})
