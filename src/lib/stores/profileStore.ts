import { create } from 'zustand'
import type { Profile } from '../schemas/profile'
import { createClient } from '@/config/supabase/client'

interface ProfileState {
  profile: Profile | null
  loading: boolean
  error: Error | null
}

interface ProfileActions {
  fetchProfile: () => Promise<void>
  setProfile: (profile: Profile | null) => void
  clearProfile: () => void
}

type ProfileStore = ProfileState & ProfileActions

export const useProfileStore = create<ProfileStore>()((set) => ({
  profile: null,
  loading: false,
  error: null,

  fetchProfile: async () => {
    set({ loading: true, error: null })
    
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        set({ profile: null, loading: false })
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('full_name, email, avatar_url')
        .eq('id', user.id)
        .single()

      const googleIdentity = user.identities?.find(i => i.provider === 'google')
      const identityData = googleIdentity?.identity_data

      const avatarUrl =
        data?.avatar_url ||
        user.user_metadata?.avatar_url ||
        user.user_metadata?.picture ||
        identityData?.avatar_url ||
        identityData?.picture

      const fullName =
        data?.full_name ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        identityData?.full_name ||
        identityData?.name

      set({
        profile: {
          full_name: fullName || null,
          email: data?.email || user.email || null,
          avatar_url: avatarUrl || null,
        },
        loading: false,
      })
    } catch (error) {
      set({ error: error as Error, loading: false })
    }
  },

  setProfile: (profile) => set({ profile }),
  
  clearProfile: () => set({ profile: null, loading: false, error: null }),
}))
