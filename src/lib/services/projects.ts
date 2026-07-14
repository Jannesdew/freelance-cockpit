import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import {
  toProjectWithProgress,
  type Project,
  type ProjectStatus,
  type ProjectWithProgress,
} from "@/lib/types";

type Client = SupabaseClient<Database>;

export type ProjectInput = {
  name: string;
  client_name?: string | null;
  status?: ProjectStatus;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  cover_image_url?: string | null;
};

// `project_progress` is a grouped aggregate view with no FK back to `projects`,
// so PostgREST can't auto-embed it — fetch both and merge in JS instead.
async function fetchProgressByProjectId(
  client: Client,
  projectIds: string[]
): Promise<Map<string, { total_tasks: number; done_tasks: number; percent_done: number }>> {
  if (projectIds.length === 0) return new Map();

  const { data, error } = await client
    .from("project_progress")
    .select("project_id, total_tasks, done_tasks, percent_done")
    .in("project_id", projectIds);

  if (error) throw error;

  return new Map(
    (data ?? [])
      .filter((row): row is typeof row & { project_id: string } => row.project_id !== null)
      .map((row) => [
        row.project_id,
        {
          total_tasks: row.total_tasks ?? 0,
          done_tasks: row.done_tasks ?? 0,
          percent_done: row.percent_done ?? 0,
        },
      ])
  );
}

export async function listProjects(
  client: Client,
  { includeArchived = false }: { includeArchived?: boolean } = {}
): Promise<ProjectWithProgress[]> {
  let query = client
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (!includeArchived) {
    query = query.is("archived_at", null);
  }

  const { data, error } = await query;
  if (error) throw error;

  const projects = data ?? [];
  const progressByProjectId = await fetchProgressByProjectId(
    client,
    projects.map((p) => p.id)
  );

  return projects.map((project) =>
    toProjectWithProgress(project, progressByProjectId.get(project.id) && {
      project_id: project.id,
      ...progressByProjectId.get(project.id)!,
    })
  );
}

export async function getProject(
  client: Client,
  id: string
): Promise<ProjectWithProgress | null> {
  const { data: project, error } = await client
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!project) return null;

  const progressByProjectId = await fetchProgressByProjectId(client, [project.id]);
  const progress = progressByProjectId.get(project.id);

  return toProjectWithProgress(
    project,
    progress ? { project_id: project.id, ...progress } : undefined
  );
}

export async function createProject(
  client: Client,
  input: ProjectInput
): Promise<Project> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Error("Niet ingelogd");

  const { data, error } = await client
    .from("projects")
    .insert({ ...input, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return { ...data, status: data.status as ProjectStatus };
}

export async function updateProject(
  client: Client,
  id: string,
  patch: Partial<ProjectInput>
): Promise<Project> {
  const { data, error } = await client
    .from("projects")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return { ...data, status: data.status as ProjectStatus };
}

export async function archiveProject(client: Client, id: string): Promise<void> {
  const { error } = await client
    .from("projects")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function unarchiveProject(client: Client, id: string): Promise<void> {
  const { error } = await client
    .from("projects")
    .update({ archived_at: null })
    .eq("id", id);
  if (error) throw error;
}
