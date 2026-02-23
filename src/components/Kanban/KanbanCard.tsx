"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, GripVertical, Tag } from "lucide-react";
import type { KanbanTask, KanbanPriority } from "@/lib/schemas/kanban";

const PRIORITY_STYLES: Record<KanbanPriority, string> = {
  urgent: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-green-100 text-green-700",
};

interface KanbanCardProps {
  task: KanbanTask;
  onEdit: (task: KanbanTask) => void;
  overlay?: boolean;
}

export default function KanbanCard({ task, onEdit, overlay }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: "task", task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const formattedDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={overlay ? undefined : style}
      className={`group bg-white rounded-lg border border-[#171d2b]/10 p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
        overlay ? "shadow-lg rotate-2" : ""
      }`}
      onClick={() => onEdit(task)}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-0.5 cursor-grab opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity shrink-0"
          {...(overlay ? {} : { ...attributes, ...listeners })}
          onClick={(e) => e.stopPropagation()}
          aria-label="Drag handle"
        >
          <GripVertical className="h-4 w-4 text-[#171d2b]/40" />
        </button>

        <div className="flex-1 min-w-0">
          <h4 className="font-sans text-sm font-semibold text-[#171d2b] leading-snug">
            {task.title}
          </h4>

          {task.description && (
            <p className="mt-1 text-xs text-[#171d2b]/60 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${PRIORITY_STYLES[task.priority]}`}
            >
              {task.priority}
            </span>

            {formattedDate && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-[#171d2b]/50">
                <Calendar className="h-3 w-3" />
                {formattedDate}
              </span>
            )}

            {task.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 rounded-full bg-[#171d2b]/5 px-1.5 py-0.5 text-[10px] text-[#171d2b]/60"
              >
                <Tag className="h-2.5 w-2.5" />
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
