import { Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { TASK_URGENCY_LABELS, type TaskUrgency } from "@/lib/types";

const URGENCY_TEXT_CLASSES: Record<TaskUrgency, string> = {
  low: "text-zinc-500 dark:text-zinc-400",
  normal: "text-blue-600 dark:text-blue-400",
  high: "text-amber-600 dark:text-amber-400",
  urgent: "text-red-600 dark:text-red-400",
};

export function UrgencyBadge({ urgency }: { urgency: TaskUrgency }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        URGENCY_TEXT_CLASSES[urgency]
      )}
    >
      <Flag className="size-3.5" fill="currentColor" strokeWidth={1.5} />
      {TASK_URGENCY_LABELS[urgency]}
    </span>
  );
}

export function UrgencyDot({ urgency }: { urgency: TaskUrgency }) {
  return (
    <Flag
      className={cn("size-3.5 shrink-0", URGENCY_TEXT_CLASSES[urgency])}
      fill="currentColor"
      strokeWidth={1.5}
    />
  );
}
