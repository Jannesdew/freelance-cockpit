import { cn } from "@/lib/utils";
import { formatRelativeDeadline } from "@/lib/date";
import type { TaskStatus } from "@/lib/types";

export function DeadlineLabel({
  deadline,
  status,
  className,
}: {
  deadline: string | null;
  status?: TaskStatus;
  className?: string;
}) {
  if (!deadline) return null;
  const { label, isOverdue } = formatRelativeDeadline(deadline);
  const showOverdue = isOverdue && status !== "done";

  return (
    <span
      className={cn(showOverdue && "font-medium text-red-600 dark:text-red-400", className)}
    >
      {label}
    </span>
  );
}
