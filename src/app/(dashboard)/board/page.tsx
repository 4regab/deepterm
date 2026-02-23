"use client";

import { KanbanBoard } from "@/components/Kanban";

export default function BoardPage() {
  return (
    <div className="w-full">
      <h1 className="font-serif text-2xl font-bold text-[#171d2b] mb-6">
        Task Board
      </h1>
      <KanbanBoard />
    </div>
  );
}
