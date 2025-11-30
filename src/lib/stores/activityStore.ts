import { create } from 'zustand'
import type { ActivityDay, UserStats } from '../schemas/activity'
import { createClient } from '@/config/supabase/client'

interface ActivityState {
  activity: ActivityDay[]
  stats: UserStats | null
  loading: boolean
  error: Error | null
}

interface ActivityActions {
  fetchActivity: () => Promise<void>
  setActivity: (activity: ActivityDay[]) => void
  setStats: (stats: UserStats | null) => void
}

type ActivityStore = ActivityState & ActivityActions

export const useActivityStore = create<ActivityStore>()((set) => ({
  activity: [],
  stats: null,
  loading: false,
  error: null,

  fetchActivity: async () => {
    set({ loading: true, error: null })
    
    try {
      const supabase = createClient()
      
      const [calendarResult, statsResult] = await Promise.all([
        supabase.rpc('get_study_calendar'),
        supabase.from('user_stats').select('total_study_minutes, current_streak, longest_streak').single()
      ])

      if (calendarResult.error) throw calendarResult.error

      set({
        activity: calendarResult.data || [],
        stats: statsResult.data,
        loading: false,
      })
    } catch (error) {
      set({ error: error as Error, loading: false })
    }
  },

  setActivity: (activity) => set({ activity }),
  
  setStats: (stats) => set({ stats }),
}))
