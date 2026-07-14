"use client";

import { useMemo, useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { KanbanColumn } from "@/components/board/kanban-column";
import { TaskCard } from "@/components/board/task-card";
import { TaskDetailSheet } from "@/components/tasks/task-detail-sheet";
import { reorderTasksAction } from "@/app/(app)/tasks/actions";
import { TASK_STATUSES, type Task, type TaskStatus } from "@/lib/types";

function columnIdToStatus(id: string): TaskStatus | null {
  if (!id.startsWith("column-")) return null;
  const status = id.slice("column-".length);
  return (TASK_STATUSES as string[]).includes(status) ? (status as TaskStatus) : null;
}

export function KanbanBoard({
  initialTasks,
  projects,
}: {
  initialTasks: Task[];
  projects: { id: string; name: string }[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [prevInitialTasks, setPrevInitialTasks] = useState(initialTasks);
  if (initialTasks !== prevInitialTasks) {
    setPrevInitialTasks(initialTasks);
    setTasks(initialTasks);
  }
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const projectNameById = useMemo(
    () => new Map(projects.map((p) => [p.id, p.name])),
    [projects]
  );

  const tasksByStatus = useMemo(() => {
    const map = new Map<TaskStatus, Task[]>(TASK_STATUSES.map((s) => [s, []]));
    for (const task of tasks) {
      map.get(task.status)?.push(task);
    }
    return map;
  }, [tasks]);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null;

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const draggedTask = tasks.find((t) => t.id === active.id);
    if (!draggedTask) return;

    const overStatus = columnIdToStatus(String(over.id));
    const overTask = overStatus ? null : tasks.find((t) => t.id === over.id);
    const destStatus = overStatus ?? overTask?.status ?? draggedTask.status;

    const previousTasks = tasks;

    // Rebuild per-column ordered lists from current state (immutably),
    // excluding the dragged task, then splice it into its destination.
    const byStatus = new Map<TaskStatus, Task[]>(TASK_STATUSES.map((s) => [s, []]));
    for (const t of tasks) {
      if (t.id === draggedTask.id) continue;
      byStatus.get(t.status)?.push(t);
    }

    const destList = byStatus.get(destStatus) ?? [];
    let destIndex = destList.length;
    if (overTask) {
      const idx = destList.findIndex((t) => t.id === overTask.id);
      if (idx !== -1) destIndex = idx;
    }
    destList.splice(destIndex, 0, draggedTask);

    const changed: { id: string; status: TaskStatus; position: number }[] = [];
    const updatedById = new Map<string, Task>();

    destList.forEach((t, index) => {
      updatedById.set(t.id, { ...t, status: destStatus, position: index });
      changed.push({ id: t.id, status: destStatus, position: index });
    });

    if (draggedTask.status !== destStatus) {
      const sourceList = byStatus.get(draggedTask.status) ?? [];
      sourceList.forEach((t, index) => {
        updatedById.set(t.id, { ...t, position: index });
        changed.push({ id: t.id, status: draggedTask.status, position: index });
      });
    }

    setTasks(tasks.map((t) => updatedById.get(t.id) ?? t));

    startTransition(async () => {
      try {
        await reorderTasksAction(changed);
      } catch (error) {
        setTasks(previousTasks);
        toast.error("Verplaatsen mislukt", {
          description: error instanceof Error ? error.message : undefined,
        });
      }
    });
  }

  return (
    <>
      <DndContext
        id="kanban-board"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-4">
          {TASK_STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={tasksByStatus.get(status) ?? []}
              projectNameById={projectNameById}
              onTaskClick={(task) => {
                setSelectedTaskId(task.id);
                setIsSheetOpen(true);
              }}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask && (
            <TaskCard
              task={activeTask}
              projectName={
                activeTask.project_id
                  ? projectNameById.get(activeTask.project_id)
                  : undefined
              }
              onClick={() => {}}
            />
          )}
        </DragOverlay>
      </DndContext>

      <TaskDetailSheet
        task={selectedTask}
        projects={projects}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />
    </>
  );
}
