import { create } from 'zustand'
import type { Achievement } from '../schemas/achievements'
import { createClient } from '@/config/supabase/client'

interface AchievementsState {
  achievements: Achievement[]
  loading: boolean
  error: Error | null
}

interface AchievementsActions {
  fetchAchievements: () => Promise<void>
  setAchievements: (achievements: Achievement[]) => void
}

type AchievementsStore = AchievementsState & AchievementsActions

export const useAchievementsStore = create<AchievementsStore>()((set) => ({
  achievements: [],
  loading: false,
  error: null,

  fetchAchievements: async () => {
    set({ loading: true, error: null })
    
    try {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('get_user_achievements')
      
      if (error) throw error
      
      set({ achievements: data || [], loading: false })
    } catch (error) {
      set({ error: error as Error, loading: false })
    }
  },

  setAchievements: (achievements) => set({ achievements }),
}))
