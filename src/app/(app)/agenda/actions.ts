"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { scheduleTask, unscheduleTask, getBusyBlocks } from "@/lib/services/calendar";
import { planTasks, type ScheduleProposal } from "@/lib/scheduling";
import { getArchivedProjectIds, listUnscheduledTasks } from "@/lib/services/tasks";
import { getUserSettings } from "@/lib/services/settings";
import type { Task } from "@/lib/types";

export type SchedulePreviewItem = { task: Task; start: string; end: string };

function revalidateAgendaViews() {
  revalidatePath("/agenda");
  revalidatePath("/board");
  revalidatePath("/list");
  revalidatePath("/");
}

export async function scheduleTaskAction(taskId: string, start: string, end: string) {
  const supabase = await createClient();
  const task = await scheduleTask(supabase, taskId, start, end);
  revalidateAgendaViews();
  return task;
}

export async function unscheduleTaskAction(taskId: string) {
  const supabase = await createClient();
  const task = await unscheduleTask(supabase, taskId);
  revalidateAgendaViews();
  return task;
}

export async function previewScheduleAction(
  range: { from: string; to: string }
): Promise<SchedulePreviewItem[]> {
  const supabase = await createClient();

  const [settings, unscheduledTasks, archivedProjectIds] = await Promise.all([
    getUserSettings(supabase),
    listUnscheduledTasks(supabase),
    getArchivedProjectIds(supabase),
  ]);

  if (!settings) {
    throw new Error("Stel eerst je werkuren in bij Instellingen.");
  }

  let busyBlocks: { start: string; end: string }[] = [];
  try {
    busyBlocks = await getBusyBlocks(supabase, range);
  } catch {
    // No Google-agenda gekoppeld — plan alleen rond taken die Cockpit al kent.
  }

  const tasks = unscheduledTasks.filter(
    (task) => !task.project_id || !archivedProjectIds.has(task.project_id)
  );

  const proposals = planTasks({
    tasks,
    busyBlocks,
    workingHours: {
      start: settings.working_hours_start,
      end: settings.working_hours_end,
      days: settings.working_days,
    },
    range,
  });

  const tasksById = new Map(tasks.map((t) => [t.id, t]));
  return proposals
    .map((p) => ({ task: tasksById.get(p.taskId)!, start: p.start, end: p.end }))
    .filter((item) => item.task);
}

export async function commitScheduleAction(
  proposals: ScheduleProposal[]
): Promise<Task[]> {
  const supabase = await createClient();
  const updated: Task[] = [];
  for (const proposal of proposals) {
    updated.push(await scheduleTask(supabase, proposal.taskId, proposal.start, proposal.end));
  }
  revalidateAgendaViews();
  return updated;
}
