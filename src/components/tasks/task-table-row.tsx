"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UrgencyBadge } from "@/components/tasks/urgency-badge";
import { TaskDetailSheet } from "@/components/tasks/task-detail-sheet";
import { updateTaskStatusAction } from "@/app/(app)/tasks/actions";
import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type Task,
  type TaskStatus,
} from "@/lib/types";

export function TaskTableRow({
  task,
  projects,
}: {
  task: Task;
  projects: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const projectName = projects.find((p) => p.id === task.project_id)?.name;
  const isOverdue =
    task.deadline &&
    task.status !== "done" &&
    task.deadline < new Date().toISOString().slice(0, 10);

  async function handleStatusChange(status: TaskStatus) {
    setIsBusy(true);
    try {
      await updateTaskStatusAction(task.id, status);
      router.refresh();
    } catch (error) {
      toast.error("Status wijzigen mislukt", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <>
      <TableRow>
        <TableCell
          className="max-w-64 cursor-pointer truncate font-medium hover:underline"
          onClick={() => setIsSheetOpen(true)}
        >
          {task.title}
        </TableCell>
        <TableCell className="text-muted-foreground">
          {projectName ?? "Intern"}
        </TableCell>
        <TableCell>
          <Select
            value={task.status}
            onValueChange={(v) => handleStatusChange(v as TaskStatus)}
            disabled={isBusy}
          >
            <SelectTrigger size="sm">
              <SelectValue>
                {(value: TaskStatus) => TASK_STATUS_LABELS[value]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {TASK_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {TASK_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell>
          <UrgencyBadge urgency={task.urgency} />
        </TableCell>
        <TableCell
          className={isOverdue ? "font-medium text-red-600 dark:text-red-400" : undefined}
        >
          {task.deadline ?? "—"}
        </TableCell>
      </TableRow>
      <TaskDetailSheet
        task={isSheetOpen ? task : null}
        projects={projects}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />
    </>
  );
}
