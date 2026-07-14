import { CheckCircle2, Lightbulb, PauseCircle, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PROJECT_STATUS_LABELS,
  TASK_STATUS_LABELS,
  type ProjectStatus,
  type TaskStatus,
} from "@/lib/types";

const PROJECT_STATUS_CLASSES: Record<ProjectStatus, string> = {
  concept: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  actief: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  on_hold: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  afgerond: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
};

const PROJECT_STATUS_ICONS: Record<ProjectStatus, typeof Lightbulb> = {
  concept: Lightbulb,
  actief: Rocket,
  on_hold: PauseCircle,
  afgerond: CheckCircle2,
};

const TASK_STATUS_CLASSES: Record<TaskStatus, string> = {
  backlog: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  todo: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  doing: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  feedback: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  done: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const Icon = PROJECT_STATUS_ICONS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        PROJECT_STATUS_CLASSES[status]
      )}
    >
      <Icon className="size-3" />
      {PROJECT_STATUS_LABELS[status]}
    </span>
  );
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        TASK_STATUS_CLASSES[status]
      )}
    >
      {TASK_STATUS_LABELS[status]}
    </span>
  );
}
