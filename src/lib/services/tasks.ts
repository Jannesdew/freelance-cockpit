import type { SupabaseClient } from "@supabase/supabase-js";
import { format, isBefore, startOfWeek, subWeeks } from "date-fns";
import type { Database } from "@/lib/database.types";
import {
  toTask,
  TASK_STATUSES,
  type Task,
  type TaskStatus,
  type TaskUrgency,
} from "@/lib/types";

type Client = SupabaseClient<Database>;

export type TaskInput = {
  title: string;
  description?: string | null;
  project_id?: string | null;
  status?: TaskStatus;
  urgency?: TaskUrgency;
  deadline?: string | null;
  position?: number;
  estimated_minutes?: number | null;
};

export type TaskFilters = {
  projectId?: string | "internal";
  status?: TaskStatus;
  urgency?: TaskUrgency;
  deadlineFrom?: string;
  deadlineTo?: string;
  search?: string;
  sort?: "title" | "deadline" | "urgency" | "status" | "created_at";
  sortDir?: "asc" | "desc";
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyFilters(query: any, filters: TaskFilters) {
  if (filters.projectId === "internal") {
    query = query.is("project_id", null);
  } else if (filters.projectId) {
    query = query.eq("project_id", filters.projectId);
  }
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.urgency) query = query.eq("urgency", filters.urgency);
  if (filters.deadlineFrom) query = query.gte("deadline", filters.deadlineFrom);
  if (filters.deadlineTo) query = query.lte("deadline", filters.deadlineTo);
  if (filters.search) query = query.ilike("title", `%${filters.search}%`);
  return query;
}

export async function listTasks(
  client: Client,
  filters: TaskFilters = {}
): Promise<Task[]> {
  let query = client.from("tasks").select("*");
  query = applyFilters(query, filters);

  const sortColumn = filters.sort ?? "status";

  // "status" isn't a plain text column PostgREST can order alphabetically
  // into a meaningful sequence (backlog < done alphabetically already, but
  // doing/feedback/todo would land in the wrong spots) — sort it in JS
  // against the fixed pipeline order instead, keeping a stable created_at
  // tie-breaker for tasks that share a status.
  if (sortColumn === "status") {
    const ascending = filters.sortDir !== "desc";
    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    const tasks = (data ?? []).map(toTask);
    tasks.sort((a, b) => {
      const diff = TASK_STATUSES.indexOf(a.status) - TASK_STATUSES.indexOf(b.status);
      return ascending ? diff : -diff;
    });
    return tasks;
  }

  const ascending = filters.sortDir === "asc";
  query = query.order(sortColumn, { ascending, nullsFirst: false });

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(toTask);
}

export async function listTasksForBoard(
  client: Client,
  filters: Omit<TaskFilters, "sort" | "sortDir" | "status"> = {}
): Promise<Task[]> {
  let query = client.from("tasks").select("*");
  query = applyFilters(query, filters);
  query = query.order("status").order("position");

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(toTask);
}

// Tasks don't carry their own archived state — it's inherited from their
// (optional) project. Dashboard widgets should hide tasks belonging to an
// archived project, so filter those out in JS after fetching rather than
// risk composing a fragile multi-condition PostgREST query string.
export async function getArchivedProjectIds(client: Client): Promise<Set<string>> {
  const { data, error } = await client
    .from("projects")
    .select("id")
    .not("archived_at", "is", null);
  if (error) throw error;
  return new Set((data ?? []).map((p) => p.id));
}

export async function getDashboardUrgentTasks(client: Client): Promise<Task[]> {
  const today = new Date();
  const inSevenDays = new Date(today);
  inSevenDays.setDate(inSevenDays.getDate() + 7);
  const deadlineCutoff = inSevenDays.toISOString().slice(0, 10);

  const [{ data, error }, archivedProjectIds] = await Promise.all([
    client
      .from("tasks")
      .select("*")
      .neq("status", "done")
      .or(`deadline.lte.${deadlineCutoff},urgency.in.(high,urgent)`)
      .order("deadline", { ascending: true, nullsFirst: false }),
    getArchivedProjectIds(client),
  ]);

  if (error) throw error;
  return (data ?? [])
    .filter((row) => !row.project_id || !archivedProjectIds.has(row.project_id))
    .map(toTask);
}

