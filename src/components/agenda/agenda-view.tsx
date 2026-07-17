"use client";

import { useState, useTransition } from "react";
import { addMinutes } from "date-fns";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { WeekGrid } from "@/components/agenda/week-grid";
import { UnscheduledTaskItem } from "@/components/agenda/unscheduled-task-item";
import { PlanWeekButton } from "@/components/agenda/plan-week-button";
import { TaskDetailSheet } from "@/components/tasks/task-detail-sheet";
import { EmptyState } from "@/components/ui/empty-state";
import { scheduleTaskAction } from "@/app/(app)/agenda/actions";
import { ListChecks } from "lucide-react";
import type { Task } from "@/lib/types";
import type { BusyBlock } from "@/lib/google-calendar";

function dateISOToDate(dateISO: string, hour: number): Date {
  const [year, month, day] = dateISO.split("-").map(Number);
  return new Date(year, month - 1, day, hour, 0, 0, 0);
}

function taskDurationMinutes(task: Task): number {
  if (task.scheduled_start && task.scheduled_end) {
    return (
      (new Date(task.scheduled_end).getTime() - new Date(task.scheduled_start).getTime()) / 60000
    );
  }
  return task.estimated_minutes ?? 30;
}

export function AgendaView({
  weekDaysISO,
  initialScheduledTasks,
  initialUnscheduledTasks,
  busyBlocks,
  projects,
  range,
}: {
  weekDaysISO: string[];
  initialScheduledTasks: Task[];
  initialUnscheduledTasks: Task[];
  busyBlocks: BusyBlock[];
  projects: { id: string; name: string }[];
  range: { from: string; to: string };
}) {
  const [scheduledTasks, setScheduledTasks] = useState(initialScheduledTasks);
  const [unscheduledTasks, setUnscheduledTasks] = useState(initialUnscheduledTasks);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const weekDays = weekDaysISO.map((iso) => dateISOToDate(iso, 0));
  const allTasks = [...scheduledTasks, ...unscheduledTasks];
  const selectedTask = allTasks.find((t) => t.id === selectedTaskId) ?? null;

  function handleTaskClick(task: Task) {
    setSelectedTaskId(task.id);
    setIsSheetOpen(true);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const match = String(over.id).match(/^slot-(\d{4}-\d{2}-\d{2})-(\d+)$/);
    if (!match) return;
    const [, dateISO, hourStr] = match;

    const task =
      scheduledTasks.find((t) => t.id === active.id) ??
      unscheduledTasks.find((t) => t.id === active.id);
    if (!task) return;

    const start = dateISOToDate(dateISO, Number(hourStr));
    const end = addMinutes(start, taskDurationMinutes(task));

    const previousScheduled = scheduledTasks;
    const previousUnscheduled = unscheduledTasks;

    const updatedTask: Task = {
      ...task,
      scheduled_start: start.toISOString(),
      scheduled_end: end.toISOString(),
    };
    setUnscheduledTasks((current) => current.filter((t) => t.id !== task.id));
    setScheduledTasks((current) => [
      ...current.filter((t) => t.id !== task.id),
      updatedTask,
    ]);

    startTransition(async () => {
      try {
        await scheduleTaskAction(task.id, start.toISOString(), end.toISOString());
      } catch (error) {
        setScheduledTasks(previousScheduled);
        setUnscheduledTasks(previousUnscheduled);
        toast.error("Inplannen mislukt", {
          description: error instanceof Error ? error.message : undefined,
        });
      }
    });
  }

  return (
    <>
      <DndContext id="agenda" sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-4">
          <div className="min-w-0 flex-1">
            <WeekGrid
              weekDays={weekDays}
              scheduledTasks={scheduledTasks}
              busyBlocks={busyBlocks}
              onTaskClick={handleTaskClick}
            />
          </div>
          <div className="flex w-64 shrink-0 flex-col gap-3">
            <PlanWeekButton
              range={range}
              onPlanned={(scheduled) => {
                const scheduledIds = new Set(scheduled.map((t) => t.id));
                setUnscheduledTasks((current) =>
                  current.filter((t) => !scheduledIds.has(t.id))
                );
                setScheduledTasks((current) => [...current, ...scheduled]);
              }}
            />
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Niet ingepland</h3>
              <span className="text-xs text-muted-foreground">
                {unscheduledTasks.length}
              </span>
            </div>
            {unscheduledTasks.length === 0 ? (
              <EmptyState
                icon={ListChecks}
                title="Alles ingepland"
                description="Geen openstaande taken om in te plannen."
              />
            ) : (
              <div className="flex flex-col gap-2">
                {unscheduledTasks.map((task) => (
                  <UnscheduledTaskItem
                    key={task.id}
                    task={task}
                    onClick={() => handleTaskClick(task)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </DndContext>

      <TaskDetailSheet
        task={selectedTask}
        projects={projects}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />
    </>
  );
}
