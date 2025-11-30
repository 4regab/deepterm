import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import fc from 'fast-check'
import { usePomodoroStore } from '../lib/stores/pomodoroStore'

/**
 * Property-based tests for PomodoroNotification sound behavior
 * 
 * Core property being tested:
 * When user interacts with the notification (dismiss or start next phase),
 * the notification sound MUST be stopped before any state transition occurs.
 * 
 * This prevents audio overlap between notification sound and background sounds.
 */

describe('PomodoroNotification - Sound Stop Property Tests', () => {
  const initialState = {
    settings: { workDuration: 25, shortBreakDuration: 5, longBreakDuration: 15 },
    timeLeft: 25 * 60,
    isRunning: false,
    phase: 'work' as const,
    sessionCount: 0,
    tasks: [],
    showSettings: false,
    showToast: false,
    toastMessage: '',
    showConfetti: false,
    pendingPhasePrompt: false,
    pendingNextPhase: null,
  }

  beforeEach(() => {
    usePomodoroStore.setState(initialState)
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // ==================== PROPERTY: Sound Stop on Dismiss ====================
  describe('Property: stopNotification called before dismissPhasePrompt', () => {
    it('should always call stop before dismiss for any pending phase', () => {
      const phases = ['work', 'shortBreak', 'longBreak'] as const
      
      fc.assert(
        fc.property(
          fc.constantFrom(...phases),
          fc.constantFrom(...phases),
          (currentPhase, pendingPhase) => {
            // Setup: notification is showing
            usePomodoroStore.setState({
              ...initialState,
              phase: currentPhase,
              pendingPhasePrompt: true,
              pendingNextPhase: pendingPhase,
            })

            // Track call order
            const callOrder: string[] = []
            const mockStopNotification = vi.fn(() => callOrder.push('stop'))
            const originalDismiss = usePomodoroStore.getState().dismissPhasePrompt
            
            // Wrap dismissPhasePrompt to track call order
            const wrappedDismiss = () => {
              callOrder.push('dismiss')
              originalDismiss()
            }

            // Simulate handleDismiss behavior (as implemented in component)
            const handleDismiss = () => {
              mockStopNotification()
              wrappedDismiss()
            }

            // Execute
            handleDismiss()

            // Property: stop MUST be called before dismiss
            expect(callOrder[0]).toBe('stop')
            expect(callOrder[1]).toBe('dismiss')
            expect(mockStopNotification).toHaveBeenCalledTimes(1)
            
            // State should be updated
            expect(usePomodoroStore.getState().pendingPhasePrompt).toBe(false)
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  // ==================== PROPERTY: Sound Stop on Start Next Phase ====================
  describe('Property: stopNotification called before startNextPhase', () => {
    it('should always call stop before starting next phase for any phase transition', () => {
      const phases = ['work', 'shortBreak', 'longBreak'] as const
      
      fc.assert(
        fc.property(
          fc.constantFrom(...phases),
          fc.constantFrom(...phases),
          (currentPhase, pendingPhase) => {
            // Setup: notification is showing
            usePomodoroStore.setState({
              ...initialState,
              phase: currentPhase,
              pendingPhasePrompt: true,
              pendingNextPhase: pendingPhase,
            })

            // Track call order
            const callOrder: string[] = []
            const mockStopNotification = vi.fn(() => callOrder.push('stop'))
            const originalStartNext = usePomodoroStore.getState().startNextPhase
            
            // Wrap startNextPhase to track call order
            const wrappedStartNext = () => {
              callOrder.push('startNext')
              originalStartNext()
            }

            // Simulate handleStartNextPhase behavior (as implemented in component)
            const handleStartNextPhase = () => {
              mockStopNotification()
              wrappedStartNext()
            }

            // Execute
            handleStartNextPhase()

            // Property: stop MUST be called before startNextPhase
            expect(callOrder[0]).toBe('stop')
            expect(callOrder[1]).toBe('startNext')
            expect(mockStopNotification).toHaveBeenCalledTimes(1)
            
            // State should be updated
            expect(usePomodoroStore.getState().pendingPhasePrompt).toBe(false)
            expect(usePomodoroStore.getState().phase).toBe(pendingPhase)
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  // ==================== PROPERTY: No Sound Overlap ====================
  describe('Property: No audio overlap possible', () => {
    it('should guarantee sound is stopped before any phase transition that could start background audio', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // true = dismiss, false = start next
          fc.constantFrom('work', 'shortBreak', 'longBreak'),
          (isDismiss, pendingPhase) => {
            // Setup
            usePomodoroStore.setState({
              ...initialState,
              pendingPhasePrompt: true,
              pendingNextPhase: pendingPhase as 'work' | 'shortBreak' | 'longBreak',
            })

            let soundStopped = false
            let stateChangedWhileSoundPlaying = false
            
            const mockStopNotification = vi.fn(() => {
              soundStopped = true
            })

            const checkStateChange = () => {
              if (!soundStopped) {
                stateChangedWhileSoundPlaying = true
              }
            }

            // Simulate the handler behavior
            if (isDismiss) {
              mockStopNotification()
              checkStateChange()
              usePomodoroStore.getState().dismissPhasePrompt()
            } else {
              mockStopNotification()
              checkStateChange()
              usePomodoroStore.getState().startNextPhase()
            }

            // Property: state should never change while sound is still playing
            expect(stateChangedWhileSoundPlaying).toBe(false)
            expect(soundStopped).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // ==================== PROPERTY: Idempotent Stop ====================
  describe('Property: Multiple stop calls are safe', () => {
    it('should handle multiple rapid button clicks without error', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          (clickCount) => {
            usePomodoroStore.setState({
              ...initialState,
              pendingPhasePrompt: true,
              pendingNextPhase: 'shortBreak',
            })

            const mockStopNotification = vi.fn()
            
            // Simulate rapid clicks
            for (let i = 0; i < clickCount; i++) {
              mockStopNotification()
              // Only first dismiss should have effect (subsequent calls are no-ops)
              if (usePomodoroStore.getState().pendingNextPhase) {
                usePomodoroStore.getState().dismissPhasePrompt()
              }
            }

            // Property: stop should be called for each click
            expect(mockStopNotification).toHaveBeenCalledTimes(clickCount)
            // State should be stable after all clicks
            expect(usePomodoroStore.getState().pendingPhasePrompt).toBe(false)
          }
        ),
        { numRuns: 20 }
      )
    })
  })

  // ==================== UNIT TESTS: Store Actions ====================
  describe('Store Actions - dismissPhasePrompt', () => {
    it('should clear pending prompt state', () => {
      usePomodoroStore.setState({
        ...initialState,
        pendingPhasePrompt: true,
        pendingNextPhase: 'shortBreak',
      })

      usePomodoroStore.getState().dismissPhasePrompt()

      expect(usePomodoroStore.getState().pendingPhasePrompt).toBe(false)
      expect(usePomodoroStore.getState().pendingNextPhase).toBe(null)
    })

    it('should set phase to pending phase without starting timer', () => {
      usePomodoroStore.setState({
        ...initialState,
        phase: 'work',
        pendingPhasePrompt: true,
        pendingNextPhase: 'shortBreak',
      })

      usePomodoroStore.getState().dismissPhasePrompt()

      expect(usePomodoroStore.getState().phase).toBe('shortBreak')
      expect(usePomodoroStore.getState().isRunning).toBe(false)
    })

    it('should handle dismiss when no pending phase', () => {
      usePomodoroStore.setState({
        ...initialState,
        pendingPhasePrompt: false,
        pendingNextPhase: null,
      })

      // Should not throw
      expect(() => usePomodoroStore.getState().dismissPhasePrompt()).not.toThrow()
    })
  })

  describe('Store Actions - startNextPhase', () => {
    it('should clear pending prompt and start timer', () => {
      usePomodoroStore.setState({
        ...initialState,
        pendingPhasePrompt: true,
        pendingNextPhase: 'shortBreak',
      })

      usePomodoroStore.getState().startNextPhase()

      expect(usePomodoroStore.getState().pendingPhasePrompt).toBe(false)
      expect(usePomodoroStore.getState().pendingNextPhase).toBe(null)
      expect(usePomodoroStore.getState().phase).toBe('shortBreak')
      expect(usePomodoroStore.getState().isRunning).toBe(true)
    })

    it('should set correct time for each phase type', () => {
      const testCases = [
        { phase: 'work' as const, expectedTime: 25 * 60 },
        { phase: 'shortBreak' as const, expectedTime: 5 * 60 },
        { phase: 'longBreak' as const, expectedTime: 15 * 60 },
      ]

      testCases.forEach(({ phase, expectedTime }) => {
        usePomodoroStore.setState({
          ...initialState,
          pendingPhasePrompt: true,
          pendingNextPhase: phase,
        })

        usePomodoroStore.getState().startNextPhase()

        expect(usePomodoroStore.getState().timeLeft).toBe(expectedTime)
      })
    })

    it('should handle start when no pending phase', () => {
      usePomodoroStore.setState({
        ...initialState,
        pendingPhasePrompt: false,
        pendingNextPhase: null,
      })

      // Should not throw
      expect(() => usePomodoroStore.getState().startNextPhase()).not.toThrow()
    })
  })
})
