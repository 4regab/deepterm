import { create } from 'zustand'
import type { Folder, MaterialFilter, MaterialItem } from '../schemas/materials'
import { matchesMaterialFilter } from '@/utils/materialFilter'
import { matchesFolderFilter, sortFolders } from '@/utils/materialFolder'

interface MaterialsState {
  items: MaterialItem[]
  /** The user's folders, read from public.folders. Drives the folder UI. */
  folders: Folder[]
  /**
   * True once the server payload has been handed to the store. Until then the
   * UI renders the server props; after it, an empty list means empty, not
   * "not loaded yet".
   */
  seeded: boolean
  searchQuery: string
  activeFilter: MaterialFilter
  activeFolderId: string | null
  loading: boolean
  error: Error | null
}

/** Everything needed to undo an optimistic mutation. */
export interface MaterialsSnapshot {
  items: MaterialItem[]
  folders: Folder[]
  activeFolderId: string | null
}

interface MaterialsActions {
  setItems: (items: MaterialItem[]) => void
  setFolders: (folders: Folder[]) => void
  removeItem: (id: string) => void
  setItemFolder: (id: string, folderId: string | null) => void
  addFolder: (folder: Folder) => void
  renameFolder: (id: string, name: string) => void
  removeFolder: (id: string) => void
  snapshot: () => MaterialsSnapshot
  restore: (snapshot: MaterialsSnapshot) => void
  setSearchQuery: (query: string) => void
  setActiveFilter: (filter: MaterialFilter) => void
  setActiveFolderId: (folderId: string | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: Error | null) => void
  getFilteredItems: () => MaterialItem[]
}

type MaterialsStore = MaterialsState & MaterialsActions

export const useMaterialsStore = create<MaterialsStore>()((set, get) => ({
  items: [],
  folders: [],
  seeded: false,
  searchQuery: '',
  activeFilter: 'All',
  activeFolderId: null,
  loading: false,
  error: null,

  setItems: (items) => set({ items, seeded: true }),

  setFolders: (folders) => set({ folders: sortFolders(folders) }),

  removeItem: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),

  setItemFolder: (id, folderId) =>
    set((state) => {
      const name = state.folders.find((folder) => folder.id === folderId)?.name ?? null
      return {
        items: state.items.map((item) =>
          item.id === id ? { ...item, folderId, folderName: folderId ? name : null } : item,
        ),
      }
    }),

  addFolder: (folder) =>
    set((state) => ({ folders: sortFolders([...state.folders, folder]) })),

  renameFolder: (id, name) =>
    set((state) => ({
      folders: sortFolders(
        state.folders.map((folder) => (folder.id === id ? { ...folder, name } : folder)),
      ),
      items: state.items.map((item) =>
        item.folderId === id ? { ...item, folderName: name } : item,
      ),
    })),

  // Mirrors `ON DELETE SET NULL`: the folder goes, the materials stay unfiled.
  removeFolder: (id) =>
    set((state) => ({
      folders: state.folders.filter((folder) => folder.id !== id),
      items: state.items.map((item) =>
        item.folderId === id ? { ...item, folderId: null, folderName: null } : item,
      ),
      activeFolderId: state.activeFolderId === id ? null : state.activeFolderId,
    })),

  snapshot: () => {
    const { items, folders, activeFolderId } = get()
    return { items, folders, activeFolderId }
  },

  restore: ({ items, folders, activeFolderId }) => set({ items, folders, activeFolderId }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setActiveFilter: (filter) => set({ activeFilter: filter }),

  setActiveFolderId: (folderId) => set({ activeFolderId: folderId }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  getFilteredItems: () => {
    const { items, searchQuery, activeFilter, activeFolderId } = get()
    const query = searchQuery.toLowerCase()
    return items.filter((item) => {
      const matchesSearch = item.title.toLowerCase().includes(query)
      const matchesFilter = matchesMaterialFilter(item.type, activeFilter)
      const matchesFolder = matchesFolderFilter(item.folderId, activeFolderId)
      return matchesSearch && matchesFilter && matchesFolder
    })
  },
}))
