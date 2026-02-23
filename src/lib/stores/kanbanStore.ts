import { create } from 'zustand'
import type { KanbanColumn, KanbanTask } from '../schemas/kanban'
import { DEFAULT_COLUMNS } from '../schemas/kanban'

const STORAGE_KEY = 'deepterm_kanban'

interface KanbanState {
  columns: KanbanColumn[]
  tasks: KanbanTask[]
  loading: boolean
}

interface KanbanFilter {
  priority?: KanbanTask['priority']
  columnId?: string
  tag?: string
}

interface KanbanActions {
  createTask: (task: Partial<Omit<KanbanTask, 'id' | 'createdAt' | 'updatedAt'>> & Pick<KanbanTask, 'title' | 'columnId'>) => void
  updateTask: (taskId: string, fields: Partial<Omit<KanbanTask, 'id' | 'createdAt'>>) => void
  moveTask: (taskId: string, toColumnId: string) => void
  deleteTask: (taskId: string) => void
  listTasks: (filter?: KanbanFilter) => KanbanTask[]
  addColumn: (title: string) => void
  updateColumn: (columnId: string, title: string) => void
  deleteColumn: (columnId: string) => void
  reorderColumns: (orderedIds: string[]) => void
  reorderTasks: (columnId: string, orderedTaskIds: string[]) => void
  loadFromStorage: () => void
  saveToStorage: () => void
}

type KanbanStore = KanbanState & KanbanActions

function generateId(): string {
  return crypto.randomUUID()
}

function nowISO(): string {
  return new Date().toISOString()
}

export const useKanbanStore = create<KanbanStore>()((set, get) => ({
  columns: [...DEFAULT_COLUMNS],
  tasks: [],
  loading: false,

  createTask: (task) => {
    const now = nowISO()
    const newTask: KanbanTask = {
      id: generateId(),
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      priority: task.priority ?? 'medium',
      columnId: task.columnId,
      tags: task.tags ?? [],
      linkedDeckId: task.linkedDeckId,
      createdAt: now,
      updatedAt: now,
    }
    set((state) => ({ tasks: [...state.tasks, newTask] }))
    get().saveToStorage()
  },

  updateTask: (taskId, fields) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, ...fields, updatedAt: nowISO() } : t
      ),
    }))
    get().saveToStorage()
  },

  moveTask: (taskId, toColumnId) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, columnId: toColumnId, updatedAt: nowISO() } : t
      ),
    }))
    get().saveToStorage()
  },

  deleteTask: (taskId) => {
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== taskId) }))
    get().saveToStorage()
  },

  listTasks: (filter) => {
    const { tasks } = get()
    if (!filter) return tasks
    return tasks.filter((t) => {
      if (filter.priority && t.priority !== filter.priority) return false
      if (filter.columnId && t.columnId !== filter.columnId) return false
      if (filter.tag && !t.tags.includes(filter.tag)) return false
      return true
    })
  },

  addColumn: (title) => {
    const { columns } = get()
    const maxOrder = columns.reduce((max, c) => Math.max(max, c.order), -1)
    const newColumn: KanbanColumn = {
      id: generateId(),
      title,
      order: maxOrder + 1,
    }
    set((state) => ({ columns: [...state.columns, newColumn] }))
    get().saveToStorage()
  },

  updateColumn: (columnId, title) => {
    set((state) => ({
      columns: state.columns.map((c) =>
        c.id === columnId ? { ...c, title } : c
      ),
    }))
    get().saveToStorage()
  },

  deleteColumn: (columnId) => {
    set((state) => ({
      columns: state.columns.filter((c) => c.id !== columnId),
      tasks: state.tasks.filter((t) => t.columnId !== columnId),
    }))
    get().saveToStorage()
  },

  reorderColumns: (orderedIds) => {
    set((state) => ({
      columns: orderedIds
        .map((id, index) => {
          const col = state.columns.find((c) => c.id === id)
          return col ? { ...col, order: index } : null
        })
        .filter((c): c is KanbanColumn => c !== null),
    }))
    get().saveToStorage()
  },

  reorderTasks: (columnId, orderedTaskIds) => {
    set((state) => {
      const otherTasks = state.tasks.filter((t) => t.columnId !== columnId)
      const reordered = orderedTaskIds
        .map((id) => state.tasks.find((t) => t.id === id && t.columnId === columnId))
        .filter((t): t is KanbanTask => t !== null && t !== undefined)
      return { tasks: [...otherTasks, ...reordered] }
    })
    get().saveToStorage()
  },

  loadFromStorage: () => {
    set({ loading: true })
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const data = JSON.parse(raw)
        set({
          columns: data.columns ?? [...DEFAULT_COLUMNS],
          tasks: data.tasks ?? [],
        })
      }
    } catch {
      // If storage is corrupted, keep defaults
    }
    set({ loading: false })
  },

  saveToStorage: () => {
    const { columns, tasks } = get()
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ columns, tasks }))
    } catch {
      // localStorage may be unavailable in SSR or full in some environments
    }
  },
}))
