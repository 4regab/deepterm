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
  addXP: (amount: number) => Promise<{ leveledUp: boolean }>
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

  addXP: async (amount: number) => {
    // Client-side bounds checking (defense in depth - server also validates)
    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
      console.error('Invalid XP amount:', amount)
      return { leveledUp: false }
    }
    const safeAmount = Math.max(1, Math.min(Math.floor(amount), 1000))

    try {
      const supabase = createClient()

      // Auth guard: require authenticated user (SECURITY FIX)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.warn('Cannot add XP: No authenticated user')
        return { leveledUp: false }
      }

      const { data, error } = await supabase.rpc('add_xp', { p_amount: safeAmount })

      if (error) throw error

      if (data && data.length > 0) {
        const row = data[0]
        const leveledUp = row.leveled_up || false

        set({
          stats: {
            totalXp: row.new_total_xp,
            currentLevel: row.new_level,
            xpInLevel: row.xp_in_level,
            xpForNext: row.xp_for_next,
          },
          lastLevelUp: leveledUp,
          lastFetched: Date.now(),
        })

        return { leveledUp }
      }

      return { leveledUp: false }
    } catch (error) {
      console.error('Failed to add XP:', error)
      return { leveledUp: false }
    }
  },

  setStats: (stats) => set({ stats, lastFetched: Date.now() }),

  invalidateCache: () => set({ lastFetched: null }),
}))
