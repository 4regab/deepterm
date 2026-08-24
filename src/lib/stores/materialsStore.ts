import { create } from 'zustand'
import type { MaterialItem, MaterialFilter } from '../schemas/materials'
import { matchesMaterialFilter } from '@/utils/materialFilter'
import { matchesFolderFilter } from '@/utils/materialFolder'

interface MaterialsState {
  items: MaterialItem[]
  searchQuery: string
  activeFilter: MaterialFilter
  activeFolder: string | null
  loading: boolean
  error: Error | null
}

interface MaterialsActions {
  setItems: (items: MaterialItem[]) => void
  removeItem: (id: string) => void
  updateItemFolder: (id: string, folder: string | null) => void
  setSearchQuery: (query: string) => void
  setActiveFilter: (filter: MaterialFilter) => void
  setActiveFolder: (folder: string | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: Error | null) => void
  getFilteredItems: () => MaterialItem[]
}

type MaterialsStore = MaterialsState & MaterialsActions

export const useMaterialsStore = create<MaterialsStore>()((set, get) => ({
  items: [],
  searchQuery: '',
  activeFilter: 'All',
  activeFolder: null,
  loading: false,
  error: null,

  setItems: (items) => set({ items }),

  removeItem: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),

  updateItemFolder: (id, folder) => set((state) => ({
    items: state.items.map((item) => item.id === id ? { ...item, folder } : item),
  })),
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  setActiveFilter: (filter) => set({ activeFilter: filter }),

  setActiveFolder: (folder) => set({ activeFolder: folder }),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),

  getFilteredItems: () => {
    const { items, searchQuery, activeFilter, activeFolder } = get()
    return items.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesFilter = matchesMaterialFilter(item.type, activeFilter)
      const matchesFolder = matchesFolderFilter(item.folder, activeFolder)
      return matchesSearch && matchesFilter && matchesFolder
    })
  },
}))
