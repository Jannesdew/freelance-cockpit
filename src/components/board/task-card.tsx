"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { UrgencyDot } from "@/components/tasks/urgency-badge";
import { DeadlineLabel } from "@/components/tasks/deadline-label";
import type { Task } from "@/lib/types";

export function TaskCard({
  task,
  projectName,
  onClick,
}: {
  task: Task;
  projectName?: string;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, data: { status: task.status } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "cursor-grab rounded-lg border bg-card p-3 text-sm shadow-xs active:cursor-grabbing",
        isDragging && "opacity-40"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium leading-snug">{task.title}</span>
        <UrgencyDot urgency={task.urgency} />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{projectName ?? "Intern"}</span>
        <DeadlineLabel deadline={task.deadline} status={task.status} />
      </div>
    </div>
  );
}
