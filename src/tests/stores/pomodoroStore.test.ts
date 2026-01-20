/**
 * Pomodoro Store Tests - Following TDD & FIRST Principles
 * 
 * FIRST Principles Applied:
 * - Fast: No external dependencies, pure state testing
 * - Independent: beforeEach resets store to initial state
 * - Repeatable: Deterministic tests with fixed values
 * - Self-validating: Clear assertions with meaningful messages
 * - Timely: Tests written to verify store contract
 */

import { describe, it, expect, beforeEach } from 'bun:test'
import { usePomodoroStore } from '../../lib/stores/pomodoroStore'
import type { TimerPhase } from '../../lib/schemas/pomodoro'

describe('PomodoroStore', () => {
  // Initial state for reset between tests (FIRST: Independent)
  const initialState = {
    settings: { workDuration: 25, shortBreakDuration: 5, longBreakDuration: 15 },
    timeLeft: 25 * 60, // 1500 seconds
    isRunning: false,
    phase: 'work' as TimerPhase,
    sessionCount: 0,
    tasks: [],
    showSettings: false,
    showToast: false,
    toastMessage: '',
    showConfetti: false,
    pendingPhasePrompt: false,
    pendingNextPhase: null,
    pendingTaskReminder: null,
  }

  beforeEach(() => {
    // Reset to clean state before each test (FIRST: Independent)
    usePomodoroStore.setState(initialState)
  })

  describe('Settings Management', () => {
    it('should initialize with default settings', () => {
      const { settings } = usePomodoroStore.getState()
      
      expect(settings.workDuration).toBe(25)
      expect(settings.shortBreakDuration).toBe(5)
      expect(settings.longBreakDuration).toBe(15)
    })

    it('should update work duration while preserving other settings', () => {
      usePomodoroStore.getState().setSettings({ workDuration: 30 })
      const { settings } = usePomodoroStore.getState()
      
      expect(settings.workDuration).toBe(30)
      expect(settings.shortBreakDuration).toBe(5) // Unchanged
      expect(settings.longBreakDuration).toBe(15) // Unchanged
    })

    it('should update timeLeft when settings change and timer not running', () => {
      usePomodoroStore.getState().setSettings({ workDuration: 30 })
      
      expect(usePomodoroStore.getState().timeLeft).toBe(30 * 60)
    })

    it('should NOT update timeLeft when timer is running', () => {
      usePomodoroStore.setState({ isRunning: true, timeLeft: 1000 })
      usePomodoroStore.getState().setSettings({ workDuration: 30 })
      
      expect(usePomodoroStore.getState().timeLeft).toBe(1000) // Unchanged
    })

    it('should update multiple settings at once', () => {
      usePomodoroStore.getState().setSettings({ 
        workDuration: 50, 
        shortBreakDuration: 10 
      })
      const { settings } = usePomodoroStore.getState()
      
      expect(settings.workDuration).toBe(50)
      expect(settings.shortBreakDuration).toBe(10)
    })

    // Edge cases
    it('should handle minimum duration values', () => {
      usePomodoroStore.getState().setSettings({ workDuration: 1 })
      expect(usePomodoroStore.getState().settings.workDuration).toBe(1)
    })

    it('should handle large duration values', () => {
      usePomodoroStore.getState().setSettings({ workDuration: 120 })
      expect(usePomodoroStore.getState().settings.workDuration).toBe(120)
    })
  })

  describe('Timer State', () => {
    it('should set timeLeft to specific value', () => {
      usePomodoroStore.getState().setTimeLeft(500)
      expect(usePomodoroStore.getState().timeLeft).toBe(500)
    })

    it('should handle zero timeLeft', () => {
      usePomodoroStore.getState().setTimeLeft(0)
      expect(usePomodoroStore.getState().timeLeft).toBe(0)
    })

    it('should toggle running state', () => {
      expect(usePomodoroStore.getState().isRunning).toBe(false)
      
      usePomodoroStore.getState().setIsRunning(true)
      expect(usePomodoroStore.getState().isRunning).toBe(true)
      
      usePomodoroStore.getState().setIsRunning(false)
      expect(usePomodoroStore.getState().isRunning).toBe(false)
    })
  })

  describe('Phase Management', () => {
    const phases: TimerPhase[] = ['work', 'shortBreak', 'longBreak']

    phases.forEach(phase => {
      it(`should set phase to ${phase}`, () => {
        usePomodoroStore.getState().setPhase(phase)
        expect(usePomodoroStore.getState().phase).toBe(phase)
      })
    })

    it('should switch phase and reset timer', () => {
      usePomodoroStore.getState().setTimeLeft(100)
      usePomodoroStore.getState().setIsRunning(true)
      
      usePomodoroStore.getState().switchPhase('shortBreak')
      
      expect(usePomodoroStore.getState().phase).toBe('shortBreak')
      expect(usePomodoroStore.getState().timeLeft).toBe(5 * 60) // shortBreakDuration
      expect(usePomodoroStore.getState().isRunning).toBe(false)
    })

    it('should use correct duration for each phase', () => {
      usePomodoroStore.getState().switchPhase('work')
      expect(usePomodoroStore.getState().timeLeft).toBe(25 * 60)

      usePomodoroStore.getState().switchPhase('shortBreak')
      expect(usePomodoroStore.getState().timeLeft).toBe(5 * 60)

      usePomodoroStore.getState().switchPhase('longBreak')
      expect(usePomodoroStore.getState().timeLeft).toBe(15 * 60)
    })
  })

  describe('Session Tracking', () => {
    it('should start with zero sessions', () => {
      expect(usePomodoroStore.getState().sessionCount).toBe(0)
    })

    it('should increment session count', () => {
      usePomodoroStore.getState().incrementSession()
      expect(usePomodoroStore.getState().sessionCount).toBe(1)
      
      usePomodoroStore.getState().incrementSession()
      expect(usePomodoroStore.getState().sessionCount).toBe(2)
    })

    it('should reset session count on timer reset', () => {
      usePomodoroStore.setState({ sessionCount: 5 })
      usePomodoroStore.getState().resetTimer()
      
      expect(usePomodoroStore.getState().sessionCount).toBe(0)
    })
  })

  describe('Task Management (CRUD)', () => {
    describe('CREATE - addTask', () => {
      it('should add task with text', () => {
        usePomodoroStore.getState().addTask('Study React')
        const { tasks } = usePomodoroStore.getState()
        
        expect(tasks).toHaveLength(1)
        expect(tasks[0].text).toBe('Study React')
        expect(tasks[0].completed).toBe(false)
      })

      it('should generate unique ID for each task', () => {
        usePomodoroStore.getState().addTask('Task 1')
        usePomodoroStore.getState().addTask('Task 2')
        const { tasks } = usePomodoroStore.getState()
        
        expect(tasks[0].id).not.toBe(tasks[1].id)
      })

      it('should add task with reminder', () => {
        usePomodoroStore.getState().addTask('Task with reminder', '14:30')
        const { tasks } = usePomodoroStore.getState()
        
        expect(tasks[0].reminder).toBeDefined()
        expect(tasks[0].reminder?.time).toBe('14:30')
        expect(tasks[0].reminder?.enabled).toBe(true)
        expect(tasks[0].reminder?.notified).toBe(false)
      })

      it('should add task without reminder when null', () => {
        usePomodoroStore.getState().addTask('Task without reminder', null)
        const { tasks } = usePomodoroStore.getState()
        
        expect(tasks[0].reminder).toBeUndefined()
      })
    })

    describe('READ - tasks array', () => {
      it('should return all tasks', () => {
        usePomodoroStore.getState().addTask('Task 1')
        usePomodoroStore.getState().addTask('Task 2')
        usePomodoroStore.getState().addTask('Task 3')
        
        expect(usePomodoroStore.getState().tasks).toHaveLength(3)
      })
    })

    describe('UPDATE - toggleTask', () => {
      it('should toggle task completion status', () => {
        usePomodoroStore.getState().addTask('Test task')
        const taskId = usePomodoroStore.getState().tasks[0].id
        
        expect(usePomodoroStore.getState().tasks[0].completed).toBe(false)
        
        usePomodoroStore.getState().toggleTask(taskId)
        expect(usePomodoroStore.getState().tasks[0].completed).toBe(true)
        
        usePomodoroStore.getState().toggleTask(taskId)
        expect(usePomodoroStore.getState().tasks[0].completed).toBe(false)
      })

      it('should show toast when completing task', () => {
        usePomodoroStore.getState().addTask('Test task')
        const taskId = usePomodoroStore.getState().tasks[0].id
        
        usePomodoroStore.getState().toggleTask(taskId)
        
        expect(usePomodoroStore.getState().showToast).toBe(true)
        expect(usePomodoroStore.getState().toastMessage).toContain('completed')
      })

      it('should not show toast when uncompleting task', () => {
        usePomodoroStore.getState().addTask('Test task')
        const taskId = usePomodoroStore.getState().tasks[0].id
        
        // Complete then uncomplete
        usePomodoroStore.getState().toggleTask(taskId)
        usePomodoroStore.setState({ showToast: false }) // Reset toast
        usePomodoroStore.getState().toggleTask(taskId)
        
        expect(usePomodoroStore.getState().showToast).toBe(false)
      })

      it('should not affect other tasks', () => {
        usePomodoroStore.getState().addTask('Task 1')
        usePomodoroStore.getState().addTask('Task 2')
        const task1Id = usePomodoroStore.getState().tasks[0].id
        
        usePomodoroStore.getState().toggleTask(task1Id)
        
        expect(usePomodoroStore.getState().tasks[0].completed).toBe(true)
        expect(usePomodoroStore.getState().tasks[1].completed).toBe(false)
      })
    })

    describe('DELETE - removeTask', () => {
      it('should remove task by ID', () => {
        usePomodoroStore.getState().addTask('Task to remove')
        const taskId = usePomodoroStore.getState().tasks[0].id
        
        usePomodoroStore.getState().removeTask(taskId)
        
        expect(usePomodoroStore.getState().tasks).toHaveLength(0)
      })

      it('should only remove specified task', () => {
        usePomodoroStore.getState().addTask('Task 1')
        usePomodoroStore.getState().addTask('Task 2')
        const task1Id = usePomodoroStore.getState().tasks[0].id
        
        usePomodoroStore.getState().removeTask(task1Id)
        
        expect(usePomodoroStore.getState().tasks).toHaveLength(1)
        expect(usePomodoroStore.getState().tasks[0].text).toBe('Task 2')
      })

      it('should handle removing non-existent task gracefully', () => {
        usePomodoroStore.getState().addTask('Task 1')
        
        usePomodoroStore.getState().removeTask('non-existent-id')
        
        expect(usePomodoroStore.getState().tasks).toHaveLength(1)
      })
    })

    describe('Task Reminders', () => {
      it('should update task reminder', () => {
        usePomodoroStore.getState().addTask('Task')
        const taskId = usePomodoroStore.getState().tasks[0].id
        
        usePomodoroStore.getState().updateTaskReminder(taskId, '15:00')
        
        expect(usePomodoroStore.getState().tasks[0].reminder?.time).toBe('15:00')
      })

      it('should remove reminder when set to null', () => {
        usePomodoroStore.getState().addTask('Task', '14:00')
        const taskId = usePomodoroStore.getState().tasks[0].id
        
        usePomodoroStore.getState().updateTaskReminder(taskId, null)
        
        expect(usePomodoroStore.getState().tasks[0].reminder).toBeUndefined()
      })

      it('should mark task as notified', () => {
        usePomodoroStore.getState().addTask('Task', '14:00')
        const taskId = usePomodoroStore.getState().tasks[0].id
        
        usePomodoroStore.getState().markTaskNotified(taskId)
        
        expect(usePomodoroStore.getState().tasks[0].reminder?.notified).toBe(true)
      })
    })
  })

  describe('UI State', () => {
    it('should toggle settings visibility', () => {
      usePomodoroStore.getState().setShowSettings(true)
      expect(usePomodoroStore.getState().showSettings).toBe(true)
      
      usePomodoroStore.getState().setShowSettings(false)
      expect(usePomodoroStore.getState().showSettings).toBe(false)
    })

    it('should manage toast state', () => {
      usePomodoroStore.getState().setToastMessage('Test message')
      usePomodoroStore.getState().setShowToast(true)
      
      expect(usePomodoroStore.getState().toastMessage).toBe('Test message')
      expect(usePomodoroStore.getState().showToast).toBe(true)
    })

    it('should manage confetti state', () => {
      usePomodoroStore.getState().setShowConfetti(true)
      expect(usePomodoroStore.getState().showConfetti).toBe(true)
    })
  })

  describe('Timer Reset', () => {
    it('should reset all timer state', () => {
      // Set up modified state
      usePomodoroStore.setState({
        timeLeft: 100,
        isRunning: true,
        sessionCount: 5,
      })
      
      usePomodoroStore.getState().resetTimer()
      
      expect(usePomodoroStore.getState().timeLeft).toBe(25 * 60)
      expect(usePomodoroStore.getState().isRunning).toBe(false)
      expect(usePomodoroStore.getState().sessionCount).toBe(0)
    })

    it('should reset to correct duration based on current phase', () => {
      usePomodoroStore.setState({ phase: 'shortBreak' })
      usePomodoroStore.getState().resetTimer()
      
      expect(usePomodoroStore.getState().timeLeft).toBe(5 * 60)
    })
  })

  describe('Phase Completion Notifications', () => {
    it('should set pending phase prompt', () => {
      usePomodoroStore.setState({
        pendingPhasePrompt: true,
        pendingNextPhase: 'shortBreak',
      })
      
      expect(usePomodoroStore.getState().pendingPhasePrompt).toBe(true)
      expect(usePomodoroStore.getState().pendingNextPhase).toBe('shortBreak')
    })

    it('should dismiss phase prompt and set up next phase', () => {
      usePomodoroStore.setState({
        pendingPhasePrompt: true,
        pendingNextPhase: 'shortBreak',
      })
      
      usePomodoroStore.getState().dismissPhasePrompt()
      
      expect(usePomodoroStore.getState().pendingPhasePrompt).toBe(false)
      expect(usePomodoroStore.getState().pendingNextPhase).toBeNull()
      expect(usePomodoroStore.getState().phase).toBe('shortBreak')
    })
  })

  describe('Data Integrity', () => {
    it('should maintain state isolation between operations', () => {
      usePomodoroStore.getState().setSettings({ workDuration: 30 })
      usePomodoroStore.getState().addTask('Task')
      usePomodoroStore.getState().setPhase('shortBreak')
      
      const state = usePomodoroStore.getState()
      expect(state.settings.workDuration).toBe(30)
      expect(state.tasks).toHaveLength(1)
      expect(state.phase).toBe('shortBreak')
    })

    it('should handle rapid state updates', () => {
      for (let i = 0; i < 100; i++) {
        usePomodoroStore.getState().setTimeLeft(i)
      }
      expect(usePomodoroStore.getState().timeLeft).toBe(99)
    })
  })
})
