import { createClient } from "@/lib/supabase/server";
import { listProjects } from "@/lib/services/projects";
import { listTasks } from "@/lib/services/tasks";
import { TaskTable } from "@/components/tasks/task-table";
import { TaskFilters } from "@/components/tasks/task-filters";
import { QuickAddTask } from "@/components/tasks/quick-add-task";
import type { TaskFilters as TaskFiltersType } from "@/lib/services/tasks";
import type { TaskStatus, TaskUrgency } from "@/lib/types";

export default async function ListPage({
  searchParams,
}: {
  searchParams: Promise<{
    project?: string;
    status?: string;
    urgency?: string;
    deadlineFrom?: string;
    deadlineTo?: string;
    sort?: string;
    sortDir?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const [tasks, projects] = await Promise.all([
    listTasks(supabase, {
      projectId: params.project as string | "internal" | undefined,
      status: params.status as TaskStatus | undefined,
      urgency: params.urgency as TaskUrgency | undefined,
      deadlineFrom: params.deadlineFrom,
      deadlineTo: params.deadlineTo,
      sort: params.sort as TaskFiltersType["sort"],
      sortDir: params.sortDir as TaskFiltersType["sortDir"],
    }),
    listProjects(supabase),
  ]);

  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name }));

  return (
    <div>
      <h1 className="text-2xl font-semibold">Lijst</h1>

      <div className="mt-4 flex flex-col gap-3">
        <TaskFilters projects={projectOptions} showStatusFilter />
        <QuickAddTask
          projectId={params.project as string | "internal" | undefined}
        />
      </div>

      <div className="mt-6">
        <TaskTable tasks={tasks} projects={projectOptions} currentParams={params} />
      </div>
    </div>
  );
}
