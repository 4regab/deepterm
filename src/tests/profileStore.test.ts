import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useProfileStore } from '../lib/stores/profileStore'
import type { Profile } from '../lib/schemas/profile'

vi.mock('../config/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn() },
    from: vi.fn(),
  })),
}))

const mockProfile: Profile = {
  full_name: 'John Doe',
  email: 'john@example.com',
  avatar_url: 'https://example.com/avatar.jpg',
}

describe('profileStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useProfileStore.setState({
      profile: null,
      loading: false,
      error: null,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ==================== SET PROFILE (CREATE/UPDATE) ====================
  describe('setProfile', () => {
    it('should set profile with valid data', () => {
      useProfileStore.getState().setProfile(mockProfile)
      expect(useProfileStore.getState().profile).toEqual(mockProfile)
    })

    it('should set profile to null', () => {
      useProfileStore.getState().setProfile(mockProfile)
      useProfileStore.getState().setProfile(null)
      expect(useProfileStore.getState().profile).toBeNull()
    })

    it('should overwrite existing profile', () => {
      useProfileStore.getState().setProfile(mockProfile)
      const newProfile: Profile = {
        full_name: 'Jane Smith',
        email: 'jane@example.com',
        avatar_url: 'https://example.com/jane.jpg',
      }
      useProfileStore.getState().setProfile(newProfile)
      expect(useProfileStore.getState().profile).toEqual(newProfile)
    })

    it('should handle profile with null fields', () => {
      const partialProfile: Profile = {
        full_name: null,
        email: null,
        avatar_url: null,
      }
      useProfileStore.getState().setProfile(partialProfile)
      expect(useProfileStore.getState().profile).toEqual(partialProfile)
    })

    it('should handle profile with empty strings', () => {
      const emptyProfile: Profile = {
        full_name: '',
        email: '',
        avatar_url: '',
      }
      useProfileStore.getState().setProfile(emptyProfile)
      expect(useProfileStore.getState().profile?.full_name).toBe('')
    })

    it('should handle profile with special characters in name', () => {
      const specialProfile: Profile = {
        full_name: "O'Brien-Smith <script>",
        email: 'test@example.com',
        avatar_url: null,
      }
      useProfileStore.getState().setProfile(specialProfile)
      expect(useProfileStore.getState().profile?.full_name).toBe("O'Brien-Smith <script>")
    })

    it('should handle profile with unicode characters', () => {
      const unicodeProfile: Profile = {
        full_name: '田中太郎 🎉',
        email: 'tanaka@example.com',
        avatar_url: null,
      }
      useProfileStore.getState().setProfile(unicodeProfile)
      expect(useProfileStore.getState().profile?.full_name).toBe('田中太郎 🎉')
    })

    it('should handle very long name', () => {
      const longName = 'A'.repeat(1000)
      const longProfile: Profile = {
        full_name: longName,
        email: 'test@example.com',
        avatar_url: null,
      }
      useProfileStore.getState().setProfile(longProfile)
      expect(useProfileStore.getState().profile?.full_name).toBe(longName)
    })
  })

  // ==================== CLEAR PROFILE (DELETE) ====================
  describe('clearProfile', () => {
    it('should clear profile and reset state', () => {
      useProfileStore.setState({
        profile: mockProfile,
        loading: true,
        error: new Error('test'),
      })
      useProfileStore.getState().clearProfile()
      expect(useProfileStore.getState().profile).toBeNull()
      expect(useProfileStore.getState().loading).toBe(false)
      expect(useProfileStore.getState().error).toBeNull()
    })

    it('should handle clearing already null profile', () => {
      useProfileStore.getState().clearProfile()
      expect(useProfileStore.getState().profile).toBeNull()
    })

    it('should be idempotent - multiple clears', () => {
      useProfileStore.getState().setProfile(mockProfile)
      useProfileStore.getState().clearProfile()
      useProfileStore.getState().clearProfile()
      useProfileStore.getState().clearProfile()
      expect(useProfileStore.getState().profile).toBeNull()
      expect(useProfileStore.getState().loading).toBe(false)
      expect(useProfileStore.getState().error).toBeNull()
    })
  })

  // ==================== FETCH PROFILE (READ) ====================
  describe('fetchProfile', () => {
    it('should set loading to true when fetching', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        },
        from: vi.fn(),
      } as never)

      const fetchPromise = useProfileStore.getState().fetchProfile()
      expect(useProfileStore.getState().loading).toBe(true)
      await fetchPromise
    })

    it('should set profile to null when no user', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        },
        from: vi.fn(),
      } as never)

      await useProfileStore.getState().fetchProfile()
      expect(useProfileStore.getState().profile).toBeNull()
      expect(useProfileStore.getState().loading).toBe(false)
    })

    it('should fetch and set profile on successful fetch', async () => {
      const { createClient } = await import('../config/supabase/client')
      const mockUser = {
        id: 'user-123',
        email: 'john@example.com',
        user_metadata: {},
        identities: [],
      }
      vi.mocked(createClient).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockProfile,
                error: null,
              }),
            }),
          }),
        }),
      } as never)

      await useProfileStore.getState().fetchProfile()
      expect(useProfileStore.getState().profile).toBeTruthy()
      expect(useProfileStore.getState().loading).toBe(false)
      expect(useProfileStore.getState().error).toBeNull()
    })

    it('should use Google identity data as fallback', async () => {
      const { createClient } = await import('../config/supabase/client')
      const mockUser = {
        id: 'user-123',
        email: 'john@example.com',
        user_metadata: {},
        identities: [
          {
            provider: 'google',
            identity_data: {
              full_name: 'Google User',
              avatar_url: 'https://google.com/avatar.jpg',
            },
          },
        ],
      }
      vi.mocked(createClient).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { full_name: null, email: null, avatar_url: null },
                error: null,
              }),
            }),
          }),
        }),
      } as never)

      await useProfileStore.getState().fetchProfile()
      const profile = useProfileStore.getState().profile
      expect(profile?.full_name).toBe('Google User')
      expect(profile?.avatar_url).toBe('https://google.com/avatar.jpg')
    })

    it('should use user_metadata as fallback', async () => {
      const { createClient } = await import('../config/supabase/client')
      const mockUser = {
        id: 'user-123',
        email: 'john@example.com',
        user_metadata: {
          full_name: 'Metadata User',
          avatar_url: 'https://metadata.com/avatar.jpg',
        },
        identities: [],
      }
      vi.mocked(createClient).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { full_name: null, email: null, avatar_url: null },
                error: null,
              }),
            }),
          }),
        }),
      } as never)

      await useProfileStore.getState().fetchProfile()
      const profile = useProfileStore.getState().profile
      expect(profile?.full_name).toBe('Metadata User')
    })

    it('should set error on failed fetch', async () => {
      const { createClient } = await import('../config/supabase/client')
      const mockError = new Error('Fetch failed')
      vi.mocked(createClient).mockReturnValue({
        auth: {
          getUser: vi.fn().mockRejectedValue(mockError),
        },
        from: vi.fn(),
      } as never)

      await useProfileStore.getState().fetchProfile()
      expect(useProfileStore.getState().error).toBe(mockError)
      expect(useProfileStore.getState().loading).toBe(false)
    })

    it('should handle network timeout', async () => {
      const { createClient } = await import('../config/supabase/client')
      const timeoutError = new Error('Network timeout')
      vi.mocked(createClient).mockReturnValue({
        auth: {
          getUser: vi.fn().mockRejectedValue(timeoutError),
        },
        from: vi.fn(),
      } as never)

      await useProfileStore.getState().fetchProfile()
      expect(useProfileStore.getState().error).toBe(timeoutError)
    })

    it('should handle database error', async () => {
      const { createClient } = await import('../config/supabase/client')
      const mockUser = {
        id: 'user-123',
        email: 'john@example.com',
        user_metadata: {},
        identities: [],
      }
      const dbError = new Error('Database connection failed')
      vi.mocked(createClient).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockRejectedValue(dbError),
            }),
          }),
        }),
      } as never)

      await useProfileStore.getState().fetchProfile()
      expect(useProfileStore.getState().error).toBe(dbError)
    })

    it('should handle empty user object', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: {} } }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      } as never)

      await useProfileStore.getState().fetchProfile()
      expect(useProfileStore.getState().loading).toBe(false)
    })

    it('should clear previous error on new fetch', async () => {
      useProfileStore.setState({ error: new Error('Previous error') })
      
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        },
        from: vi.fn(),
      } as never)

      await useProfileStore.getState().fetchProfile()
      expect(useProfileStore.getState().error).toBeNull()
    })
  })

  // ==================== DATA INTEGRITY ====================
  describe('Data Integrity', () => {
    it('should store profile correctly', () => {
      const profileCopy = { ...mockProfile }
      useProfileStore.getState().setProfile(profileCopy)
      expect(useProfileStore.getState().profile?.full_name).toBe('John Doe')
      expect(useProfileStore.getState().profile?.email).toBe('john@example.com')
    })

    it('should maintain state consistency during concurrent operations', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        },
        from: vi.fn(),
      } as never)

      const fetch1 = useProfileStore.getState().fetchProfile()
      const fetch2 = useProfileStore.getState().fetchProfile()
      
      await Promise.all([fetch1, fetch2])
      expect(useProfileStore.getState().loading).toBe(false)
    })
  })

  // ==================== EDGE CASES ====================
  describe('Edge Cases', () => {
    it('should handle malformed email in profile', () => {
      const malformedProfile: Profile = {
        full_name: 'Test User',
        email: 'not-an-email',
        avatar_url: null,
      }
      useProfileStore.getState().setProfile(malformedProfile)
      expect(useProfileStore.getState().profile?.email).toBe('not-an-email')
    })

    it('should handle malformed URL in avatar', () => {
      const malformedProfile: Profile = {
        full_name: 'Test User',
        email: 'test@example.com',
        avatar_url: 'not-a-url',
      }
      useProfileStore.getState().setProfile(malformedProfile)
      expect(useProfileStore.getState().profile?.avatar_url).toBe('not-a-url')
    })

    it('should handle profile with only whitespace values', () => {
      const whitespaceProfile: Profile = {
        full_name: '   ',
        email: '   ',
        avatar_url: '   ',
      }
      useProfileStore.getState().setProfile(whitespaceProfile)
      expect(useProfileStore.getState().profile?.full_name).toBe('   ')
    })
  })
})
