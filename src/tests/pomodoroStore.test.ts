import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { usePomodoroStore } from '../lib/stores/pomodoroStore'

describe('pomodoroStore', () => {
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
  }

  beforeEach(() => {
    usePomodoroStore.setState(initialState)
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // ==================== SETTINGS CRUD ====================
  describe('setSettings', () => {
    it('should update partial settings', () => {
      usePomodoroStore.getState().setSettings({ workDuration: 30 })
      const settings = usePomodoroStore.getState().settings
      expect(settings.workDuration).toBe(30)
      expect(settings.shortBreakDuration).toBe(5)
      expect(settings.longBreakDuration).toBe(15)
    })

    it('should update multiple settings at once', () => {
      usePomodoroStore.getState().setSettings({ workDuration: 30, shortBreakDuration: 10, longBreakDuration: 20 })
      const settings = usePomodoroStore.getState().settings
      expect(settings.workDuration).toBe(30)
      expect(settings.shortBreakDuration).toBe(10)
      expect(settings.longBreakDuration).toBe(20)
    })

    it('should handle empty settings object', () => {
      usePomodoroStore.getState().setSettings({})
      const settings = usePomodoroStore.getState().settings
      expect(settings).toEqual(initialState.settings)
    })

    it('should handle boundary values - minimum duration', () => {
      usePomodoroStore.getState().setSettings({ workDuration: 1 })
      expect(usePomodoroStore.getState().settings.workDuration).toBe(1)
    })

    it('should handle boundary values - maximum duration', () => {
      usePomodoroStore.getState().setSettings({ workDuration: 120 })
      expect(usePomodoroStore.getState().settings.workDuration).toBe(120)
    })

    it('should handle zero duration', () => {
      usePomodoroStore.getState().setSettings({ workDuration: 0 })
      expect(usePomodoroStore.getState().settings.workDuration).toBe(0)
    })

    it('should handle negative duration', () => {
      usePomodoroStore.getState().setSettings({ workDuration: -5 })
      expect(usePomodoroStore.getState().settings.workDuration).toBe(-5)
    })
  })

  // ==================== TIME LEFT CRUD ====================
  describe('setTimeLeft', () => {
    it('should set time left to positive value', () => {
      usePomodoroStore.getState().setTimeLeft(1000)
      expect(usePomodoroStore.getState().timeLeft).toBe(1000)
    })

    it('should set time left to zero', () => {
      usePomodoroStore.getState().setTimeLeft(0)
      expect(usePomodoroStore.getState().timeLeft).toBe(0)
    })

    it('should handle negative time', () => {
      usePomodoroStore.getState().setTimeLeft(-100)
      expect(usePomodoroStore.getState().timeLeft).toBe(-100)
    })

    it('should handle very large time values', () => {
      usePomodoroStore.getState().setTimeLeft(Number.MAX_SAFE_INTEGER)
      expect(usePomodoroStore.getState().timeLeft).toBe(Number.MAX_SAFE_INTEGER)
    })

    it('should handle decimal time values', () => {
      usePomodoroStore.getState().setTimeLeft(100.5)
      expect(usePomodoroStore.getState().timeLeft).toBe(100.5)
    })
  })

  // ==================== RUNNING STATE ====================
  describe('setIsRunning', () => {
    it('should set running state to true', () => {
      usePomodoroStore.getState().setIsRunning(true)
      expect(usePomodoroStore.getState().isRunning).toBe(true)
    })

    it('should set running state to false', () => {
      usePomodoroStore.getState().setIsRunning(true)
      usePomodoroStore.getState().setIsRunning(false)
      expect(usePomodoroStore.getState().isRunning).toBe(false)
    })

    it('should toggle running state multiple times', () => {
      usePomodoroStore.getState().setIsRunning(true)
      usePomodoroStore.getState().setIsRunning(false)
      usePomodoroStore.getState().setIsRunning(true)
      expect(usePomodoroStore.getState().isRunning).toBe(true)
    })
  })

  // ==================== PHASE CRUD ====================
  describe('setPhase', () => {
    it('should set phase to work', () => {
      usePomodoroStore.getState().setPhase('work')
      expect(usePomodoroStore.getState().phase).toBe('work')
    })

    it('should set phase to shortBreak', () => {
      usePomodoroStore.getState().setPhase('shortBreak')
      expect(usePomodoroStore.getState().phase).toBe('shortBreak')
    })

    it('should set phase to longBreak', () => {
      usePomodoroStore.getState().setPhase('longBreak')
      expect(usePomodoroStore.getState().phase).toBe('longBreak')
    })

    it('should cycle through all phases', () => {
      usePomodoroStore.getState().setPhase('work')
      expect(usePomodoroStore.getState().phase).toBe('work')
      usePomodoroStore.getState().setPhase('shortBreak')
      expect(usePomodoroStore.getState().phase).toBe('shortBreak')
      usePomodoroStore.getState().setPhase('longBreak')
      expect(usePomodoroStore.getState().phase).toBe('longBreak')
      usePomodoroStore.getState().setPhase('work')
      expect(usePomodoroStore.getState().phase).toBe('work')
    })
  })

  // ==================== SESSION COUNT ====================
  describe('incrementSession', () => {
    it('should increment session count from zero', () => {
      usePomodoroStore.getState().incrementSession()
      expect(usePomodoroStore.getState().sessionCount).toBe(1)
    })

    it('should increment session count multiple times', () => {
      usePomodoroStore.getState().incrementSession()
      usePomodoroStore.getState().incrementSession()
      usePomodoroStore.getState().incrementSession()
      expect(usePomodoroStore.getState().sessionCount).toBe(3)
    })

    it('should handle large session counts', () => {
      usePomodoroStore.setState({ ...initialState, sessionCount: 999 })
      usePomodoroStore.getState().incrementSession()
      expect(usePomodoroStore.getState().sessionCount).toBe(1000)
    })
  })

  // ==================== TASK CRUD OPERATIONS ====================
  describe('Task CRUD - addTask (CREATE)', () => {
    it('should add a new task with valid text', () => {
      vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid-1' })
      usePomodoroStore.getState().addTask('Test task')
      const tasks = usePomodoroStore.getState().tasks
      expect(tasks).toHaveLength(1)
      expect(tasks[0]).toEqual({ id: 'test-uuid-1', text: 'Test task', completed: false })
    })

    it('should add multiple tasks', () => {
      let callCount = 0
      vi.stubGlobal('crypto', { randomUUID: () => `uuid-${++callCount}` })
      usePomodoroStore.getState().addTask('Task 1')
      usePomodoroStore.getState().addTask('Task 2')
      usePomodoroStore.getState().addTask('Task 3')
      expect(usePomodoroStore.getState().tasks).toHaveLength(3)
    })

    it('should add task with empty string', () => {
      vi.stubGlobal('crypto', { randomUUID: () => 'empty-uuid' })
      usePomodoroStore.getState().addTask('')
      const tasks = usePomodoroStore.getState().tasks
      expect(tasks).toHaveLength(1)
      expect(tasks[0].text).toBe('')
    })

    it('should add task with whitespace only', () => {
      vi.stubGlobal('crypto', { randomUUID: () => 'whitespace-uuid' })
      usePomodoroStore.getState().addTask('   ')
      expect(usePomodoroStore.getState().tasks[0].text).toBe('   ')
    })

    it('should add task with special characters', () => {
      vi.stubGlobal('crypto', { randomUUID: () => 'special-uuid' })
      usePomodoroStore.getState().addTask('<script>alert("xss")</script>')
      expect(usePomodoroStore.getState().tasks[0].text).toBe('<script>alert("xss")</script>')
    })

    it('should add task with unicode characters', () => {
      vi.stubGlobal('crypto', { randomUUID: () => 'unicode-uuid' })
      usePomodoroStore.getState().addTask('任务 🎯 タスク')
      expect(usePomodoroStore.getState().tasks[0].text).toBe('任务 🎯 タスク')
    })

    it('should add task with very long text', () => {
      vi.stubGlobal('crypto', { randomUUID: () => 'long-uuid' })
      const longText = 'a'.repeat(10000)
      usePomodoroStore.getState().addTask(longText)
      expect(usePomodoroStore.getState().tasks[0].text).toBe(longText)
    })

    it('should initialize new task as not completed', () => {
      vi.stubGlobal('crypto', { randomUUID: () => 'new-task-uuid' })
      usePomodoroStore.getState().addTask('New task')
      expect(usePomodoroStore.getState().tasks[0].completed).toBe(false)
    })
  })

  describe('Task CRUD - toggleTask (UPDATE)', () => {
    beforeEach(() => {
      vi.stubGlobal('crypto', { randomUUID: () => 'toggle-uuid' })
      usePomodoroStore.getState().addTask('Test task')
    })

    it('should toggle task from incomplete to complete', () => {
      usePomodoroStore.getState().toggleTask('toggle-uuid')
      expect(usePomodoroStore.getState().tasks[0].completed).toBe(true)
    })

    it('should toggle task from complete to incomplete', () => {
      usePomodoroStore.getState().toggleTask('toggle-uuid')
      usePomodoroStore.getState().toggleTask('toggle-uuid')
      expect(usePomodoroStore.getState().tasks[0].completed).toBe(false)
    })

    it('should not affect other tasks when toggling', () => {
      let callCount = 0
      vi.stubGlobal('crypto', { randomUUID: () => `multi-uuid-${++callCount}` })
      usePomodoroStore.setState({ ...initialState, tasks: [] })
      usePomodoroStore.getState().addTask('Task 1')
      usePomodoroStore.getState().addTask('Task 2')
      usePomodoroStore.getState().toggleTask('multi-uuid-1')
      expect(usePomodoroStore.getState().tasks[0].completed).toBe(true)
      expect(usePomodoroStore.getState().tasks[1].completed).toBe(false)
    })

    it('should handle toggling non-existent task ID gracefully', () => {
      const tasksBefore = [...usePomodoroStore.getState().tasks]
      usePomodoroStore.getState().toggleTask('non-existent-id')
      expect(usePomodoroStore.getState().tasks).toEqual(tasksBefore)
    })

    it('should handle toggling with empty string ID', () => {
      const tasksBefore = [...usePomodoroStore.getState().tasks]
      usePomodoroStore.getState().toggleTask('')
      expect(usePomodoroStore.getState().tasks).toEqual(tasksBefore)
    })
  })

  describe('Task CRUD - removeTask (DELETE)', () => {
    it('should remove a task by ID', () => {
      vi.stubGlobal('crypto', { randomUUID: () => 'remove-uuid' })
      usePomodoroStore.getState().addTask('Test task')
      expect(usePomodoroStore.getState().tasks).toHaveLength(1)
      usePomodoroStore.getState().removeTask('remove-uuid')
      expect(usePomodoroStore.getState().tasks).toHaveLength(0)
    })

    it('should only remove specified task', () => {
      let callCount = 0
      vi.stubGlobal('crypto', { randomUUID: () => `del-uuid-${++callCount}` })
      usePomodoroStore.getState().addTask('Task 1')
      usePomodoroStore.getState().addTask('Task 2')
      usePomodoroStore.getState().addTask('Task 3')
      usePomodoroStore.getState().removeTask('del-uuid-2')
      const tasks = usePomodoroStore.getState().tasks
      expect(tasks).toHaveLength(2)
      expect(tasks.map(t => t.text)).toEqual(['Task 1', 'Task 3'])
    })

    it('should handle removing non-existent task gracefully', () => {
      vi.stubGlobal('crypto', { randomUUID: () => 'existing-uuid' })
      usePomodoroStore.getState().addTask('Test task')
      usePomodoroStore.getState().removeTask('non-existent-id')
      expect(usePomodoroStore.getState().tasks).toHaveLength(1)
    })

    it('should handle removing from empty task list', () => {
      usePomodoroStore.getState().removeTask('any-id')
      expect(usePomodoroStore.getState().tasks).toHaveLength(0)
    })

    it('should handle removing same task twice', () => {
      vi.stubGlobal('crypto', { randomUUID: () => 'double-remove-uuid' })
      usePomodoroStore.getState().addTask('Test task')
      usePomodoroStore.getState().removeTask('double-remove-uuid')
      usePomodoroStore.getState().removeTask('double-remove-uuid')
      expect(usePomodoroStore.getState().tasks).toHaveLength(0)
    })

    it('should handle removing with empty string ID', () => {
      vi.stubGlobal('crypto', { randomUUID: () => 'valid-uuid' })
      usePomodoroStore.getState().addTask('Test task')
      usePomodoroStore.getState().removeTask('')
      expect(usePomodoroStore.getState().tasks).toHaveLength(1)
    })
  })

  // ==================== UI STATE SETTERS ====================
  describe('UI state setters', () => {
    it('setShowSettings should set to true', () => {
      usePomodoroStore.getState().setShowSettings(true)
      expect(usePomodoroStore.getState().showSettings).toBe(true)
    })

    it('setShowSettings should set to false', () => {
      usePomodoroStore.getState().setShowSettings(true)
      usePomodoroStore.getState().setShowSettings(false)
      expect(usePomodoroStore.getState().showSettings).toBe(false)
    })

    it('setShowToast should toggle toast visibility', () => {
      usePomodoroStore.getState().setShowToast(true)
      expect(usePomodoroStore.getState().showToast).toBe(true)
      usePomodoroStore.getState().setShowToast(false)
      expect(usePomodoroStore.getState().showToast).toBe(false)
    })

    it('setToastMessage should set message', () => {
      usePomodoroStore.getState().setToastMessage('Break time!')
      expect(usePomodoroStore.getState().toastMessage).toBe('Break time!')
    })

    it('setToastMessage should handle empty string', () => {
      usePomodoroStore.getState().setToastMessage('')
      expect(usePomodoroStore.getState().toastMessage).toBe('')
    })

    it('setToastMessage should handle special characters', () => {
      usePomodoroStore.getState().setToastMessage('<b>Bold</b> & "quotes"')
      expect(usePomodoroStore.getState().toastMessage).toBe('<b>Bold</b> & "quotes"')
    })

    it('setShowConfetti should toggle confetti', () => {
      usePomodoroStore.getState().setShowConfetti(true)
      expect(usePomodoroStore.getState().showConfetti).toBe(true)
      usePomodoroStore.getState().setShowConfetti(false)
      expect(usePomodoroStore.getState().showConfetti).toBe(false)
    })
  })

  // ==================== RESET TIMER ====================
  describe('resetTimer', () => {
    it('should reset timer to work duration when in work phase', () => {
      usePomodoroStore.getState().setTimeLeft(100)
      usePomodoroStore.getState().setIsRunning(true)
      usePomodoroStore.getState().resetTimer()
      expect(usePomodoroStore.getState().timeLeft).toBe(25 * 60)
      expect(usePomodoroStore.getState().isRunning).toBe(false)
    })

    it('should reset timer to short break duration when in shortBreak phase', () => {
      usePomodoroStore.getState().setPhase('shortBreak')
      usePomodoroStore.getState().setTimeLeft(100)
      usePomodoroStore.getState().resetTimer()
      expect(usePomodoroStore.getState().timeLeft).toBe(5 * 60)
    })

    it('should reset timer to long break duration when in longBreak phase', () => {
      usePomodoroStore.getState().setPhase('longBreak')
      usePomodoroStore.getState().setTimeLeft(100)
      usePomodoroStore.getState().resetTimer()
      expect(usePomodoroStore.getState().timeLeft).toBe(15 * 60)
    })

    it('should use custom settings when resetting', () => {
      usePomodoroStore.getState().setSettings({ workDuration: 50 })
      usePomodoroStore.getState().setTimeLeft(100)
      usePomodoroStore.getState().resetTimer()
      expect(usePomodoroStore.getState().timeLeft).toBe(50 * 60)
    })

    it('should stop running timer on reset', () => {
      usePomodoroStore.getState().setIsRunning(true)
      usePomodoroStore.getState().resetTimer()
      expect(usePomodoroStore.getState().isRunning).toBe(false)
    })

    it('should reset session count on reset', () => {
      usePomodoroStore.getState().incrementSession()
      usePomodoroStore.getState().incrementSession()
      usePomodoroStore.getState().resetTimer()
      expect(usePomodoroStore.getState().sessionCount).toBe(0)
    })

    it('should not affect tasks on reset', () => {
      vi.stubGlobal('crypto', { randomUUID: () => 'task-uuid' })
      usePomodoroStore.getState().addTask('Test task')
      usePomodoroStore.getState().resetTimer()
      expect(usePomodoroStore.getState().tasks).toHaveLength(1)
    })
  })

  // ==================== DATA INTEGRITY ====================
  describe('Data Integrity', () => {
    it('should maintain state isolation between operations', () => {
      vi.stubGlobal('crypto', { randomUUID: () => 'integrity-uuid' })
      usePomodoroStore.getState().setSettings({ workDuration: 30 })
      usePomodoroStore.getState().addTask('Task')
      usePomodoroStore.getState().setPhase('shortBreak')
      
      expect(usePomodoroStore.getState().settings.workDuration).toBe(30)
      expect(usePomodoroStore.getState().tasks).toHaveLength(1)
      expect(usePomodoroStore.getState().phase).toBe('shortBreak')
    })

    it('should not mutate original state object', () => {
      const originalSettings = { ...usePomodoroStore.getState().settings }
      usePomodoroStore.getState().setSettings({ workDuration: 99 })
      expect(originalSettings.workDuration).toBe(25)
    })
  })
})
