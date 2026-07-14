"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { TaskCard } from "@/components/board/task-card";
import { TASK_STATUS_LABELS, type Task, type TaskStatus } from "@/lib/types";

export function KanbanColumn({
  status,
  tasks,
  projectNameById,
  onTaskClick,
}: {
  status: TaskStatus;
  tasks: Task[];
  projectNameById: Map<string, string>;
  onTaskClick: (task: Task) => void;
}) {
  const { setNodeRef } = useDroppable({ id: `column-${status}` });

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg bg-muted/40">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-sm font-medium">{TASK_STATUS_LABELS[status]}</span>
        <span className="text-xs text-muted-foreground">{tasks.length}</span>
      </div>
      <SortableContext
        id={`column-${status}`}
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div ref={setNodeRef} className="flex min-h-16 flex-col gap-2 p-2 pt-0">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              projectName={
                task.project_id ? projectNameById.get(task.project_id) : undefined
              }
              onClick={() => onTaskClick(task)}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
