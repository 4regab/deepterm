import { z } from 'zod'

export const KanbanPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent'])
export type KanbanPriority = z.infer<typeof KanbanPrioritySchema>

export const KanbanColumnSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Column title is required'),
  order: z.number().int().nonnegative(),
})
export type KanbanColumn = z.infer<typeof KanbanColumnSchema>

export const KanbanTaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  priority: KanbanPrioritySchema,
  columnId: z.string(),
  tags: z.array(z.string()),
  linkedDeckId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type KanbanTask = z.infer<typeof KanbanTaskSchema>

export const KanbanBoardSchema = z.object({
  columns: z.array(KanbanColumnSchema),
  tasks: z.array(KanbanTaskSchema),
})
export type KanbanBoard = z.infer<typeof KanbanBoardSchema>

export const DEFAULT_COLUMNS: KanbanColumn[] = [
  { id: 'backlog', title: 'Backlog', order: 0 },
  { id: 'in-progress', title: 'In Progress', order: 1 },
  { id: 'review', title: 'Review', order: 2 },
  { id: 'done', title: 'Done', order: 3 },
]
