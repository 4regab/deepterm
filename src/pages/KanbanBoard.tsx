import React, { useState, useCallback, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import KanbanColumnComponent from "@/components/kanban/KanbanColumn";
import TaskCard from "@/components/kanban/TaskCard";
import TaskDialog from "@/components/kanban/TaskDialog";
import { KanbanTask, KanbanColumn, TaskPriority } from "@/types/kanban";
import {
  getColumns,
  getTasks,
  saveTasks,
  createTask,
  updateTask,
  deleteTask,
} from "@/services/kanbanService";
import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid } from "lucide-react";

const KanbanBoard: React.FC = () => {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<KanbanTask | null>(null);
  const [activeColumnId, setActiveColumnId] = useState("backlog");
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);

  useEffect(() => {
    setColumns(getColumns());
    setTasks(getTasks());
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const getTasksForColumn = useCallback(
    (columnId: string) =>
      tasks
        .filter((t) => t.columnId === columnId)
        .sort((a, b) => a.order - b.order),
    [tasks]
  );

  const handleAddTask = (columnId: string) => {
    setEditingTask(null);
    setActiveColumnId(columnId);
    setDialogOpen(true);
  };

  const handleEditTask = (task: KanbanTask) => {
    setEditingTask(task);
    setActiveColumnId(task.columnId);
    setDialogOpen(true);
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId);
    setTasks(getTasks());
  };

  const handleSaveTask = (data: {
    title: string;
    description: string;
    priority: TaskPriority;
    dueDate: string | null;
    tags: string[];
    columnId: string;
  }) => {
    if (editingTask) {
      updateTask(editingTask.id, data);
    } else {
      createTask(data);
    }
    setTasks(getTasks());
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const activeTaskItem = tasks.find((t) => t.id === activeId);
    if (!activeTaskItem) return;

    // Check if dropped over a column
    const overColumn = columns.find((c) => c.id === overId);
    const overTask = tasks.find((t) => t.id === overId);
    const targetColumnId = overColumn ? overColumn.id : overTask?.columnId;

    if (targetColumnId && activeTaskItem.columnId !== targetColumnId) {
      setTasks((prev) => {
        const updated = prev.map((t) =>
          t.id === activeId ? { ...t, columnId: targetColumnId } : t
        );
        return updated;
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) {
      saveTasks(tasks);
      return;
    }

    const activeTaskItem = tasks.find((t) => t.id === activeId);
    const overTask = tasks.find((t) => t.id === overId);

    if (activeTaskItem && overTask && activeTaskItem.columnId === overTask.columnId) {
      const columnTasks = getTasksForColumn(activeTaskItem.columnId);
      const oldIndex = columnTasks.findIndex((t) => t.id === activeId);
      const newIndex = columnTasks.findIndex((t) => t.id === overId);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(columnTasks, oldIndex, newIndex);
        const reorderedWithOrder = reordered.map((t, i) => ({ ...t, order: i }));
        setTasks((prev) => {
          const otherTasks = prev.filter((t) => t.columnId !== activeTaskItem.columnId);
          const newTasks = [...otherTasks, ...reorderedWithOrder];
          saveTasks(newTasks);
          return newTasks;
        });
        return;
      }
    }

    saveTasks(tasks);
  };

  return (
    <div className="min-h-screen bg-[#fff6e5] flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 relative inline-block">
            <LayoutGrid className="inline-block mr-2 h-8 w-8" />
            Kanban Board
            <div className="absolute -bottom-1 left-0 w-full h-2 bg-[#FF5C00] -z-10 transform -rotate-1"></div>
          </h1>
          <p className="text-gray-700 mt-3">
            Organize your tasks across columns with drag-and-drop
          </p>
        </div>

        <div className="flex items-center justify-end mb-4">
          <Button
            onClick={() => handleAddTask("backlog")}
            className="bg-neo-accent text-white hover:bg-neo-accent/90 neo-border shadow-neo-sm"
          >
            <Plus className="h-4 w-4 mr-2" /> New Task
          </Button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {columns
              .sort((a, b) => a.order - b.order)
              .map((col) => (
                <KanbanColumnComponent
                  key={col.id}
                  column={col}
                  tasks={getTasksForColumn(col.id)}
                  onAddTask={handleAddTask}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                />
              ))}
          </div>
          <DragOverlay>
            {activeTask ? (
              <div className="opacity-80">
                <TaskCard
                  task={activeTask}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
        columnId={activeColumnId}
        onSave={handleSaveTask}
      />

      <Footer />
    </div>
  );
};

export default KanbanBoard;
