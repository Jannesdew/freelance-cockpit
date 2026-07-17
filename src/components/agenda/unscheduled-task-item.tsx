"use client";

import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { UrgencyDot } from "@/components/tasks/urgency-badge";
import { DeadlineLabel } from "@/components/tasks/deadline-label";
import type { Task } from "@/lib/types";

export function UnscheduledTaskItem({
  task,
  onClick,
}: {
  task: Task;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "cursor-grab rounded-lg border bg-card p-2.5 text-sm shadow-xs active:cursor-grabbing",
        isDragging && "opacity-40"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium leading-snug">{task.title}</span>
        <UrgencyDot urgency={task.urgency} />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
        <span>{task.estimated_minutes ? `${task.estimated_minutes} min` : "30 min (default)"}</span>
        <DeadlineLabel deadline={task.deadline} status={task.status} />
      </div>
    </div>
  );
}
