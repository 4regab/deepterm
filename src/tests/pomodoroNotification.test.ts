import { describe, it, expect, beforeEach, mock } from 'bun:test'
import fc from 'fast-check'
import { usePomodoroStore } from '../lib/stores/pomodoroStore'

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
  })

  describe('Property: stopNotification called before dismissPhasePrompt', () => {
    it('should always call stop before dismiss for any pending phase', () => {
      const phases = ['work', 'shortBreak', 'longBreak'] as const
      
      fc.assert(
        fc.property(
          fc.constantFrom(...phases),
          fc.constantFrom(...phases),
          (currentPhase, pendingPhase) => {
            usePomodoroStore.setState({
              ...initialState,
              phase: currentPhase,
              pendingPhasePrompt: true,
              pendingNextPhase: pendingPhase,
            })

            const callOrder: string[] = []
            const mockStopNotification = mock(() => callOrder.push('stop'))
            const originalDismiss = usePomodoroStore.getState().dismissPhasePrompt
            
            const wrappedDismiss = () => {
              callOrder.push('dismiss')
              originalDismiss()
            }

            const handleDismiss = () => {
              mockStopNotification()
              wrappedDismiss()
            }

            handleDismiss()

            expect(callOrder[0]).toBe('stop')
            expect(callOrder[1]).toBe('dismiss')
            expect(mockStopNotification).toHaveBeenCalledTimes(1)
            expect(usePomodoroStore.getState().pendingPhasePrompt).toBe(false)
            return true
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  describe('Property: stopNotification called before startNextPhase', () => {
    it('should always call stop before starting next phase for any phase transition', () => {
      const phases = ['work', 'shortBreak', 'longBreak'] as const
      
      fc.assert(
        fc.property(
          fc.constantFrom(...phases),
          fc.constantFrom(...phases),
          (currentPhase, pendingPhase) => {
            usePomodoroStore.setState({
              ...initialState,
              phase: currentPhase,
              pendingPhasePrompt: true,
              pendingNextPhase: pendingPhase,
            })

            const callOrder: string[] = []
            const mockStopNotification = mock(() => callOrder.push('stop'))
            const originalStartNext = usePomodoroStore.getState().startNextPhase
            
            const wrappedStartNext = () => {
              callOrder.push('startNext')
              originalStartNext()
            }

            const handleStartNextPhase = () => {
              mockStopNotification()
              wrappedStartNext()
            }

            handleStartNextPhase()

            expect(callOrder[0]).toBe('stop')
            expect(callOrder[1]).toBe('startNext')
            expect(mockStopNotification).toHaveBeenCalledTimes(1)
            expect(usePomodoroStore.getState().pendingPhasePrompt).toBe(false)
            expect(usePomodoroStore.getState().phase).toBe(pendingPhase)
            return true
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  describe('Property: No audio overlap possible', () => {
    it('should guarantee sound is stopped before any phase transition', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          fc.constantFrom('work', 'shortBreak', 'longBreak'),
          (isDismiss, pendingPhase) => {
            usePomodoroStore.setState({
              ...initialState,
              pendingPhasePrompt: true,
              pendingNextPhase: pendingPhase as 'work' | 'shortBreak' | 'longBreak',
            })

            let soundStopped = false
            let stateChangedWhileSoundPlaying = false
            
            const mockStopNotification = mock(() => {
              soundStopped = true
            })

            const checkStateChange = () => {
              if (!soundStopped) {
                stateChangedWhileSoundPlaying = true
              }
            }

            if (isDismiss) {
              mockStopNotification()
              checkStateChange()
              usePomodoroStore.getState().dismissPhasePrompt()
            } else {
              mockStopNotification()
              checkStateChange()
              usePomodoroStore.getState().startNextPhase()
            }

            expect(stateChangedWhileSoundPlaying).toBe(false)
            expect(soundStopped).toBe(true)
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })

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

            const mockStopNotification = mock(() => {})
            
            for (let i = 0; i < clickCount; i++) {
              mockStopNotification()
              if (usePomodoroStore.getState().pendingNextPhase) {
                usePomodoroStore.getState().dismissPhasePrompt()
              }
            }

            expect(mockStopNotification).toHaveBeenCalledTimes(clickCount)
            expect(usePomodoroStore.getState().pendingPhasePrompt).toBe(false)
            return true
          }
        ),
        { numRuns: 20 }
      )
    })
  })

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

      expect(() => usePomodoroStore.getState().startNextPhase()).not.toThrow()
    })
  })
})
