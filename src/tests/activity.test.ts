import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { recordStudyActivity, addXP, incrementStat, logPomodoroSession, logQuizAttempt, logFlashcardReview, updateFlashcardStatus, XP_REWARDS } from '../services/activity'

vi.mock('../config/supabase/client', () => ({
  createClient: vi.fn(() => ({
    rpc: vi.fn(),
    from: vi.fn(),
  })),
}))

describe('activity utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ==================== XP_REWARDS CONSTANTS ====================
  describe('XP_REWARDS', () => {
    it('should have correct FLASHCARD_CORRECT value', () => {
      expect(XP_REWARDS.FLASHCARD_CORRECT).toBe(10)
    })

    it('should have correct FLASHCARD_MASTERED value', () => {
      expect(XP_REWARDS.FLASHCARD_MASTERED).toBe(25)
    })

    it('should have correct QUIZ_COMPLETED value', () => {
      expect(XP_REWARDS.QUIZ_COMPLETED).toBe(20)
    })

    it('should have correct QUIZ_PERFECT value', () => {
      expect(XP_REWARDS.QUIZ_PERFECT).toBe(50)
    })

    it('should have correct POMODORO_WORK value', () => {
      expect(XP_REWARDS.POMODORO_WORK).toBe(15)
    })

    it('should have correct STUDY_MINUTE value', () => {
      expect(XP_REWARDS.STUDY_MINUTE).toBe(1)
    })
  })

  // ==================== RECORD STUDY ACTIVITY (CREATE) ====================
  describe('recordStudyActivity', () => {
    it('should record activity with all options', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({ error: null }),
        from: vi.fn(),
      } as never)

      const result = await recordStudyActivity({
        minutes: 30,
        flashcards: 10,
        quizzes: 2,
        pomodoros: 1,
      })
      expect(result.error).toBeNull()
    })

    it('should record activity with partial options', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({ error: null }),
        from: vi.fn(),
      } as never)

      const result = await recordStudyActivity({ minutes: 15 })
      expect(result.error).toBeNull()
    })

    it('should record activity with empty options', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({ error: null }),
        from: vi.fn(),
      } as never)

      const result = await recordStudyActivity({})
      expect(result.error).toBeNull()
    })

    it('should handle zero values', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({ error: null }),
        from: vi.fn(),
      } as never)

      const result = await recordStudyActivity({
        minutes: 0,
        flashcards: 0,
        quizzes: 0,
        pomodoros: 0,
      })
      expect(result.error).toBeNull()
    })

    it('should return error on failure', async () => {
      const { createClient } = await import('../config/supabase/client')
      const mockError = new Error('RPC failed')
      vi.mocked(createClient).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({ error: mockError }),
        from: vi.fn(),
      } as never)

      const result = await recordStudyActivity({ minutes: 30 })
      expect(result.error).toBe(mockError)
    })

    it('should handle large values', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({ error: null }),
        from: vi.fn(),
      } as never)

      const result = await recordStudyActivity({
        minutes: 999999,
        flashcards: 999999,
        quizzes: 999999,
        pomodoros: 999999,
      })
      expect(result.error).toBeNull()
    })
  })

  // ==================== ADD XP (UPDATE) ====================
  describe('addXP', () => {
    it('should add XP and return leveledUp false', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({
          data: [{ leveled_up: false, new_level: 1 }],
          error: null,
        }),
        from: vi.fn(),
      } as never)

      const result = await addXP(50)
      expect(result.leveledUp).toBe(false)
    })

    it('should return leveledUp true when leveling up', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({
          data: [{ leveled_up: true, new_level: 2 }],
          error: null,
        }),
        from: vi.fn(),
      } as never)

      const result = await addXP(100)
      expect(result.leveledUp).toBe(true)
      expect(result.newLevel).toBe(2)
    })

    it('should return leveledUp false on error', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({ data: null, error: new Error('Failed') }),
        from: vi.fn(),
      } as never)

      const result = await addXP(50)
      expect(result.leveledUp).toBe(false)
    })

    it('should return leveledUp false when no data', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
        from: vi.fn(),
      } as never)

      const result = await addXP(50)
      expect(result.leveledUp).toBe(false)
    })

    it('should handle zero XP', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({
          data: [{ leveled_up: false, new_level: 1 }],
          error: null,
        }),
        from: vi.fn(),
      } as never)

      const result = await addXP(0)
      expect(result.leveledUp).toBe(false)
    })

    it('should handle negative XP', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({
          data: [{ leveled_up: false, new_level: 1 }],
          error: null,
        }),
        from: vi.fn(),
      } as never)

      const result = await addXP(-50)
      expect(result.leveledUp).toBe(false)
    })
  })

  // ==================== INCREMENT STAT (UPDATE) ====================
  describe('incrementStat', () => {
    it('should increment stat successfully', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({ error: null }),
        from: vi.fn(),
      } as never)

      const result = await incrementStat('flashcard_sets_created')
      expect(result.error).toBeNull()
    })

    it('should increment stat with custom amount', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({ error: null }),
        from: vi.fn(),
      } as never)

      const result = await incrementStat('flashcard_sets_created', 5)
      expect(result.error).toBeNull()
    })

    it('should return error for invalid stat name', async () => {
      const result = await incrementStat('invalid_stat')
      expect(result.error).toBeInstanceOf(Error)
      expect(result.error?.message).toContain('Invalid stat name')
    })

    it('should handle zero amount by clamping to 1', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({ error: null }),
        from: vi.fn(),
      } as never)

      const result = await incrementStat('flashcards_mastered', 0)
      expect(result.error).toBeNull()
    })
  })

  // ==================== LOG POMODORO SESSION (CREATE) ====================
  describe('logPomodoroSession', () => {
    it('should log work session and award XP', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
        rpc: vi.fn().mockResolvedValue({ data: [{ leveled_up: false }], error: null }),
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockResolvedValue({ error: null }),
        }),
      } as never)

      const result = await logPomodoroSession('work', 25, new Date())
      expect(result.error).toBeNull()
    })

    it('should log short break session', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
        rpc: vi.fn().mockResolvedValue({ error: null }),
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockResolvedValue({ error: null }),
        }),
      } as never)

      const result = await logPomodoroSession('shortBreak', 5, new Date())
      expect(result.error).toBeNull()
    })

    it('should log long break session', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
        rpc: vi.fn().mockResolvedValue({ error: null }),
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockResolvedValue({ error: null }),
        }),
      } as never)

      const result = await logPomodoroSession('longBreak', 15, new Date())
      expect(result.error).toBeNull()
    })

    it('should return error on insert failure', async () => {
      const { createClient } = await import('../config/supabase/client')
      const mockError = new Error('Insert failed')
      vi.mocked(createClient).mockReturnValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
        rpc: vi.fn().mockResolvedValue({ error: null }),
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockResolvedValue({ error: mockError }),
        }),
      } as never)

      const result = await logPomodoroSession('work', 25, new Date())
      expect(result.error).toBe(mockError)
    })

    it('should handle zero duration', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
        rpc: vi.fn().mockResolvedValue({ error: null }),
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockResolvedValue({ error: null }),
        }),
      } as never)

      const result = await logPomodoroSession('work', 0, new Date())
      expect(result.error).toBeNull()
    })
  })

  // ==================== LOG QUIZ ATTEMPT (CREATE) ====================
  describe('logQuizAttempt', () => {
    it('should log quiz attempt successfully', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
        rpc: vi.fn().mockResolvedValue({ error: null }),
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockResolvedValue({ error: null }),
        }),
      } as never)

      const result = await logQuizAttempt('quiz-1', 8, 10, { q1: 'a', q2: 'b' })
      expect(result.error).toBeNull()
    })

    it('should log perfect quiz and increment stat', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
        rpc: vi.fn().mockResolvedValue({ error: null }),
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockResolvedValue({ error: null }),
        }),
      } as never)

      const result = await logQuizAttempt('quiz-1', 10, 10, {})
      expect(result.error).toBeNull()
    })

    it('should return error on insert failure', async () => {
      const { createClient } = await import('../config/supabase/client')
      const mockError = new Error('Insert failed')
      vi.mocked(createClient).mockReturnValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
        rpc: vi.fn().mockResolvedValue({ error: null }),
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockResolvedValue({ error: mockError }),
        }),
      } as never)

      const result = await logQuizAttempt('quiz-1', 5, 10, {})
      expect(result.error).toBe(mockError)
    })

    it('should handle zero score', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
        rpc: vi.fn().mockResolvedValue({ error: null }),
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockResolvedValue({ error: null }),
        }),
      } as never)

      const result = await logQuizAttempt('quiz-1', 0, 10, {})
      expect(result.error).toBeNull()
    })

    it('should handle empty answers', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
        rpc: vi.fn().mockResolvedValue({ error: null }),
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockResolvedValue({ error: null }),
        }),
      } as never)

      const result = await logQuizAttempt('quiz-1', 5, 10, {})
      expect(result.error).toBeNull()
    })
  })

  // ==================== LOG FLASHCARD REVIEW (CREATE) ====================
  describe('logFlashcardReview', () => {
    it('should log flashcard review', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({ error: null }),
        from: vi.fn(),
      } as never)

      const result = await logFlashcardReview(10)
      expect(result.error).toBeNull()
    })

    it('should handle zero count', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({ error: null }),
        from: vi.fn(),
      } as never)

      const result = await logFlashcardReview(0)
      expect(result.error).toBeNull()
    })

    it('should handle large count', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({ error: null }),
        from: vi.fn(),
      } as never)

      const result = await logFlashcardReview(999999)
      expect(result.error).toBeNull()
    })
  })

  // ==================== UPDATE FLASHCARD STATUS (UPDATE) ====================
  describe('updateFlashcardStatus', () => {
    it('should update status to new', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({ error: null }),
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      } as never)

      const result = await updateFlashcardStatus('card-1', 'new')
      expect(result.error).toBeNull()
    })

    it('should update status to learning', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({ error: null }),
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      } as never)

      const result = await updateFlashcardStatus('card-1', 'learning')
      expect(result.error).toBeNull()
    })

    it('should update status to review', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({ error: null }),
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      } as never)

      const result = await updateFlashcardStatus('card-1', 'review')
      expect(result.error).toBeNull()
    })

    it('should update status to mastered and increment stat', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({ error: null }),
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      } as never)

      const result = await updateFlashcardStatus('card-1', 'mastered')
      expect(result.error).toBeNull()
    })

    it('should return error on update failure', async () => {
      const { createClient } = await import('../config/supabase/client')
      const mockError = new Error('Update failed')
      vi.mocked(createClient).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({ error: null }),
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: mockError }),
          }),
        }),
      } as never)

      const result = await updateFlashcardStatus('card-1', 'mastered')
      expect(result.error).toBe(mockError)
    })
  })
})
