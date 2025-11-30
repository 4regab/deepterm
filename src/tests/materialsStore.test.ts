import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useMaterialsStore } from '../lib/stores/materialsStore'
import type { MaterialItem } from '../lib/schemas/materials'

const mockMaterials: MaterialItem[] = [
  { id: '1', title: 'Math Notes', type: 'Note', itemsCount: 5, lastAccessed: '2024-01-01' },
  { id: '2', title: 'Science Flashcards', type: 'Flashcards', itemsCount: 10, lastAccessed: '2024-01-02' },
  { id: '3', title: 'History Reviewer', type: 'Reviewer', itemsCount: 8, lastAccessed: '2024-01-03' },
]

describe('materialsStore', () => {
  beforeEach(() => {
    useMaterialsStore.setState({
      items: [],
      searchQuery: '',
      activeFilter: 'All',
      loading: false,
      error: null,
    })
  })

  afterEach(() => {
    useMaterialsStore.setState({
      items: [],
      searchQuery: '',
      activeFilter: 'All',
      loading: false,
      error: null,
    })
  })

  // ==================== SET ITEMS (CREATE/UPDATE) ====================
  describe('setItems', () => {
    it('should set items correctly', () => {
      useMaterialsStore.getState().setItems(mockMaterials)
      expect(useMaterialsStore.getState().items).toEqual(mockMaterials)
    })

    it('should replace existing items', () => {
      useMaterialsStore.getState().setItems(mockMaterials)
      const newItems = [mockMaterials[0]]
      useMaterialsStore.getState().setItems(newItems)
      expect(useMaterialsStore.getState().items).toEqual(newItems)
    })

    it('should handle empty items array', () => {
      useMaterialsStore.getState().setItems([])
      expect(useMaterialsStore.getState().items).toEqual([])
    })

    it('should handle item with zero itemsCount', () => {
      const zeroCountItem: MaterialItem[] = [{ id: '4', title: 'Empty', type: 'Note', itemsCount: 0, lastAccessed: '2024-01-01' }]
      useMaterialsStore.getState().setItems(zeroCountItem)
      expect(useMaterialsStore.getState().items[0].itemsCount).toBe(0)
    })

    it('should handle item with large itemsCount', () => {
      const largeCountItem: MaterialItem[] = [{ id: '5', title: 'Large', type: 'Flashcards', itemsCount: 999999, lastAccessed: '2024-01-01' }]
      useMaterialsStore.getState().setItems(largeCountItem)
      expect(useMaterialsStore.getState().items[0].itemsCount).toBe(999999)
    })

    it('should handle item with special characters in title', () => {
      const specialItem: MaterialItem[] = [{ id: '6', title: '<script>alert("xss")</script>', type: 'Note', itemsCount: 1, lastAccessed: '2024-01-01' }]
      useMaterialsStore.getState().setItems(specialItem)
      expect(useMaterialsStore.getState().items[0].title).toBe('<script>alert("xss")</script>')
    })

    it('should handle item with unicode characters', () => {
      const unicodeItem: MaterialItem[] = [{ id: '7', title: '数学笔记 📚', type: 'Note', itemsCount: 5, lastAccessed: '2024-01-01' }]
      useMaterialsStore.getState().setItems(unicodeItem)
      expect(useMaterialsStore.getState().items[0].title).toBe('数学笔记 📚')
    })

    it('should handle item with very long title', () => {
      const longTitle = 'A'.repeat(10000)
      const longItem: MaterialItem[] = [{ id: '8', title: longTitle, type: 'Note', itemsCount: 1, lastAccessed: '2024-01-01' }]
      useMaterialsStore.getState().setItems(longItem)
      expect(useMaterialsStore.getState().items[0].title).toBe(longTitle)
    })

    it('should handle large number of items', () => {
      const largeItems: MaterialItem[] = Array.from({ length: 1000 }, (_, i) => ({
        id: String(i),
        title: `Item ${i}`,
        type: 'Note' as const,
        itemsCount: i,
        lastAccessed: '2024-01-01',
      }))
      useMaterialsStore.getState().setItems(largeItems)
      expect(useMaterialsStore.getState().items).toHaveLength(1000)
    })

    it('should handle all material types', () => {
      useMaterialsStore.getState().setItems(mockMaterials)
      const types = useMaterialsStore.getState().items.map(i => i.type)
      expect(types).toContain('Note')
      expect(types).toContain('Flashcards')
      expect(types).toContain('Reviewer')
    })
  })

  // ==================== SET SEARCH QUERY (UPDATE) ====================
  describe('setSearchQuery', () => {
    it('should set search query', () => {
      useMaterialsStore.getState().setSearchQuery('math')
      expect(useMaterialsStore.getState().searchQuery).toBe('math')
    })

    it('should handle empty search query', () => {
      useMaterialsStore.getState().setSearchQuery('test')
      useMaterialsStore.getState().setSearchQuery('')
      expect(useMaterialsStore.getState().searchQuery).toBe('')
    })

    it('should handle whitespace-only query', () => {
      useMaterialsStore.getState().setSearchQuery('   ')
      expect(useMaterialsStore.getState().searchQuery).toBe('   ')
    })

    it('should handle special characters in query', () => {
      useMaterialsStore.getState().setSearchQuery('<script>alert("xss")</script>')
      expect(useMaterialsStore.getState().searchQuery).toBe('<script>alert("xss")</script>')
    })

    it('should handle unicode characters in query', () => {
      useMaterialsStore.getState().setSearchQuery('数学')
      expect(useMaterialsStore.getState().searchQuery).toBe('数学')
    })

    it('should handle very long query', () => {
      const longQuery = 'a'.repeat(10000)
      useMaterialsStore.getState().setSearchQuery(longQuery)
      expect(useMaterialsStore.getState().searchQuery).toBe(longQuery)
    })
  })

  // ==================== SET ACTIVE FILTER (UPDATE) ====================
  describe('setActiveFilter', () => {
    it('should set active filter to All', () => {
      useMaterialsStore.getState().setActiveFilter('All')
      expect(useMaterialsStore.getState().activeFilter).toBe('All')
    })

    it('should set active filter to Note', () => {
      useMaterialsStore.getState().setActiveFilter('Note')
      expect(useMaterialsStore.getState().activeFilter).toBe('Note')
    })

    it('should set active filter to Flashcards', () => {
      useMaterialsStore.getState().setActiveFilter('Flashcards')
      expect(useMaterialsStore.getState().activeFilter).toBe('Flashcards')
    })

    it('should set active filter to Reviewer', () => {
      useMaterialsStore.getState().setActiveFilter('Reviewer')
      expect(useMaterialsStore.getState().activeFilter).toBe('Reviewer')
    })

    it('should cycle through all filters', () => {
      useMaterialsStore.getState().setActiveFilter('All')
      expect(useMaterialsStore.getState().activeFilter).toBe('All')
      useMaterialsStore.getState().setActiveFilter('Note')
      expect(useMaterialsStore.getState().activeFilter).toBe('Note')
      useMaterialsStore.getState().setActiveFilter('Flashcards')
      expect(useMaterialsStore.getState().activeFilter).toBe('Flashcards')
      useMaterialsStore.getState().setActiveFilter('Reviewer')
      expect(useMaterialsStore.getState().activeFilter).toBe('Reviewer')
    })
  })

  // ==================== SET LOADING (UPDATE) ====================
  describe('setLoading', () => {
    it('should set loading state to true', () => {
      useMaterialsStore.getState().setLoading(true)
      expect(useMaterialsStore.getState().loading).toBe(true)
    })

    it('should set loading state to false', () => {
      useMaterialsStore.getState().setLoading(true)
      useMaterialsStore.getState().setLoading(false)
      expect(useMaterialsStore.getState().loading).toBe(false)
    })

    it('should toggle loading state multiple times', () => {
      useMaterialsStore.getState().setLoading(true)
      useMaterialsStore.getState().setLoading(false)
      useMaterialsStore.getState().setLoading(true)
      expect(useMaterialsStore.getState().loading).toBe(true)
    })
  })

  // ==================== SET ERROR (UPDATE) ====================
  describe('setError', () => {
    it('should set error', () => {
      const error = new Error('Test error')
      useMaterialsStore.getState().setError(error)
      expect(useMaterialsStore.getState().error).toBe(error)
    })

    it('should clear error with null', () => {
      useMaterialsStore.getState().setError(new Error('Test'))
      useMaterialsStore.getState().setError(null)
      expect(useMaterialsStore.getState().error).toBeNull()
    })

    it('should replace existing error', () => {
      useMaterialsStore.getState().setError(new Error('First error'))
      const secondError = new Error('Second error')
      useMaterialsStore.getState().setError(secondError)
      expect(useMaterialsStore.getState().error).toBe(secondError)
    })

    it('should handle error with special message', () => {
      const error = new Error('<script>alert("xss")</script>')
      useMaterialsStore.getState().setError(error)
      expect(useMaterialsStore.getState().error?.message).toBe('<script>alert("xss")</script>')
    })
  })

  // ==================== GET FILTERED ITEMS (READ) ====================
  describe('getFilteredItems', () => {
    beforeEach(() => {
      useMaterialsStore.getState().setItems(mockMaterials)
    })

    it('should return all items when filter is All and no search', () => {
      const filtered = useMaterialsStore.getState().getFilteredItems()
      expect(filtered).toEqual(mockMaterials)
    })

    it('should filter by type Note', () => {
      useMaterialsStore.getState().setActiveFilter('Note')
      const filtered = useMaterialsStore.getState().getFilteredItems()
      expect(filtered).toHaveLength(1)
      expect(filtered[0].type).toBe('Note')
    })

    it('should filter by type Flashcards', () => {
      useMaterialsStore.getState().setActiveFilter('Flashcards')
      const filtered = useMaterialsStore.getState().getFilteredItems()
      expect(filtered).toHaveLength(1)
      expect(filtered[0].type).toBe('Flashcards')
    })

    it('should filter by type Reviewer', () => {
      useMaterialsStore.getState().setActiveFilter('Reviewer')
      const filtered = useMaterialsStore.getState().getFilteredItems()
      expect(filtered).toHaveLength(1)
      expect(filtered[0].type).toBe('Reviewer')
    })

    it('should filter by search query (case insensitive)', () => {
      useMaterialsStore.getState().setSearchQuery('MATH')
      const filtered = useMaterialsStore.getState().getFilteredItems()
      expect(filtered).toHaveLength(1)
      expect(filtered[0].title).toBe('Math Notes')
    })

    it('should filter by lowercase search query', () => {
      useMaterialsStore.getState().setSearchQuery('math')
      const filtered = useMaterialsStore.getState().getFilteredItems()
      expect(filtered).toHaveLength(1)
    })

    it('should filter by mixed case search query', () => {
      useMaterialsStore.getState().setSearchQuery('MaTh')
      const filtered = useMaterialsStore.getState().getFilteredItems()
      expect(filtered).toHaveLength(1)
    })

    it('should combine filter and search', () => {
      useMaterialsStore.getState().setActiveFilter('Note')
      useMaterialsStore.getState().setSearchQuery('math')
      const filtered = useMaterialsStore.getState().getFilteredItems()
      expect(filtered).toHaveLength(1)
      expect(filtered[0].title).toBe('Math Notes')
    })

    it('should return empty array when no matches', () => {
      useMaterialsStore.getState().setSearchQuery('xyz')
      const filtered = useMaterialsStore.getState().getFilteredItems()
      expect(filtered).toHaveLength(0)
    })

    it('should return empty array when filter and search have no matches', () => {
      useMaterialsStore.getState().setActiveFilter('Note')
      useMaterialsStore.getState().setSearchQuery('science')
      const filtered = useMaterialsStore.getState().getFilteredItems()
      expect(filtered).toHaveLength(0)
    })

    it('should handle partial search match', () => {
      useMaterialsStore.getState().setSearchQuery('sci')
      const filtered = useMaterialsStore.getState().getFilteredItems()
      expect(filtered).toHaveLength(1)
      expect(filtered[0].title).toBe('Science Flashcards')
    })

    it('should handle search with spaces', () => {
      useMaterialsStore.getState().setSearchQuery('Math Notes')
      const filtered = useMaterialsStore.getState().getFilteredItems()
      expect(filtered).toHaveLength(1)
    })

    it('should return all items with empty search and All filter', () => {
      useMaterialsStore.getState().setSearchQuery('')
      useMaterialsStore.getState().setActiveFilter('All')
      const filtered = useMaterialsStore.getState().getFilteredItems()
      expect(filtered).toHaveLength(3)
    })

    it('should handle whitespace-only search query', () => {
      useMaterialsStore.getState().setSearchQuery('   ')
      const filtered = useMaterialsStore.getState().getFilteredItems()
      // Whitespace doesn't match any title
      expect(filtered).toHaveLength(0)
    })

    it('should handle special characters in search', () => {
      const specialItems: MaterialItem[] = [{ id: '99', title: 'Test & "quotes"', type: 'Note', itemsCount: 1, lastAccessed: '2024-01-01' }]
      useMaterialsStore.getState().setItems(specialItems)
      useMaterialsStore.getState().setSearchQuery('&')
      const filtered = useMaterialsStore.getState().getFilteredItems()
      expect(filtered).toHaveLength(1)
    })
  })

  // ==================== DATA INTEGRITY ====================
  describe('Data Integrity', () => {
    it('should store items correctly', () => {
      const itemsCopy = [...mockMaterials]
      useMaterialsStore.getState().setItems(itemsCopy)
      expect(useMaterialsStore.getState().items).toHaveLength(3)
      expect(useMaterialsStore.getState().items[0].id).toBe('1')
    })

    it('should maintain state isolation between operations', () => {
      useMaterialsStore.getState().setItems(mockMaterials)
      useMaterialsStore.getState().setSearchQuery('test')
      useMaterialsStore.getState().setActiveFilter('Note')
      useMaterialsStore.getState().setLoading(true)
      useMaterialsStore.getState().setError(new Error('test'))

      expect(useMaterialsStore.getState().items).toHaveLength(3)
      expect(useMaterialsStore.getState().searchQuery).toBe('test')
      expect(useMaterialsStore.getState().activeFilter).toBe('Note')
      expect(useMaterialsStore.getState().loading).toBe(true)
      expect(useMaterialsStore.getState().error).toBeTruthy()
    })

    it('should not affect items when changing filter', () => {
      const itemsCopy = [...mockMaterials]
      useMaterialsStore.getState().setItems(itemsCopy)
      useMaterialsStore.getState().setActiveFilter('Note')
      expect(useMaterialsStore.getState().items).toHaveLength(3)
    })

    it('should not affect items when changing search', () => {
      const itemsCopy = [...mockMaterials]
      useMaterialsStore.getState().setItems(itemsCopy)
      useMaterialsStore.getState().setSearchQuery('test')
      expect(useMaterialsStore.getState().items).toHaveLength(3)
    })
  })

  // ==================== EDGE CASES ====================
  describe('Edge Cases', () => {
    it('should handle item with empty title', () => {
      const emptyTitleItem: MaterialItem[] = [{ id: '10', title: '', type: 'Note', itemsCount: 1, lastAccessed: '2024-01-01' }]
      useMaterialsStore.getState().setItems(emptyTitleItem)
      expect(useMaterialsStore.getState().items[0].title).toBe('')
    })

    it('should handle item with negative itemsCount', () => {
      const negativeItem: MaterialItem[] = [{ id: '11', title: 'Negative', type: 'Note', itemsCount: -5, lastAccessed: '2024-01-01' }]
      useMaterialsStore.getState().setItems(negativeItem)
      expect(useMaterialsStore.getState().items[0].itemsCount).toBe(-5)
    })

    it('should handle item with invalid date format', () => {
      const invalidDateItem: MaterialItem[] = [{ id: '12', title: 'Invalid Date', type: 'Note', itemsCount: 1, lastAccessed: 'invalid-date' }]
      useMaterialsStore.getState().setItems(invalidDateItem)
      expect(useMaterialsStore.getState().items[0].lastAccessed).toBe('invalid-date')
    })

    it('should handle filtering empty items array', () => {
      useMaterialsStore.getState().setItems([])
      useMaterialsStore.getState().setSearchQuery('test')
      const filtered = useMaterialsStore.getState().getFilteredItems()
      expect(filtered).toHaveLength(0)
    })

    it('should handle duplicate item IDs', () => {
      const duplicateItems: MaterialItem[] = [
        { id: '1', title: 'First', type: 'Note', itemsCount: 1, lastAccessed: '2024-01-01' },
        { id: '1', title: 'Second', type: 'Note', itemsCount: 2, lastAccessed: '2024-01-02' },
      ]
      useMaterialsStore.getState().setItems(duplicateItems)
      expect(useMaterialsStore.getState().items).toHaveLength(2)
    })
  })
})
