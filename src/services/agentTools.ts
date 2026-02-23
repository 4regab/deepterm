/**
 * DeepTerm Agent Tool Definitions
 *
 * These define the tools the agent can call for Kanban, Calendar, Email, and Study features.
 * In production, these would be wired into the Vercel AI SDK's `tools` parameter for `streamText`.
 * Currently they delegate to the localStorage-based service layer.
 */

import * as kanban from "./kanbanService";
import * as calendar from "./calendarService";
import { TaskPriority } from "@/types/kanban";
import { CalendarEventType } from "@/types/calendar";

// ─── Kanban Tools ────────────────────────────────────────────────────────────

export function toolCreateTask(params: {
  title: string;
  description?: string;
  dueDate?: string;
  priority?: TaskPriority;
  column?: string;
  linkedDeckId?: string;
}) {
  return kanban.createTask({
    title: params.title,
    description: params.description,
    dueDate: params.dueDate || null,
    priority: params.priority || "medium",
    columnId: params.column || "backlog",
    linkedDeckId: params.linkedDeckId || null,
  });
}

export function toolUpdateTask(params: { taskId: string; fields: Record<string, unknown> }) {
  return kanban.updateTask(params.taskId, params.fields);
}

export function toolMoveTask(params: { taskId: string; toColumn: string }) {
  return kanban.moveTask(params.taskId, params.toColumn);
}

export function toolDeleteTask(params: { taskId: string }) {
  return kanban.deleteTask(params.taskId);
}

export function toolListTasks(params?: { filter?: { priority?: string; column?: string; tag?: string } }) {
  return kanban.listTasks(params?.filter ? { priority: params.filter.priority, columnId: params.filter.column, tag: params.filter.tag } : undefined);
}

// ─── Calendar Tools ──────────────────────────────────────────────────────────

export function toolCreateCalendarEvent(params: {
  title: string;
  type: CalendarEventType;
  startDateTime: string;
  endDateTime: string;
  recurrence?: string;
}) {
  return calendar.createCalendarEvent({
    title: params.title,
    type: params.type,
    startDateTime: params.startDateTime,
    endDateTime: params.endDateTime,
    recurrence: params.recurrence || null,
  });
}

export function toolUpdateCalendarEvent(params: { eventId: string; fields: Record<string, unknown> }) {
  return calendar.updateCalendarEvent(params.eventId, params.fields);
}

export function toolDeleteCalendarEvent(params: { eventId: string }) {
  return calendar.deleteCalendarEvent(params.eventId);
}

export function toolGetEventsForRange(params: { from: string; to: string }) {
  return calendar.getEventsForRange(params.from, params.to);
}

// ─── Email / Reminder Tools (stubs for future Resend integration) ────────────

export function toolScheduleReminder(params: {
  type: string;
  recipientEmail: string;
  scheduledAt: string;
  context: Record<string, unknown>;
}) {
  // Stub: in production, this calls Resend's scheduledAt API
  console.log("[Agent] Schedule reminder:", params);
  return { success: true, reminderId: Date.now().toString(36), ...params };
}

export function toolCancelReminder(params: { reminderId: string }) {
  console.log("[Agent] Cancel reminder:", params.reminderId);
  return { success: true };
}

export function toolUpdateReminderPreferences(params: {
  userId: string;
  preferences: Record<string, unknown>;
}) {
  console.log("[Agent] Update reminder preferences:", params);
  return { success: true };
}

// ─── Study Tools (stubs for future AI integration) ───────────────────────────

export function toolCreateDeck(params: {
  title: string;
  subject: string;
  cards: { front: string; back: string }[];
}) {
  console.log("[Agent] Create deck:", params.title);
  return { success: true, deckId: Date.now().toString(36), ...params };
}

export function toolGenerateStudyPlan(params: {
  durationDays: number;
  targetDeckIds: string[];
  dailyHoursAvailable: number;
  examDate?: string;
}) {
  console.log("[Agent] Generate study plan:", params);
  return {
    success: true,
    planId: Date.now().toString(36),
    status: "draft",
    ...params,
  };
}
