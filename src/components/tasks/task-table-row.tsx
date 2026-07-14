"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { UrgencyDot } from "@/components/tasks/urgency-badge";
import { TaskStatusIcon } from "@/components/projects/status-badge";
import { DeadlineLabel } from "@/components/tasks/deadline-label";
import { TaskDetailSheet } from "@/components/tasks/task-detail-sheet";
import { updateTaskAction } from "@/app/(app)/tasks/actions";
import type { TaskInput } from "@/lib/services/tasks";
import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  TASK_URGENCIES,
  TASK_URGENCY_LABELS,
  type Task,
  type TaskStatus,
  type TaskUrgency,
} from "@/lib/types";

export function TaskTableRow({
  task,
  projects,
  showProjectColumn = true,
}: {
  task: Task;
  projects: { id: string; name: string }[];
  showProjectColumn?: boolean;
}) {
  const router = useRouter();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const projectName = projects.find((p) => p.id === task.project_id)?.name;

  async function applyPatch(patch: Partial<TaskInput>, errorMessage: string) {
    setIsBusy(true);
    try {
      await updateTaskAction(task.id, patch);
      router.refresh();
    } catch (error) {
      toast.error(errorMessage, {
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
        {showProjectColumn && (
          <TableCell className="text-muted-foreground">
            {projectName ?? "Intern"}
          </TableCell>
        )}
        <TableCell>
          <Select
            value={task.status}
            onValueChange={(v) =>
              applyPatch({ status: v as TaskStatus }, "Status wijzigen mislukt")
            }
            disabled={isBusy}
          >
            <SelectTrigger size="sm">
              <SelectValue>
                {(value: TaskStatus) => (
                  <>
                    <TaskStatusIcon status={value} />
                    {TASK_STATUS_LABELS[value]}
                  </>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {TASK_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  <TaskStatusIcon status={s} />
                  {TASK_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell>
          <Select
            value={task.urgency}
            onValueChange={(v) =>
              applyPatch({ urgency: v as TaskUrgency }, "Urgentie wijzigen mislukt")
            }
            disabled={isBusy}
          >
            <SelectTrigger size="sm">
              <SelectValue>
                {(value: TaskUrgency) => (
                  <>
                    <UrgencyDot urgency={value} />
                    {TASK_URGENCY_LABELS[value]}
                  </>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {TASK_URGENCIES.map((u) => (
                <SelectItem key={u} value={u}>
                  <UrgencyDot urgency={u} />
                  {TASK_URGENCY_LABELS[u]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell>
          <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
            <PopoverTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isBusy}
                  className="h-7 px-2 font-normal"
                />
              }
            >
              {task.deadline ? (
                <DeadlineLabel deadline={task.deadline} status={task.status} />
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={task.deadline ? new Date(`${task.deadline}T00:00:00`) : undefined}
                onSelect={(date) => {
                  applyPatch(
                    { deadline: date ? format(date, "yyyy-MM-dd") : null },
                    "Deadline wijzigen mislukt"
                  );
                  setIsDateOpen(false);
                }}
              />
              {task.deadline && (
                <div className="border-t p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      applyPatch({ deadline: null }, "Deadline wijzigen mislukt");
                      setIsDateOpen(false);
                    }}
                  >
                    Deadline verwijderen
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
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
