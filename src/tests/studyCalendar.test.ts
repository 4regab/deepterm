import { describe, it, expect, beforeEach } from 'bun:test'
import { useActivityStore } from '../lib/stores/activityStore'
import { generateMonthGrid } from '../utils/calendar'
import type { ActivityDay } from '../lib/schemas/activity'

describe('StudyCalendar Component Logic', () => {
  beforeEach(() => {
    useActivityStore.setState({
      activity: [],
      stats: null,
      loading: false,
      error: null,
    })
  })

  describe('Calendar renders correct month', () => {
    it('should generate grid for current month with correct structure', () => {
      const grid = generateMonthGrid(2024, 0, [])

      expect(grid).toHaveLength(6)
      grid.forEach(week => {
        expect(week).toHaveLength(7)
      })
    })

    it('should mark days in target month as isCurrentMonth', () => {
      const grid = generateMonthGrid(2024, 0, [])

      const januaryDays = grid.flat().filter(day => day.isCurrentMonth)
      expect(januaryDays.length).toBe(31)
    })

    it('should include days from adjacent months to fill grid', () => {
      const grid = generateMonthGrid(2024, 0, [])

      const allDays = grid.flat()
      expect(allDays).toHaveLength(42)

      const nonCurrentMonthDays = allDays.filter(day => !day.isCurrentMonth)
      expect(nonCurrentMonthDays.length).toBeGreaterThan(0)
    })
  })

  describe('Navigation changes month', () => {
    it('should generate different grids for different months', () => {
      const januaryGrid = generateMonthGrid(2024, 0, [])
      const februaryGrid = generateMonthGrid(2024, 1, [])

      const febDays = februaryGrid.flat().filter(day => day.isCurrentMonth)
      expect(febDays.length).toBe(29)

      const janDays = januaryGrid.flat().filter(day => day.isCurrentMonth)
      expect(janDays.length).toBe(31)
    })

    it('should handle year transitions correctly', () => {
      const dec2023Grid = generateMonthGrid(2023, 11, [])
      const jan2024Grid = generateMonthGrid(2024, 0, [])

      const decDays = dec2023Grid.flat().filter(day =>
        day.isCurrentMonth && day.date.getFullYear() === 2023
      )
      expect(decDays.length).toBe(31)

      const janDays = jan2024Grid.flat().filter(day =>
        day.isCurrentMonth && day.date.getFullYear() === 2024
      )
      expect(janDays.length).toBe(31)
    })
  })

  describe('Current day highlighting', () => {
    it('should mark today as isToday', () => {
      const today = new Date()
      const grid = generateMonthGrid(today.getFullYear(), today.getMonth(), [])

      const todayCell = grid.flat().find(day => day.isToday)
      expect(todayCell).toBeDefined()
      expect(todayCell?.dayOfMonth).toBe(today.getDate())
    })

    it('should not mark any day as isToday for past months', () => {
      const today = new Date()
      let pastMonth = today.getMonth() - 2
      let pastYear = today.getFullYear()
      if (pastMonth < 0) {
        pastMonth += 12
        pastYear -= 1
      }

      const grid = generateMonthGrid(pastYear, pastMonth, [])
      const todayCell = grid.flat().find(day => day.isToday)

      expect(todayCell).toBeUndefined()
    })
  })

  describe('Activity intensity coloring', () => {
    it('should apply correct intensity levels from activity data', () => {
      const activityData: ActivityDay[] = [
        { activity_date: '2024-01-15', minutes_studied: 0, level: 0 },
        { activity_date: '2024-01-16', minutes_studied: 25, level: 1 },
        { activity_date: '2024-01-17', minutes_studied: 45, level: 2 },
        { activity_date: '2024-01-18', minutes_studied: 90, level: 3 },
        { activity_date: '2024-01-19', minutes_studied: 150, level: 4 },
      ]

      const grid = generateMonthGrid(2024, 0, activityData)
      const allDays = grid.flat()

      const day15 = allDays.find(d => d.dayOfMonth === 15 && d.isCurrentMonth)
      const day16 = allDays.find(d => d.dayOfMonth === 16 && d.isCurrentMonth)
      const day17 = allDays.find(d => d.dayOfMonth === 17 && d.isCurrentMonth)
      const day18 = allDays.find(d => d.dayOfMonth === 18 && d.isCurrentMonth)
      const day19 = allDays.find(d => d.dayOfMonth === 19 && d.isCurrentMonth)

      expect(day15?.level).toBe(0)
      expect(day16?.level).toBe(1)
      expect(day17?.level).toBe(2)
      expect(day18?.level).toBe(3)
      expect(day19?.level).toBe(4)
    })

    it('should default to level 0 for days without activity', () => {
      const grid = generateMonthGrid(2024, 0, [])
      const allDays = grid.flat()

      allDays.forEach(day => {
        expect(day.level).toBe(0)
        expect(day.minutesStudied).toBe(0)
      })
    })
  })

  describe('Loading state', () => {
    it('should indicate loading state correctly', () => {
      useActivityStore.setState({ loading: true })
      expect(useActivityStore.getState().loading).toBe(true)
    })

    it('should indicate not loading when data is ready', () => {
      useActivityStore.setState({ loading: false })
      expect(useActivityStore.getState().loading).toBe(false)
    })
  })
})
