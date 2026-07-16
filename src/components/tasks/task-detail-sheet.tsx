"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UrgencyBadge } from "@/components/tasks/urgency-badge";
import { TaskStatusIcon } from "@/components/projects/status-badge";
import { DeadlineLabel } from "@/components/tasks/deadline-label";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { SubtaskChecklist } from "@/components/tasks/subtask-checklist";
import {
  deleteTaskAction,
  updateTaskStatusAction,
} from "@/app/(app)/tasks/actions";
import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type Task,
  type TaskStatus,
} from "@/lib/types";

export function TaskDetailSheet({
  task,
  projects,
  open,
  onOpenChange,
}: {
  task: Task | null;
  projects: { id: string; name: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  if (!task) return null;

  const projectName = projects.find((p) => p.id === task.project_id)?.name;

  async function handleStatusChange(status: TaskStatus) {
    if (!task) return;
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

  async function handleDelete() {
    if (!task) return;
    if (!window.confirm(`Taak "${task.title}" verwijderen?`)) return;
    setIsBusy(true);
    try {
      await deleteTaskAction(task.id);
      toast.success("Taak verwijderd");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error("Verwijderen mislukt", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{task.title}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4 px-4">
            <div className="flex flex-col gap-2">
              <span className="text-xs text-muted-foreground">Status</span>
              <Select
                value={task.status}
                onValueChange={(v) => handleStatusChange(v as TaskStatus)}
                disabled={isBusy}
              >
                <SelectTrigger className="w-full">
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
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Project</span>
              <span>{projectName ?? "Intern"}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Urgentie</span>
              <UrgencyBadge urgency={task.urgency} />
            </div>
            {task.deadline && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Deadline</span>
                <DeadlineLabel deadline={task.deadline} status={task.status} />
              </div>
            )}
            {task.description && (
              <div>
                <span className="text-xs text-muted-foreground">Omschrijving</span>
                <p className="mt-1 whitespace-pre-wrap text-sm">{task.description}</p>
              </div>
            )}

            <SubtaskChecklist taskId={task.id} />
          </div>
          <SheetFooter className="flex-row justify-end gap-2">
            <Button
              variant="destructive"
              size="sm"
              disabled={isBusy}
              onClick={handleDelete}
            >
              Verwijderen
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isBusy}
              onClick={() => setIsEditOpen(true)}
            >
              Bewerken
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <TaskFormDialog
        task={task}
        projects={projects}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
    </>
  );
}
