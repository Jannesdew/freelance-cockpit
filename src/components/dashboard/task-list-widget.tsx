"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { UrgencyDot } from "@/components/tasks/urgency-badge";
import { DeadlineLabel } from "@/components/tasks/deadline-label";
import { QuickAddTask } from "@/components/tasks/quick-add-task";
import { TaskDetailSheet } from "@/components/tasks/task-detail-sheet";
import type { Task } from "@/lib/types";

export function TaskListWidget({
  title,
  tasks,
  projects,
  emptyMessage,
  quickAddProjectId,
}: {
  title: string;
  tasks: Task[];
  projects: { id: string; name: string }[];
  emptyMessage: string;
  quickAddProjectId?: string | "internal";
}) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {quickAddProjectId !== undefined && (
          <QuickAddTask projectId={quickAddProjectId} placeholder="Snel toevoegen..." />
        )}
        {tasks.length === 0 ? (
          <EmptyState title={emptyMessage} />
        ) : (
          <ul className="divide-y rounded-lg border">
            {tasks.map((task) => {
              const projectName = task.project_id
                ? projects.find((p) => p.id === task.project_id)?.name
                : undefined;
              return (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTaskId(task.id);
                      setIsSheetOpen(true);
                    }}
                    className="flex w-full items-center justify-between gap-4 px-3 py-2 text-left text-sm hover:bg-muted/50"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <UrgencyDot urgency={task.urgency} />
                      <span className="truncate">{task.title}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                      <span>{projectName ?? "Intern"}</span>
                      <DeadlineLabel deadline={task.deadline} status={task.status} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>

      <TaskDetailSheet
        task={selectedTask}
        projects={projects}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />
    </Card>
  );
}
