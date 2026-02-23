"use client";

import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import type { KanbanColumn as ColumnType, KanbanTask } from "@/lib/schemas/kanban";
import KanbanCard from "./KanbanCard";

interface KanbanColumnProps {
  column: ColumnType;
  tasks: KanbanTask[];
  onAddTask: (columnId: string) => void;
  onEditTask: (task: KanbanTask) => void;
}

export default function KanbanColumn({
  column,
  tasks,
  onAddTask,
  onEditTask,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${column.id}`,
    data: { type: "column", columnId: column.id },
  });

  const taskIds = tasks.map((t) => t.id);

  return (
    <div
      className={`flex flex-col bg-[#f5f0e0]/50 rounded-xl border border-[#171d2b]/10 w-72 shrink-0 transition-colors ${
        isOver ? "bg-[#f5f0e0]/80 border-[#171d2b]/20" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <h3 className="font-sans text-sm font-bold text-[#171d2b]">
            {column.title}
          </h3>
          <span className="inline-flex items-center justify-center rounded-full bg-[#171d2b]/10 px-1.5 text-[11px] font-medium text-[#171d2b]/60 min-w-[20px]">
            {tasks.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onAddTask(column.id)}
          className="rounded-md p-1 hover:bg-[#171d2b]/10 transition-colors"
          aria-label={`Add task to ${column.title}`}
        >
          <Plus className="h-4 w-4 text-[#171d2b]/60" />
        </button>
      </div>

      {/* Task list */}
      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto px-2 pb-2 min-h-[120px] space-y-2"
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} onEdit={onEditTask} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
