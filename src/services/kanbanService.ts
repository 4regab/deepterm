import { KanbanColumn, KanbanTask, DEFAULT_COLUMNS } from "@/types/kanban";

const TASKS_KEY = "deepterm-kanban-tasks";
const COLUMNS_KEY = "deepterm-kanban-columns";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export function getColumns(): KanbanColumn[] {
  try {
    const data = localStorage.getItem(COLUMNS_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error("Failed to load columns:", e);
  }
  return [...DEFAULT_COLUMNS];
}

export function saveColumns(columns: KanbanColumn[]): void {
  localStorage.setItem(COLUMNS_KEY, JSON.stringify(columns));
}

export function getTasks(): KanbanTask[] {
  try {
    const data = localStorage.getItem(TASKS_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error("Failed to load tasks:", e);
  }
  return [];
}

export function saveTasks(tasks: KanbanTask[]): void {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export function createTask(params: {
  title: string;
  description?: string;
  dueDate?: string | null;
  priority?: KanbanTask["priority"];
  columnId?: string;
  tags?: string[];
  linkedDeckId?: string | null;
}): KanbanTask {
  const tasks = getTasks();
  const columnTasks = tasks.filter((t) => t.columnId === (params.columnId || "backlog"));
  const now = new Date().toISOString();
  const task: KanbanTask = {
    id: generateId(),
    title: params.title,
    description: params.description || "",
    dueDate: params.dueDate || null,
    priority: params.priority || "medium",
    columnId: params.columnId || "backlog",
    tags: params.tags || [],
    linkedDeckId: params.linkedDeckId || null,
    createdAt: now,
    updatedAt: now,
    order: columnTasks.length,
  };
  tasks.push(task);
  saveTasks(tasks);
  return task;
}

export function updateTask(taskId: string, fields: Partial<Omit<KanbanTask, "id" | "createdAt">>): KanbanTask | null {
  const tasks = getTasks();
  const index = tasks.findIndex((t) => t.id === taskId);
  if (index === -1) return null;
  tasks[index] = { ...tasks[index], ...fields, updatedAt: new Date().toISOString() };
  saveTasks(tasks);
  return tasks[index];
}

export function moveTask(taskId: string, toColumnId: string, newOrder?: number): KanbanTask | null {
  const tasks = getTasks();
  const index = tasks.findIndex((t) => t.id === taskId);
  if (index === -1) return null;
  tasks[index].columnId = toColumnId;
  tasks[index].updatedAt = new Date().toISOString();
  if (newOrder !== undefined) tasks[index].order = newOrder;
  saveTasks(tasks);
  return tasks[index];
}

export function deleteTask(taskId: string): boolean {
  const tasks = getTasks();
  const filtered = tasks.filter((t) => t.id !== taskId);
  if (filtered.length === tasks.length) return false;
  saveTasks(filtered);
  return true;
}

export function listTasks(filter?: { priority?: string; columnId?: string; tag?: string }): KanbanTask[] {
  let tasks = getTasks();
  if (filter?.priority) tasks = tasks.filter((t) => t.priority === filter.priority);
  if (filter?.columnId) tasks = tasks.filter((t) => t.columnId === filter.columnId);
  if (filter?.tag) tasks = tasks.filter((t) => t.tags.includes(filter.tag!));
  return tasks.sort((a, b) => a.order - b.order);
}
