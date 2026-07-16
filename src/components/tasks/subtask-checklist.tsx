"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  createSubtaskAction,
  deleteSubtaskAction,
  listSubtasksAction,
  updateSubtaskAction,
} from "@/app/(app)/tasks/actions";
import type { Subtask } from "@/lib/types";

export function SubtaskChecklist({ taskId }: { taskId: string }) {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    let cancelled = false;
    listSubtasksAction(taskId).then((data) => {
      if (!cancelled) {
        setSubtasks(data);
        setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    setNewTitle("");
    try {
      const created = await createSubtaskAction(taskId, title);
      setSubtasks((prev) => [...prev, created]);
    } catch (error) {
      toast.error("Subtaak toevoegen mislukt", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  async function handleToggle(subtask: Subtask) {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === subtask.id ? { ...s, is_done: !s.is_done } : s))
    );
    try {
      await updateSubtaskAction(subtask.id, { is_done: !subtask.is_done });
    } catch (error) {
      setSubtasks((prev) =>
        prev.map((s) => (s.id === subtask.id ? { ...s, is_done: subtask.is_done } : s))
      );
      toast.error("Bijwerken mislukt", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  async function handleDelete(id: string) {
    const previous = subtasks;
    setSubtasks((cur) => cur.filter((s) => s.id !== id));
    try {
      await deleteSubtaskAction(id);
    } catch (error) {
      setSubtasks(previous);
      toast.error("Verwijderen mislukt", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  const doneCount = subtasks.filter((s) => s.is_done).length;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Subtaken</span>
        {subtasks.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {doneCount}/{subtasks.length}
          </span>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Laden...</p>
      ) : (
        <div className="flex flex-col gap-1">
          {subtasks.map((subtask) => (
            <div key={subtask.id} className="group flex items-center gap-2">
              <Checkbox
                checked={subtask.is_done}
                onCheckedChange={() => handleToggle(subtask)}
              />
              <span
                className={cn(
                  "flex-1 text-sm",
                  subtask.is_done && "text-muted-foreground line-through"
                )}
              >
                {subtask.title}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 opacity-0 group-hover:opacity-100"
                onClick={() => handleDelete(subtask.id)}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleAdd} className="flex items-center gap-2">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Subtaak toevoegen..."
          className="h-8 text-sm"
        />
        <Button type="submit" size="icon" variant="ghost" className="size-8 shrink-0">
          <Plus className="size-4" />
        </Button>
      </form>
    </div>
  );
}