export async function getTaskStatusCounts(
  client: Client
): Promise<Record<TaskStatus, number>> {
  const [{ data, error }, archivedProjectIds] = await Promise.all([
    client.from("tasks").select("status, project_id"),
    getArchivedProjectIds(client),
  ]);
  if (error) throw error;

  const counts: Record<TaskStatus, number> = {
    backlog: 0,
    todo: 0,
    doing: 0,
    feedback: 0,
    done: 0,
  };
  for (const row of data ?? []) {
    if (row.project_id && archivedProjectIds.has(row.project_id)) continue;
    counts[row.status as TaskStatus] += 1;
  }
  return counts;
}

export type WeeklyCompletedCount = { weekStart: string; label: string; count: number };

export async function getWeeklyCompletedTasks(
  client: Client,
  weeks = 8
): Promise<WeeklyCompletedCount[]> {
  const now = new Date();
  const earliestWeekStart = startOfWeek(subWeeks(now, weeks - 1), { weekStartsOn: 1 });

  const [{ data, error }, archivedProjectIds] = await Promise.all([
    client
      .from("tasks")
      .select("completed_at, project_id")
      .not("completed_at", "is", null)
      .gte("completed_at", earliestWeekStart.toISOString()),
    getArchivedProjectIds(client),
  ]);
  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    if (!row.completed_at) continue;
    if (row.project_id && archivedProjectIds.has(row.project_id)) continue;
    const weekStart = startOfWeek(new Date(row.completed_at), { weekStartsOn: 1 });
    const key = format(weekStart, "yyyy-MM-dd");
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const result: WeeklyCompletedCount[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
    if (isBefore(now, weekStart)) continue;
    const key = format(weekStart, "yyyy-MM-dd");
    result.push({
      weekStart: key,
      label: format(weekStart, "d MMM"),
      count: counts.get(key) ?? 0,
    });
  }
  return result;
}

export async function getInternalTasks(client: Client): Promise<Task[]> {
  const { data, error } = await client
    .from("tasks")
    .select("*")
    .is("project_id", null)
    .order("position");

  if (error) throw error;
  return (data ?? []).map(toTask);
}

export async function createTask(client: Client, input: TaskInput): Promise<Task> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Error("Niet ingelogd");

  const { data, error } = await client
    .from("tasks")
    .insert({ ...input, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return toTask(data);
}

export async function quickCreateTask(
  client: Client,
  { title, projectId }: { title: string; projectId?: string | "internal" }
): Promise<Task> {
  return createTask(client, {
    title,
    project_id: projectId && projectId !== "internal" ? projectId : null,
    status: "backlog",
    urgency: "normal",
  });
}

export async function createTasksFromTemplate(
  client: Client,
  projectId: string,
  templateTasks: { title: string; urgency?: TaskUrgency }[]
): Promise<void> {
  if (templateTasks.length === 0) return;

  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Error("Niet ingelogd");

  const { error } = await client.from("tasks").insert(
    templateTasks.map((t, index) => ({
      title: t.title,
      urgency: t.urgency ?? "normal",
      status: "backlog" as TaskStatus,
      project_id: projectId,
      position: index,
      user_id: user.id,
    }))
  );

  if (error) throw error;
}

export async function updateTask(
  client: Client,
  id: string,
  patch: Partial<TaskInput>
): Promise<Task> {
  const { data, error } = await client
    .from("tasks")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return toTask(data);
}

export async function updateTaskStatus(
  client: Client,
  id: string,
  status: TaskStatus
): Promise<Task> {
  return updateTask(client, id, { status });
}

export async function reorderTasks(
  client: Client,
  updates: { id: string; status: TaskStatus; position: number }[]
): Promise<void> {
  const results = await Promise.all(
    updates.map(({ id, status, position }) =>
      client.from("tasks").update({ status, position }).eq("id", id)
    )
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}

export async function deleteTask(client: Client, id: string): Promise<void> {
  const { error } = await client.from("tasks").delete().eq("id", id);
  if (error) throw error;
}

export async function listScheduledTasks(
  client: Client,
  range: { from: string; to: string }
): Promise<Task[]> {
  const { data, error } = await client
    .from("tasks")
    .select("*")
    .gte("scheduled_start", range.from)
    .lte("scheduled_start", range.to)
    .order("scheduled_start");

  if (error) throw error;
  return (data ?? []).map(toTask);
}

export async function listUnscheduledTasks(client: Client): Promise<Task[]> {
  const [{ data, error }, archivedProjectIds] = await Promise.all([
    client
      .from("tasks")
      .select("*")
      .is("scheduled_start", null)
      .neq("status", "done")
      .order("created_at", { ascending: false }),
    getArchivedProjectIds(client),
  ]);
  if (error) throw error;
  return (data ?? [])
    .filter((row) => !row.project_id || !archivedProjectIds.has(row.project_id))
    .map(toTask);
}
