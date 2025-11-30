import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useUIStore } from '../lib/stores/uiStore'

describe('uiStore', () => {
  beforeEach(() => {
    useUIStore.setState({
      sidebarPinned: false,
      sidebarMobileOpen: false,
      profileMenuOpen: false,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ==================== SIDEBAR PINNED (UPDATE) ====================
  describe('setSidebarPinned', () => {
    it('should set sidebar pinned to true', () => {
      useUIStore.getState().setSidebarPinned(true)
      expect(useUIStore.getState().sidebarPinned).toBe(true)
    })

    it('should set sidebar pinned to false', () => {
      useUIStore.getState().setSidebarPinned(true)
      useUIStore.getState().setSidebarPinned(false)
      expect(useUIStore.getState().sidebarPinned).toBe(false)
    })

    it('should update state correctly', () => {
      useUIStore.getState().setSidebarPinned(true)
      expect(useUIStore.getState().sidebarPinned).toBe(true)
      useUIStore.getState().setSidebarPinned(false)
      expect(useUIStore.getState().sidebarPinned).toBe(false)
    })
  })


  // ==================== TOGGLE SIDEBAR PINNED (UPDATE) ====================
  describe('toggleSidebarPinned', () => {
    it('should toggle from false to true', () => {
      useUIStore.getState().toggleSidebarPinned()
      expect(useUIStore.getState().sidebarPinned).toBe(true)
    })

    it('should toggle from true to false', () => {
      useUIStore.setState({ sidebarPinned: true, sidebarMobileOpen: false, profileMenuOpen: false })
      useUIStore.getState().toggleSidebarPinned()
      expect(useUIStore.getState().sidebarPinned).toBe(false)
    })

    it('should toggle multiple times', () => {
      useUIStore.getState().toggleSidebarPinned()
      expect(useUIStore.getState().sidebarPinned).toBe(true)
      useUIStore.getState().toggleSidebarPinned()
      expect(useUIStore.getState().sidebarPinned).toBe(false)
      useUIStore.getState().toggleSidebarPinned()
      expect(useUIStore.getState().sidebarPinned).toBe(true)
    })

    it('should maintain correct state after toggle', () => {
      const initialState = useUIStore.getState().sidebarPinned
      useUIStore.getState().toggleSidebarPinned()
      expect(useUIStore.getState().sidebarPinned).toBe(!initialState)
    })
  })

  // ==================== SIDEBAR MOBILE OPEN (UPDATE) ====================
  describe('setSidebarMobileOpen', () => {
    it('should set mobile sidebar open to true', () => {
      useUIStore.getState().setSidebarMobileOpen(true)
      expect(useUIStore.getState().sidebarMobileOpen).toBe(true)
    })

    it('should set mobile sidebar open to false', () => {
      useUIStore.getState().setSidebarMobileOpen(true)
      useUIStore.getState().setSidebarMobileOpen(false)
      expect(useUIStore.getState().sidebarMobileOpen).toBe(false)
    })

    it('should toggle mobile sidebar multiple times', () => {
      useUIStore.getState().setSidebarMobileOpen(true)
      useUIStore.getState().setSidebarMobileOpen(false)
      useUIStore.getState().setSidebarMobileOpen(true)
      expect(useUIStore.getState().sidebarMobileOpen).toBe(true)
    })

    it('should not affect sidebar pinned state', () => {
      useUIStore.getState().setSidebarPinned(true)
      useUIStore.getState().setSidebarMobileOpen(true)
      expect(useUIStore.getState().sidebarPinned).toBe(true)
      expect(useUIStore.getState().sidebarMobileOpen).toBe(true)
    })
  })

  // ==================== PROFILE MENU OPEN (UPDATE) ====================
  describe('setProfileMenuOpen', () => {
    it('should set profile menu open to true', () => {
      useUIStore.getState().setProfileMenuOpen(true)
      expect(useUIStore.getState().profileMenuOpen).toBe(true)
    })

    it('should set profile menu open to false', () => {
      useUIStore.getState().setProfileMenuOpen(true)
      useUIStore.getState().setProfileMenuOpen(false)
      expect(useUIStore.getState().profileMenuOpen).toBe(false)
    })

    it('should toggle profile menu multiple times', () => {
      useUIStore.getState().setProfileMenuOpen(true)
      useUIStore.getState().setProfileMenuOpen(false)
      useUIStore.getState().setProfileMenuOpen(true)
      expect(useUIStore.getState().profileMenuOpen).toBe(true)
    })

    it('should not affect other UI states', () => {
      useUIStore.getState().setSidebarPinned(true)
      useUIStore.getState().setSidebarMobileOpen(true)
      useUIStore.getState().setProfileMenuOpen(true)
      expect(useUIStore.getState().sidebarPinned).toBe(true)
      expect(useUIStore.getState().sidebarMobileOpen).toBe(true)
      expect(useUIStore.getState().profileMenuOpen).toBe(true)
    })
  })

  // ==================== DATA INTEGRITY ====================
  describe('Data Integrity', () => {
    it('should maintain state isolation between UI elements', () => {
      useUIStore.setState({ sidebarPinned: true, sidebarMobileOpen: false, profileMenuOpen: true })

      expect(useUIStore.getState().sidebarPinned).toBe(true)
      expect(useUIStore.getState().sidebarMobileOpen).toBe(false)
      expect(useUIStore.getState().profileMenuOpen).toBe(true)
    })

    it('should handle rapid state changes via setState', () => {
      for (let i = 0; i < 100; i++) {
        const current = useUIStore.getState().sidebarPinned
        useUIStore.setState({ ...useUIStore.getState(), sidebarPinned: !current })
      }
      expect(useUIStore.getState().sidebarPinned).toBe(false)
    })

    it('should handle concurrent state updates via setState', () => {
      useUIStore.setState({ sidebarPinned: true, sidebarMobileOpen: true, profileMenuOpen: true })
      useUIStore.setState({ sidebarPinned: false, sidebarMobileOpen: false, profileMenuOpen: false })

      expect(useUIStore.getState().sidebarPinned).toBe(false)
      expect(useUIStore.getState().sidebarMobileOpen).toBe(false)
      expect(useUIStore.getState().profileMenuOpen).toBe(false)
    })
  })

  // ==================== EDGE CASES ====================
  describe('Edge Cases', () => {
    it('should handle setting same value multiple times via setState', () => {
      useUIStore.setState({ ...useUIStore.getState(), sidebarPinned: true })
      useUIStore.setState({ ...useUIStore.getState(), sidebarPinned: true })
      useUIStore.setState({ ...useUIStore.getState(), sidebarPinned: true })
      expect(useUIStore.getState().sidebarPinned).toBe(true)
    })

    it('should handle initial state correctly', () => {
      useUIStore.setState({
        sidebarPinned: false,
        sidebarMobileOpen: false,
        profileMenuOpen: false,
      })
      expect(useUIStore.getState().sidebarPinned).toBe(false)
      expect(useUIStore.getState().sidebarMobileOpen).toBe(false)
      expect(useUIStore.getState().profileMenuOpen).toBe(false)
    })
  })
})
