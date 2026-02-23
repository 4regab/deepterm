"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Search, Filter } from "lucide-react";
import { useKanbanStore } from "@/lib/stores";
import type { KanbanTask, KanbanPriority } from "@/lib/schemas/kanban";
import KanbanColumn from "./KanbanColumn";
import KanbanCard from "./KanbanCard";
import TaskModal, { type TaskFormData } from "./TaskModal";

type PriorityFilter = KanbanPriority | "all";

export default function KanbanBoard() {
  const {
    columns,
    tasks,
    loadFromStorage,
    createTask,
    updateTask,
    moveTask,
    deleteTask,
    reorderTasks,
  } = useKanbanStore();

  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [search, setSearch] = useState("");
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<KanbanTask | null>(null);
  const [modalColumnId, setModalColumnId] = useState("backlog");

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const sortedColumns = useMemo(
    () => [...columns].sort((a, b) => a.order - b.order),
    [columns]
  );

  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (priorityFilter !== "all") {
      result = result.filter((t) => t.priority === priorityFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }
    return result;
  }, [tasks, priorityFilter, search]);

  const tasksByColumn = useCallback(
    (columnId: string) => filteredTasks.filter((t) => t.columnId === columnId),
    [filteredTasks]
  );

  // --- Drag handlers ---

  function findColumnOfTask(taskId: string): string | undefined {
    return tasks.find((t) => t.id === taskId)?.columnId;
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeColumnId = findColumnOfTask(activeId);
    let overColumnId: string | undefined;

    if (overId.startsWith("column-")) {
      overColumnId = overId.replace("column-", "");
    } else {
      overColumnId = findColumnOfTask(overId);
    }

    if (!activeColumnId || !overColumnId || activeColumnId === overColumnId)
      return;

    moveTask(activeId, overColumnId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeColumnId = findColumnOfTask(activeId);

    let overColumnId: string | undefined;
    if (overId.startsWith("column-")) {
      overColumnId = overId.replace("column-", "");
    } else {
      overColumnId = findColumnOfTask(overId);
    }

    if (!activeColumnId) return;

    // Cross-column move was handled in dragOver; now handle same-column reorder
    if (activeColumnId === overColumnId && activeId !== overId) {
      const columnTasks = tasks.filter((t) => t.columnId === activeColumnId);
      const oldIndex = columnTasks.findIndex((t) => t.id === activeId);
      const newIndex = columnTasks.findIndex((t) => t.id === overId);
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(columnTasks, oldIndex, newIndex);
        reorderTasks(
          activeColumnId,
          reordered.map((t) => t.id)
        );
      }
    }
  };

  // --- Modal handlers ---

  const openCreateModal = (columnId: string) => {
    setEditingTask(null);
    setModalColumnId(columnId);
    setModalOpen(true);
  };

  const openEditModal = (task: KanbanTask) => {
    setEditingTask(task);
    setModalColumnId(task.columnId);
    setModalOpen(true);
  };

  const handleSave = (data: TaskFormData) => {
    if (editingTask) {
      updateTask(editingTask.id, {
        title: data.title,
        description: data.description || undefined,
        dueDate: data.dueDate || undefined,
        priority: data.priority,
        tags: data.tags,
        linkedDeckId: data.linkedDeckId || undefined,
        columnId: data.columnId,
      });
    } else {
      createTask({
        title: data.title,
        description: data.description || undefined,
        dueDate: data.dueDate || undefined,
        priority: data.priority,
        tags: data.tags,
        linkedDeckId: data.linkedDeckId || undefined,
        columnId: data.columnId,
      });
    }
    setModalOpen(false);
    setEditingTask(null);
  };

  const handleDelete = () => {
    if (editingTask) {
      deleteTask(editingTask.id);
      setModalOpen(false);
      setEditingTask(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#171d2b]/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks…"
            className="rounded-lg border border-[#171d2b]/10 bg-white pl-8 pr-3 py-2 text-sm text-[#171d2b] placeholder:text-[#171d2b]/30 focus:outline-none focus:ring-2 focus:ring-[#171d2b]/20 w-56"
          />
        </div>

        <div className="relative inline-flex items-center gap-1.5">
          <Filter className="h-4 w-4 text-[#171d2b]/40" />
          <select
            value={priorityFilter}
            onChange={(e) =>
              setPriorityFilter(e.target.value as PriorityFilter)
            }
            className="rounded-lg border border-[#171d2b]/10 bg-white px-3 py-2 text-sm text-[#171d2b] focus:outline-none focus:ring-2 focus:ring-[#171d2b]/20"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {sortedColumns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={tasksByColumn(column.id)}
              onAddTask={openCreateModal}
              onEditTask={openEditModal}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <KanbanCard task={activeTask} onEdit={() => {}} overlay />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Task modal */}
      <TaskModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSave}
        onDelete={editingTask ? handleDelete : undefined}
        task={editingTask}
        columnId={modalColumnId}
      />
    </div>
  );
}
