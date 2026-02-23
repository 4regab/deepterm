import { streamText, tool, stepCountIs } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { z } from 'zod'

const apiKey = process.env.GEMINI_API_KEY_1 || process.env.GOOGLE_GENERATIVE_AI_API_KEY || ''
const google = createGoogleGenerativeAI({ apiKey })

const SYSTEM_PROMPT = `You are DeepTerm Agent, an intelligent study coach and productivity assistant. You help users manage tasks, calendar events, study plans, and flashcard decks. Use the available tools to perform actions on behalf of the user. Always confirm before deleting items. Be concise and helpful.

Available task columns: backlog, in-progress, review, done.
Available priorities: low, medium, high, urgent.
Available event types: study_session, task_deadline, exam, pomodoro_block.
Available recurrence patterns: daily, weekly, monthly, none.
Available reminder types: study_reminder, task_deadline, streak_alert, weekly_digest.`

export async function POST(req: Request) {
  if (!apiKey) {
    return new Response('Missing GEMINI_API_KEY_1 or GOOGLE_GENERATIVE_AI_API_KEY', { status: 500 })
  }

  const { messages } = await req.json()

  const result = streamText({
    model: google('gemini-2.0-flash'),
    system: SYSTEM_PROMPT,
    messages,
    // Limit tool-call loops to 5 steps to prevent runaway execution
    stopWhen: stepCountIs(5),
    tools: {
      createTask: tool({
        description: 'Create a new kanban task',
        inputSchema: z.object({
          title: z.string().describe('Task title'),
          description: z.string().optional().describe('Task description'),
          dueDate: z.string().optional().describe('Due date in ISO format'),
          priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().describe('Task priority'),
          columnId: z.string().optional().describe('Column ID: backlog, in-progress, review, or done'),
        }),
        execute: async (params) => {
          return JSON.stringify({
            success: true,
            action: 'created_task',
            data: { ...params, columnId: params.columnId || 'backlog' },
          })
        },
      }),
      updateTask: tool({
        description: 'Update an existing kanban task',
        inputSchema: z.object({
          taskId: z.string().describe('ID of the task to update'),
          title: z.string().optional().describe('New task title'),
          description: z.string().optional().describe('New task description'),
          dueDate: z.string().optional().describe('New due date in ISO format'),
          priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().describe('New priority'),
        }),
        execute: async (params) => {
          return JSON.stringify({
            success: true,
            action: 'updated_task',
            data: params,
          })
        },
      }),
      moveTask: tool({
        description: 'Move a task to a different column',
        inputSchema: z.object({
          taskId: z.string().describe('ID of the task to move'),
          toColumnId: z.string().describe('Target column ID: backlog, in-progress, review, or done'),
        }),
        execute: async (params) => {
          return JSON.stringify({
            success: true,
            action: 'moved_task',
            data: params,
          })
        },
      }),
      deleteTask: tool({
        description: 'Delete a kanban task',
        inputSchema: z.object({
          taskId: z.string().describe('ID of the task to delete'),
        }),
        execute: async (params) => {
          return JSON.stringify({
            success: true,
            action: 'deleted_task',
            data: params,
          })
        },
      }),
      listTasks: tool({
        description: 'List kanban tasks with optional filters',
        inputSchema: z.object({
          priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().describe('Filter by priority'),
          columnId: z.string().optional().describe('Filter by column ID'),
        }),
        execute: async (params) => {
          return JSON.stringify({
            success: true,
            action: 'listed_tasks',
            data: params,
          })
        },
      }),
      createCalendarEvent: tool({
        description: 'Create a new calendar event',
        inputSchema: z.object({
          title: z.string().describe('Event title'),
          type: z.enum(['study_session', 'task_deadline', 'exam', 'pomodoro_block']).describe('Event type'),
          startDateTime: z.string().describe('Start date/time in ISO format'),
          endDateTime: z.string().describe('End date/time in ISO format'),
          allDay: z.boolean().optional().describe('Whether this is an all-day event'),
          recurrence: z.enum(['daily', 'weekly', 'monthly', 'none']).optional().describe('Recurrence pattern'),
        }),
        execute: async (params) => {
          return JSON.stringify({
            success: true,
            action: 'created_calendar_event',
            data: params,
          })
        },
      }),
      updateCalendarEvent: tool({
        description: 'Update an existing calendar event',
        inputSchema: z.object({
          eventId: z.string().describe('ID of the event to update'),
          title: z.string().optional().describe('New event title'),
          type: z.enum(['study_session', 'task_deadline', 'exam', 'pomodoro_block']).optional().describe('New event type'),
          startDateTime: z.string().optional().describe('New start date/time'),
          endDateTime: z.string().optional().describe('New end date/time'),
        }),
        execute: async (params) => {
          return JSON.stringify({
            success: true,
            action: 'updated_calendar_event',
            data: params,
          })
        },
      }),
      deleteCalendarEvent: tool({
        description: 'Delete a calendar event',
        inputSchema: z.object({
          eventId: z.string().describe('ID of the event to delete'),
        }),
        execute: async (params) => {
          return JSON.stringify({
            success: true,
            action: 'deleted_calendar_event',
            data: params,
          })
        },
      }),
      getEventsForRange: tool({
        description: 'Get calendar events within a date range',
        inputSchema: z.object({
          from: z.string().describe('Start of range in ISO format'),
          to: z.string().describe('End of range in ISO format'),
        }),
        execute: async (params) => {
          return JSON.stringify({
            success: true,
            action: 'fetched_events_range',
            data: params,
          })
        },
      }),
      scheduleReminder: tool({
        description: 'Schedule an email reminder',
        inputSchema: z.object({
          type: z.enum(['study_reminder', 'task_deadline', 'streak_alert', 'weekly_digest']).describe('Reminder type'),
          recipientEmail: z.string().describe('Recipient email address'),
          scheduledAt: z.string().describe('When to send the reminder in ISO format'),
          context: z.string().describe('JSON string with additional context'),
        }),
        execute: async (params) => {
          return JSON.stringify({
            success: true,
            action: 'scheduled_reminder',
            data: params,
          })
        },
      }),
      cancelReminder: tool({
        description: 'Cancel a scheduled reminder',
        inputSchema: z.object({
          reminderId: z.string().describe('ID of the reminder to cancel'),
        }),
        execute: async (params) => {
          return JSON.stringify({
            success: true,
            action: 'cancelled_reminder',
            data: params,
          })
        },
      }),
      generateStudyPlan: tool({
        description: 'Generate a study plan with specified parameters',
        inputSchema: z.object({
          durationDays: z.number().describe('Number of days for the study plan'),
          targetDeckIds: z.array(z.string()).describe('IDs of decks to study'),
          dailyHoursAvailable: z.number().describe('Hours available per day for studying'),
          examDate: z.string().optional().describe('Exam date in ISO format'),
        }),
        execute: async (params) => {
          return JSON.stringify({
            success: true,
            action: 'generated_study_plan',
            data: params,
          })
        },
      }),
    },
  })

  return result.toUIMessageStreamResponse()
}
