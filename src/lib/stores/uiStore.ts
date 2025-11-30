import { create } from 'zustand'

interface UIState {
  sidebarPinned: boolean
  sidebarMobileOpen: boolean
  profileMenuOpen: boolean
}

interface UIActions {
  setSidebarPinned: (pinned: boolean) => void
  toggleSidebarPinned: () => void
  setSidebarMobileOpen: (open: boolean) => void
  setProfileMenuOpen: (open: boolean) => void
}

type UIStore = UIState & UIActions

const getInitialSidebarPinned = (): boolean => {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('sidebarPinned') === 'true'
}

export const useUIStore = create<UIStore>()((set) => ({
  sidebarPinned: false,
  sidebarMobileOpen: false,
  profileMenuOpen: false,

  setSidebarPinned: (pinned) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarPinned', String(pinned))
      window.dispatchEvent(new CustomEvent('sidebarPinnedChange'))
    }
    set({ sidebarPinned: pinned })
  },

  toggleSidebarPinned: () => {
    set((state) => {
      const newValue = !state.sidebarPinned
      if (typeof window !== 'undefined') {
        localStorage.setItem('sidebarPinned', String(newValue))
        window.dispatchEvent(new CustomEvent('sidebarPinnedChange'))
      }
      return { sidebarPinned: newValue }
    })
  },

  setSidebarMobileOpen: (open) => set({ sidebarMobileOpen: open }),
  
  setProfileMenuOpen: (open) => set({ profileMenuOpen: open }),
}))

// Initialize sidebar pinned state on client
if (typeof window !== 'undefined') {
  useUIStore.setState({ sidebarPinned: getInitialSidebarPinned() })
}
