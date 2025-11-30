/**
 * Calendar utility functions for dashboard display
 * Requirements: 3.1, 3.2
 */

import type { ActivityDay } from '@/lib/schemas/activity';

export interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  minutesStudied: number;
  level: 0 | 1 | 2 | 3 | 4;
}

/**
 * Maps minutes studied to intensity level (0-4).
 * Level 0: 0 minutes
 * Level 1: 1-29 minutes
 * Level 2: 30-59 minutes
 * Level 3: 60-119 minutes
 * Level 4: 120+ minutes
 */
export function getStudyIntensityLevel(minutes: number): 0 | 1 | 2 | 3 | 4 {
  if (minutes <= 0) return 0;
  if (minutes < 30) return 1;
  if (minutes < 60) return 2;
  if (minutes < 120) return 3;
  return 4;
}

/**
 * Generates a 6x7 grid of CalendarDay objects for a given year/month.
 * Each row represents a week (Sun-Sat).
 * @param year - Full year (e.g., 2024)
 * @param month - Month (0-11, where 0 = January)
 * @param activityData - Array of activity data to map minutes to days
 * @returns 6x7 grid of CalendarDay objects
 */
export function generateMonthGrid(
  year: number,
  month: number,
  activityData: ActivityDay[] = []
): CalendarDay[][] {
  const today = new Date();
  const todayStr = formatDateString(today);
  
  // Create activity lookup map
  const activityMap = new Map<string, ActivityDay>();
  for (const activity of activityData) {
    activityMap.set(activity.activity_date, activity);
  }
  
  // First day of the target month
  const firstDayOfMonth = new Date(year, month, 1);
  // Day of week for first day (0 = Sunday)
  const startDayOfWeek = firstDayOfMonth.getDay();
  
  // Start from the Sunday of the week containing the first day
  const gridStartDate = new Date(year, month, 1 - startDayOfWeek);
  
  const grid: CalendarDay[][] = [];
  
  for (let week = 0; week < 6; week++) {
    const weekRow: CalendarDay[] = [];
    
    for (let day = 0; day < 7; day++) {
      const currentDate = new Date(gridStartDate);
      currentDate.setDate(gridStartDate.getDate() + (week * 7) + day);
      
      const dateStr = formatDateString(currentDate);
      const activity = activityMap.get(dateStr);
      const minutesStudied = activity?.minutes_studied ?? 0;
      
      weekRow.push({
        date: currentDate,
        dayOfMonth: currentDate.getDate(),
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: dateStr === todayStr,
        minutesStudied,
        level: getStudyIntensityLevel(minutesStudied),
      });
    }
    
    grid.push(weekRow);
  }
  
  return grid;
}

/**
 * Formats a date as YYYY-MM-DD string for comparison with activity data.
 */
function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
