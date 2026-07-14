import { createClient } from "@/lib/supabase/server";
import { listProjects } from "@/lib/services/projects";
import { listTasksForBoard } from "@/lib/services/tasks";
import { KanbanBoard } from "@/components/board/kanban-board";
import { TaskFilters } from "@/components/tasks/task-filters";
import { QuickAddTask } from "@/components/tasks/quick-add-task";
import type { TaskUrgency } from "@/lib/types";

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<{
    project?: string;
    urgency?: string;
    deadlineFrom?: string;
    deadlineTo?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const [tasks, projects] = await Promise.all([
    listTasksForBoard(supabase, {
      projectId: params.project as string | "internal" | undefined,
      urgency: params.urgency as TaskUrgency | undefined,
      deadlineFrom: params.deadlineFrom,
      deadlineTo: params.deadlineTo,
    }),
    listProjects(supabase),
  ]);

  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name }));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Board</h1>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <TaskFilters projects={projectOptions} />
        <QuickAddTask
          projectId={params.project as string | "internal" | undefined}
        />
      </div>

      <div className="mt-6">
        <KanbanBoard initialTasks={tasks} projects={projectOptions} />
      </div>
    </div>
  );
}
