"use client";

import { useState } from "react";
import { ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { TaskStatusBadge } from "@/components/projects/status-badge";
import { UrgencyDot } from "@/components/tasks/urgency-badge";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { TaskDetailSheet } from "@/components/tasks/task-detail-sheet";
import type { Task } from "@/lib/types";

export function TaskListSection({
  tasks,
  projects,
  defaultProjectId,
}: {
  tasks: Task[];
  projects: { id: string; name: string }[];
  defaultProjectId?: string;
}) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null;

  function openTask(task: Task) {
    setSelectedTaskId(task.id);
    setIsSheetOpen(true);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Taken</h2>
        <TaskFormDialog
          projects={projects}
          defaultProjectId={defaultProjectId}
          trigger={<Button size="sm">Nieuwe taak</Button>}
        />
      </div>

      <div className="mt-3">
        {tasks.length === 0 ? (
          <EmptyState
            icon={ListTodo}
            title="Nog geen taken"
            description="Taken voor dit project komen hier zodra ze zijn aangemaakt."
          />
        ) : (
          <ul className="divide-y rounded-lg border">
            {tasks.map((task) => (
              <li key={task.id}>
                <button
                  type="button"
                  onClick={() => openTask(task)}
                  className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-muted/50"
                >
                  <span className="flex items-center gap-2 text-sm">
                    <UrgencyDot urgency={task.urgency} />
                    {task.title}
                  </span>
                  <TaskStatusBadge status={task.status} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <TaskDetailSheet
        task={selectedTask}
        projects={projects}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />
    </div>
  );
}
