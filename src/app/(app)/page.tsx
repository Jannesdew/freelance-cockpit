import { createClient } from "@/lib/supabase/server";
import { listProjects } from "@/lib/services/projects";
import {
  getDashboardUrgentTasks,
  getInternalTasks,
  getTaskStatusCounts,
} from "@/lib/services/tasks";
import { TaskListWidget } from "@/components/dashboard/task-list-widget";
import { StatusCountsChart } from "@/components/dashboard/status-counts-chart";
import { ProjectCardsRow } from "@/components/dashboard/project-cards-row";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [urgentTasks, statusCounts, allProjects, internalTasks] = await Promise.all([
    getDashboardUrgentTasks(supabase),
    getTaskStatusCounts(supabase),
    listProjects(supabase, { includeArchived: false }),
    getInternalTasks(supabase),
  ]);

  const activeProjects = allProjects.filter((p) => p.status === "actief");
  const projectOptions = allProjects.map((p) => ({ id: p.id, name: p.name }));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Totaaloverzicht van je projecten en taken.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TaskListWidget
          title="Urgent & deadlines"
          tasks={urgentTasks}
          projects={projectOptions}
          emptyMessage="Geen urgente taken of deadlines binnenkort."
        />
        <StatusCountsChart counts={statusCounts} />
      </div>

      <ProjectCardsRow projects={activeProjects} />

      <TaskListWidget
        title="Interne taken"
        tasks={internalTasks}
        projects={projectOptions}
        emptyMessage="Nog geen interne taken."
        quickAddProjectId="internal"
      />
    </div>
  );
}
