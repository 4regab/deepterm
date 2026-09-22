import { create } from 'zustand'
import { createClient } from '@/config/supabase/client'

// Cache TTL: 5 minutes - prevents unnecessary refetches
const CACHE_TTL_MS = 5 * 60 * 1000

interface XPStats {
  totalXp: number
  currentLevel: number
  xpInLevel: number
  xpForNext: number
}

interface XPState {
  stats: XPStats | null
  loading: boolean
  error: Error | null
  lastLevelUp: boolean
  lastFetched: number | null
}

interface XPActions {
  fetchXPStats: (force?: boolean) => Promise<void>
  setStats: (stats: XPStats) => void
  invalidateCache: () => void
}

type XPStore = XPState & XPActions

const DEFAULT_STATS: XPStats = {
  totalXp: 0,
  currentLevel: 1,
  xpInLevel: 0,
  xpForNext: 100,
}

export const useXPStore = create<XPStore>()((set, get) => ({
  stats: null,
  loading: false,
  error: null,
  lastLevelUp: false,
  lastFetched: null,

  fetchXPStats: async (force = false) => {
    const state = get()

    // Skip if already loading
    if (state.loading) return

    // TTL check: skip fetch if cache is fresh and not forced
    if (
      !force &&
      state.stats &&
      state.lastFetched &&
      Date.now() - state.lastFetched < CACHE_TTL_MS
    ) {
      return
    }

    set({ loading: true, error: null })

    try {
      const supabase = createClient()

      // Auth guard: skip fetch for unauthenticated users (SECURITY FIX)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        set({ stats: DEFAULT_STATS, loading: false, lastFetched: Date.now() })
        return
      }

      const { data, error } = await supabase.rpc('get_user_xp_stats')

      if (error) throw error

      if (data && data.length > 0) {
        const row = data[0]
        set({
          stats: {
            totalXp: row.total_xp || 0,
            currentLevel: row.current_level || 1,
            xpInLevel: row.xp_in_level || 0,
            xpForNext: row.xp_for_next || 100,
          },
          loading: false,
          lastFetched: Date.now(),
        })
      } else {
        set({ stats: DEFAULT_STATS, loading: false, lastFetched: Date.now() })
      }
    } catch (error) {
      set({ error: error as Error, loading: false, stats: DEFAULT_STATS })
    }
  },

  setStats: (stats) => set({ stats, lastFetched: Date.now() }),

  invalidateCache: () => set({ lastFetched: null }),
}))
