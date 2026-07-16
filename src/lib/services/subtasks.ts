import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { Subtask } from "@/lib/types";

type Client = SupabaseClient<Database>;

export async function listSubtasks(client: Client, taskId: string): Promise<Subtask[]> {
  const { data, error } = await client
    .from("subtasks")
    .select("*")
    .eq("task_id", taskId)
    .order("position");

  if (error) throw error;
  return data ?? [];
}

export async function createSubtask(
  client: Client,
  taskId: string,
  title: string
): Promise<Subtask> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Error("Niet ingelogd");

  const { count, error: countError } = await client
    .from("subtasks")
    .select("id", { count: "exact", head: true })
    .eq("task_id", taskId);
  if (countError) throw countError;

  const { data, error } = await client
    .from("subtasks")
    .insert({ task_id: taskId, title, user_id: user.id, position: count ?? 0 })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSubtask(
  client: Client,
  id: string,
  patch: Partial<Pick<Subtask, "title" | "is_done">>
): Promise<Subtask> {
  const { data, error } = await client
    .from("subtasks")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSubtask(client: Client, id: string): Promise<void> {
  const { error } = await client.from("subtasks").delete().eq("id", id);
  if (error) throw error;
}
