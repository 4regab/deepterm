"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Trash2 } from "lucide-react";
import type { KanbanTask, KanbanPriority } from "@/lib/schemas/kanban";

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: TaskFormData) => void;
  onDelete?: () => void;
  task?: KanbanTask | null;
  columnId: string;
}

export interface TaskFormData {
  title: string;
  description: string;
  dueDate: string;
  priority: KanbanPriority;
  tags: string[];
  linkedDeckId: string;
  columnId: string;
}

const PRIORITIES: KanbanPriority[] = ["low", "medium", "high", "urgent"];

/**
 * Wrapper that remounts the form when the task or open state changes,
 * ensuring fresh initial state without calling setState in effects.
 */
export default function TaskModal(props: TaskModalProps) {
  if (!props.open) return null;
  const key = props.task?.id ?? "__new__";
  return <TaskModalInner key={key} {...props} />;
}

function TaskModalInner({
  onClose,
  onSave,
  onDelete,
  task,
  columnId,
}: Omit<TaskModalProps, "open">) {
  const isEdit = !!task;

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [dueDate, setDueDate] = useState(task?.dueDate ?? "");
  const [priority, setPriority] = useState<KanbanPriority>(task?.priority ?? "medium");
  const [tagsInput, setTagsInput] = useState(task?.tags.join(", ") ?? "");
  const [linkedDeckId, setLinkedDeckId] = useState(task?.linkedDeckId ?? "");

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    onSave({
      title: title.trim(),
      description: description.trim(),
      dueDate,
      priority,
      tags,
      linkedDeckId: linkedDeckId.trim(),
      columnId: task?.columnId ?? columnId,
    });
  };

  const labelClass = "block text-xs font-medium text-[#171d2b]/70 mb-1";
  const inputClass =
    "w-full rounded-lg border border-[#171d2b]/10 bg-white px-3 py-2 text-sm text-[#171d2b] placeholder:text-[#171d2b]/30 focus:outline-none focus:ring-2 focus:ring-[#171d2b]/20";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md mx-4 bg-[#f0f0ea] rounded-2xl border border-[#171d2b]/10 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="font-sans text-lg font-bold text-[#171d2b]">
            {isEdit ? "Edit Task" : "New Task"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 hover:bg-[#171d2b]/10 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-[#171d2b]/60" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-4">
          <div>
            <label htmlFor="task-title" className={labelClass}>
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              required
              className={inputClass}
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="task-desc" className={labelClass}>
              Description
            </label>
            <textarea
              id="task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description…"
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="task-due" className={labelClass}>
                Due Date
              </label>
              <input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="task-priority" className={labelClass}>
                Priority
              </label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as KanbanPriority)}
                className={inputClass}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="task-tags" className={labelClass}>
              Tags <span className="text-[#171d2b]/40 font-normal">(comma-separated)</span>
            </label>
            <input
              id="task-tags"
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. math, review, chapter-3"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="task-deck" className={labelClass}>
              Linked Deck ID
            </label>
            <input
              id="task-deck"
              type="text"
              value={linkedDeckId}
              onChange={(e) => setLinkedDeckId(e.target.value)}
              placeholder="Optional deck ID"
              className={inputClass}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            {isEdit && onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm font-medium text-[#171d2b]/70 hover:bg-[#171d2b]/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#171d2b] px-4 py-2 text-sm font-medium text-white hover:bg-[#171d2b]/90 transition-colors"
              >
                {isEdit ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
