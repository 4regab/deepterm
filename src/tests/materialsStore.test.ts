import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
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
  })

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
  })

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
  })

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
  })

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

    it('should filter by search query (case insensitive)', () => {
      useMaterialsStore.getState().setSearchQuery('MATH')
      const filtered = useMaterialsStore.getState().getFilteredItems()
      expect(filtered).toHaveLength(1)
      expect(filtered[0].title).toBe('Math Notes')
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
  })

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
  })
})
