"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UrgencyDot } from "@/components/tasks/urgency-badge";
import { TaskStatusIcon } from "@/components/projects/status-badge";
import {
  createTaskAction,
  updateTaskAction,
} from "@/app/(app)/tasks/actions";
import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  TASK_URGENCIES,
  TASK_URGENCY_LABELS,
  type Task,
  type TaskStatus,
  type TaskUrgency,
} from "@/lib/types";

const INTERNAL_VALUE = "internal";

export function TaskFormDialog({
  task,
  projects,
  defaultProjectId,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  task?: Task;
  projects: { id: string; name: string }[];
  defaultProjectId?: string;
  trigger?: React.ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const isEditing = !!task;

  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [projectId, setProjectId] = useState(
    task?.project_id ?? defaultProjectId ?? INTERNAL_VALUE
  );
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "backlog");
  const [urgency, setUrgency] = useState<TaskUrgency>(task?.urgency ?? "normal");
  const [deadline, setDeadline] = useState(task?.deadline ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);

    const input = {
      title,
      description: description || null,
      project_id: projectId === INTERNAL_VALUE ? null : projectId,
      status,
      urgency,
      deadline: deadline || null,
    };

    try {
      if (isEditing) {
        await updateTaskAction(task.id, input);
        toast.success("Taak bijgewerkt");
      } else {
        await createTaskAction(input);
        toast.success("Taak aangemaakt");
      }
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(isEditing ? "Bijwerken mislukt" : "Aanmaken mislukt", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Taak bewerken" : "Nieuwe taak"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Titel</Label>
            <Input
              id="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="project">Project</Label>
            <Select
              value={projectId}
              onValueChange={(v) => setProjectId(v ?? INTERNAL_VALUE)}
            >
              <SelectTrigger id="project" className="w-full">
                <SelectValue>
                  {(value: string) =>
                    value === INTERNAL_VALUE
                      ? "Intern (geen project)"
                      : projects.find((p) => p.id === value)?.name
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={INTERNAL_VALUE}>Intern (geen project)</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger id="status" className="w-full">
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
            <div className="flex flex-col gap-2">
              <Label htmlFor="urgency">Urgentie</Label>
              <Select
                value={urgency}
                onValueChange={(v) => setUrgency(v as TaskUrgency)}
              >
                <SelectTrigger id="urgency" className="w-full">
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
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              id="deadline"
              type="date"
              value={deadline ?? ""}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Omschrijving</Label>
            <Textarea
              id="description"
              value={description ?? ""}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Bezig..." : isEditing ? "Opslaan" : "Aanmaken"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
