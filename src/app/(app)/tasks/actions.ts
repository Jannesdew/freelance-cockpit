"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import * as tasksService from "@/lib/services/tasks";
import * as subtasksService from "@/lib/services/subtasks";
import type { TaskInput } from "@/lib/services/tasks";
import type { TaskStatus } from "@/lib/types";

function revalidateTaskViews() {
  revalidatePath("/board");
  revalidatePath("/list");
  revalidatePath("/");
  revalidatePath("/projects", "layout");
}

export async function createTaskAction(input: TaskInput) {
  if (!input.title.trim()) throw new Error("Titel is verplicht");

  const supabase = await createClient();
  const task = await tasksService.createTask(supabase, input);
  revalidateTaskViews();
  return task;
}

export async function quickCreateTaskAction(
  title: string,
  projectId?: string | "internal"
) {
  if (!title.trim()) throw new Error("Titel is verplicht");

  const supabase = await createClient();
  const task = await tasksService.quickCreateTask(supabase, { title, projectId });
  revalidateTaskViews();
  return task;
}

export async function updateTaskAction(id: string, patch: Partial<TaskInput>) {
  if (patch.title !== undefined && !patch.title.trim()) {
    throw new Error("Titel is verplicht");
  }

  const supabase = await createClient();
  const task = await tasksService.updateTask(supabase, id, patch);
  revalidateTaskViews();
  return task;
}

export async function updateTaskStatusAction(id: string, status: TaskStatus) {
  const supabase = await createClient();
  const task = await tasksService.updateTaskStatus(supabase, id, status);
  revalidateTaskViews();
  return task;
}

export async function reorderTasksAction(
  updates: { id: string; status: TaskStatus; position: number }[]
) {
  const supabase = await createClient();
  await tasksService.reorderTasks(supabase, updates);
  revalidateTaskViews();
}

export async function deleteTaskAction(id: string) {
  const supabase = await createClient();
  await tasksService.deleteTask(supabase, id);
  revalidateTaskViews();
}

export async function listSubtasksAction(taskId: string) {
  const supabase = await createClient();
  return subtasksService.listSubtasks(supabase, taskId);
}

export async function createSubtaskAction(taskId: string, title: string) {
  if (!title.trim()) throw new Error("Titel is verplicht");
  const supabase = await createClient();
  return subtasksService.createSubtask(supabase, taskId, title.trim());
}

export async function updateSubtaskAction(
  id: string,
  patch: { title?: string; is_done?: boolean }
) {
  if (patch.title !== undefined && !patch.title.trim()) {
    throw new Error("Titel is verplicht");
  }
  const supabase = await createClient();
  return subtasksService.updateSubtask(supabase, id, patch);
}

export async function deleteSubtaskAction(id: string) {
  const supabase = await createClient();
  await subtasksService.deleteSubtask(supabase, id);
}
