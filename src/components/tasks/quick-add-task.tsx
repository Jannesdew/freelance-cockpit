"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { quickCreateTaskAction } from "@/app/(app)/tasks/actions";

export function QuickAddTask({
  projectId,
  placeholder = "Snel een taak toevoegen...",
}: {
  projectId?: string | "internal";
  placeholder?: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    startTransition(async () => {
      try {
        await quickCreateTaskAction(trimmed, projectId);
        setTitle("");
        router.refresh();
      } catch (error) {
        toast.error("Aanmaken mislukt", {
          description: error instanceof Error ? error.message : undefined,
        });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={placeholder}
        disabled={isPending}
        className="flex-1"
      />
      <Button type="submit" size="sm" disabled={isPending || !title.trim()}>
        <Plus />
        Toevoegen
      </Button>
    </form>
  );
}
