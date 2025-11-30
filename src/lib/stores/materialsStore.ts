import { create } from 'zustand'
import type { MaterialItem, MaterialFilter } from '../schemas/materials'

interface MaterialsState {
  items: MaterialItem[]
  searchQuery: string
  activeFilter: MaterialFilter
  loading: boolean
  error: Error | null
}

interface MaterialsActions {
  setItems: (items: MaterialItem[]) => void
  removeItem: (id: string) => void
  setSearchQuery: (query: string) => void
  setActiveFilter: (filter: MaterialFilter) => void
  setLoading: (loading: boolean) => void
  setError: (error: Error | null) => void
  getFilteredItems: () => MaterialItem[]
}

type MaterialsStore = MaterialsState & MaterialsActions

export const useMaterialsStore = create<MaterialsStore>()((set, get) => ({
  items: [],
  searchQuery: '',
  activeFilter: 'All',
  loading: false,
  error: null,

  setItems: (items) => set({ items }),

  removeItem: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  setActiveFilter: (filter) => set({ activeFilter: filter }),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),

  getFilteredItems: () => {
    const { items, searchQuery, activeFilter } = get()
    return items.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesFilter = activeFilter === 'All' || item.type === activeFilter
      return matchesSearch && matchesFilter
    })
  },
}))
