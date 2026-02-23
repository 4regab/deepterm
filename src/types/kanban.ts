export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type KanbanColumnId = string;

export interface KanbanTask {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  priority: TaskPriority;
  columnId: KanbanColumnId;
  tags: string[];
  linkedDeckId: string | null;
  createdAt: string;
  updatedAt: string;
  order: number;
}

export interface KanbanColumn {
  id: KanbanColumnId;
  title: string;
  order: number;
}

export const DEFAULT_COLUMNS: KanbanColumn[] = [
  { id: "backlog", title: "Backlog", order: 0 },
  { id: "in-progress", title: "In Progress", order: 1 },
  { id: "review", title: "Review", order: 2 },
  { id: "done", title: "Done", order: 3 },
];

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bgColor: string }> = {
  low: { label: "Low", color: "text-blue-700", bgColor: "bg-blue-100" },
  medium: { label: "Medium", color: "text-yellow-700", bgColor: "bg-yellow-100" },
  high: { label: "High", color: "text-orange-700", bgColor: "bg-orange-100" },
  urgent: { label: "Urgent", color: "text-red-700", bgColor: "bg-red-100" },
};
