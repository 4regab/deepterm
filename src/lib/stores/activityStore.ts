import { create } from 'zustand'
import type { ActivityDay, UserStats } from '../schemas/activity'
import { createClient } from '@/config/supabase/client'

// Cache TTL: 5 minutes - prevents unnecessary refetches
const CACHE_TTL_MS = 5 * 60 * 1000

interface ActivityState {
  activity: ActivityDay[]
  stats: UserStats | null
  loading: boolean
  error: Error | null
  lastFetched: number | null
}

interface ActivityActions {
  fetchActivity: (force?: boolean) => Promise<void>
  setActivity: (activity: ActivityDay[]) => void
  setStats: (stats: UserStats | null) => void
  invalidateCache: () => void
}

type ActivityStore = ActivityState & ActivityActions

export const useActivityStore = create<ActivityStore>()((set, get) => ({
  activity: [],
  stats: null,
  loading: false,
  error: null,
  lastFetched: null,

  fetchActivity: async (force = false) => {
    const state = get()

    // Skip if already loading
    if (state.loading) return

    // TTL check: skip fetch if cache is fresh and not forced
    if (
      !force &&
      state.activity.length > 0 &&
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
        set({ activity: [], stats: null, loading: false, lastFetched: Date.now() })
        return
      }

      // Parallel fetch for calendar and stats (still more efficient than sequential)
      const [calendarResult, statsResult] = await Promise.all([
        supabase.rpc('get_study_calendar'),
        // Only select needed columns for stats
        supabase.from('user_stats').select('total_study_minutes, current_streak, longest_streak').single()
      ])

      if (calendarResult.error) throw calendarResult.error

      set({
        activity: calendarResult.data || [],
        stats: statsResult.data,
        loading: false,
        lastFetched: Date.now(),
      })
    } catch (error) {
      set({ error: error as Error, loading: false })
    }
  },

  setActivity: (activity) => set({ activity, lastFetched: Date.now() }),

  setStats: (stats) => set({ stats }),

  invalidateCache: () => set({ lastFetched: null }),
}))
