import { create } from 'zustand'
import type { Profile } from '../schemas/profile'
import { createClient } from '@/config/supabase/client'

// Cache TTL: 5 minutes - prevents unnecessary refetches
const CACHE_TTL_MS = 5 * 60 * 1000

interface ProfileState {
  profile: Profile | null
  loading: boolean
  error: Error | null
  lastFetched: number | null
}

interface ProfileActions {
  fetchProfile: (force?: boolean) => Promise<void>
  setProfile: (profile: Profile | null) => void
  clearProfile: () => void
  invalidateCache: () => void
}

type ProfileStore = ProfileState & ProfileActions

export const useProfileStore = create<ProfileStore>()((set, get) => ({
  profile: null,
  loading: false,
  error: null,
  lastFetched: null,

  fetchProfile: async (force = false) => {
    const state = get()

    // Skip if already loading (prevents duplicate requests)
    if (state.loading) return

    // TTL check: skip fetch if cache is fresh and not forced
    if (
      !force &&
      state.profile &&
      state.lastFetched &&
      Date.now() - state.lastFetched < CACHE_TTL_MS
    ) {
      return
    }

    set({ loading: true, error: null })

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        set({ profile: null, loading: false, lastFetched: Date.now() })
        return
      }

      // Optimized: only select needed columns
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
        lastFetched: Date.now(),
      })
    } catch (error) {
      set({ error: error as Error, loading: false })
    }
  },

  setProfile: (profile) => set({ profile, lastFetched: Date.now() }),

  clearProfile: () => set({ profile: null, loading: false, error: null, lastFetched: null }),

  invalidateCache: () => set({ lastFetched: null }),
}))
