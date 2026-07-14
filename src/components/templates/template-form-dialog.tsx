"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  createTemplateAction,
  updateTemplateAction,
} from "@/app/(app)/templates/actions";
import {
  TASK_URGENCIES,
  TASK_URGENCY_LABELS,
  type ProjectTemplate,
  type TaskUrgency,
} from "@/lib/types";

type DraftTask = { title: string; urgency: TaskUrgency };

export function TemplateFormDialog({
  template,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  template?: ProjectTemplate;
  trigger?: React.ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const isEditing = !!template;

  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  const [name, setName] = useState(template?.name ?? "");
  const [tasks, setTasks] = useState<DraftTask[]>(
    template?.tasks.map((t) => ({ title: t.title, urgency: t.urgency ?? "normal" })) ?? [
      { title: "", urgency: "normal" },
    ]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateTaskField(index: number, patch: Partial<DraftTask>) {
    setTasks((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }

  function addTaskRow() {
    setTasks((prev) => [...prev, { title: "", urgency: "normal" }]);
  }

  function removeTaskRow(index: number) {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);

    const input = {
      name,
      tasks: tasks
        .filter((t) => t.title.trim())
        .map((t) => ({ title: t.title.trim(), urgency: t.urgency })),
    };

    try {
      if (isEditing) {
        await updateTemplateAction(template.id, input);
        toast.success("Sjabloon bijgewerkt");
      } else {
        await createTemplateAction(input);
        toast.success("Sjabloon aangemaakt");
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Sjabloon bewerken" : "Nieuw sjabloon"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="template-name">Naam</Label>
            <Input
              id="template-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bijv. Nieuwe klant website"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Taken</Label>
            <div className="flex flex-col gap-2">
              {tasks.map((task, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={task.title}
                    onChange={(e) => updateTaskField(index, { title: e.target.value })}
                    placeholder="Taaktitel"
                    className="flex-1"
                  />
                  <Select
                    value={task.urgency}
                    onValueChange={(v) =>
                      updateTaskField(index, { urgency: v as TaskUrgency })
                    }
                  >
                    <SelectTrigger size="sm" className="w-32">
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeTaskRow(index)}
                    disabled={tasks.length === 1}
                  >
                    <X />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addTaskRow}
              className="self-start"
            >
              <Plus />
              Taak toevoegen
            </Button>
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
