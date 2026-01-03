import { describe, it, expect } from 'bun:test'
import { XP_REWARDS } from '../services/activity'

describe('activity utilities', () => {
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
})
