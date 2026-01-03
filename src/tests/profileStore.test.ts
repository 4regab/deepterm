import { describe, it, expect, beforeEach } from 'bun:test'
import { useProfileStore } from '../lib/stores/profileStore'
import type { Profile } from '../lib/schemas/profile'

const mockProfile: Profile = {
  full_name: 'John Doe',
  email: 'john@example.com',
  avatar_url: 'https://example.com/avatar.jpg',
}

describe('profileStore', () => {
  beforeEach(() => {
    useProfileStore.setState({
      profile: null,
      loading: false,
      error: null,
    })
  })

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

  describe('Data Integrity', () => {
    it('should store profile correctly', () => {
      const profileCopy = { ...mockProfile }
      useProfileStore.getState().setProfile(profileCopy)
      expect(useProfileStore.getState().profile?.full_name).toBe('John Doe')
      expect(useProfileStore.getState().profile?.email).toBe('john@example.com')
    })
  })

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
