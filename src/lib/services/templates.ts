import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import {
  toProjectTemplate,
  type ProjectTemplate,
  type ProjectTemplateTask,
} from "@/lib/types";

type Client = SupabaseClient<Database>;

export type TemplateInput = {
  name: string;
  tasks: ProjectTemplateTask[];
};

export async function listTemplates(client: Client): Promise<ProjectTemplate[]> {
  const { data, error } = await client
    .from("project_templates")
    .select("*")
    .order("name");

  if (error) throw error;
  return (data ?? []).map(toProjectTemplate);
}

export async function getTemplate(
  client: Client,
  id: string
): Promise<ProjectTemplate | null> {
  const { data, error } = await client
    .from("project_templates")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? toProjectTemplate(data) : null;
}

export async function createTemplate(
  client: Client,
  input: TemplateInput
): Promise<ProjectTemplate> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Error("Niet ingelogd");

  const { data, error } = await client
    .from("project_templates")
    .insert({ name: input.name, tasks: input.tasks, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return toProjectTemplate(data);
}

export async function updateTemplate(
  client: Client,
  id: string,
  input: Partial<TemplateInput>
): Promise<ProjectTemplate> {
  const { data, error } = await client
    .from("project_templates")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return toProjectTemplate(data);
}

export async function deleteTemplate(client: Client, id: string): Promise<void> {
  const { error } = await client.from("project_templates").delete().eq("id", id);
  if (error) throw error;
}
