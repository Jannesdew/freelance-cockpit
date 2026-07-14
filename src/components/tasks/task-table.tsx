import Link from "next/link";
import { ArrowDown, ArrowUp, SearchX } from "lucide-react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { TaskTableRow } from "@/components/tasks/task-table-row";
import type { Task } from "@/lib/types";

function buildSortHref(
  currentParams: Record<string, string | undefined>,
  column: string,
  nextDir: "asc" | "desc"
) {
  const params = new URLSearchParams(
    Object.entries(currentParams).filter(([, v]) => v !== undefined) as [
      string,
      string,
    ][]
  );
  params.set("sort", column);
  params.set("sortDir", nextDir);
  return `/list?${params.toString()}`;
}

function SortableHead({
  column,
  sort,
  sortDir,
  currentParams,
  children,
}: {
  column: string;
  sort: string;
  sortDir: string;
  currentParams: Record<string, string | undefined>;
  children: React.ReactNode;
}) {
  const nextDir = sort === column && sortDir === "asc" ? "desc" : "asc";
  return (
    <TableHead>
      <Link
        href={buildSortHref(currentParams, column, nextDir)}
        className="flex items-center gap-1 hover:text-foreground"
      >
        {children}
        {sort === column &&
          (sortDir === "asc" ? (
            <ArrowUp className="size-3" />
          ) : (
            <ArrowDown className="size-3" />
          ))}
      </Link>
    </TableHead>
  );
}

function TaskTableGroup({
  tasks,
  projects,
  sort,
  sortDir,
  currentParams,
  showProjectColumn,
}: {
  tasks: Task[];
  projects: { id: string; name: string }[];
  sort: string;
  sortDir: string;
  currentParams: Record<string, string | undefined>;
  showProjectColumn: boolean;
}) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHead column="title" sort={sort} sortDir={sortDir} currentParams={currentParams}>
              Titel
            </SortableHead>
            {showProjectColumn && <TableHead>Project</TableHead>}
            <SortableHead column="status" sort={sort} sortDir={sortDir} currentParams={currentParams}>
              Status
            </SortableHead>
            <SortableHead column="urgency" sort={sort} sortDir={sortDir} currentParams={currentParams}>
              Urgentie
            </SortableHead>
            <SortableHead column="deadline" sort={sort} sortDir={sortDir} currentParams={currentParams}>
              Deadline
            </SortableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TaskTableRow
              key={task.id}
              task={task}
              projects={projects}
              showProjectColumn={showProjectColumn}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function TaskTable({
  tasks,
  projects,
  currentParams,
  groupByProject = false,
}: {
  tasks: Task[];
  projects: { id: string; name: string }[];
  currentParams: Record<string, string | undefined>;
  groupByProject?: boolean;
}) {
  const sort = currentParams.sort ?? "status";
  const sortDir = currentParams.sortDir ?? "asc";

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title="Geen taken gevonden"
        description="Pas de filters aan of maak een nieuwe taak aan."
      />
    );
  }

  if (!groupByProject) {
    return (
      <TaskTableGroup
        tasks={tasks}
        projects={projects}
        sort={sort}
        sortDir={sortDir}
        currentParams={currentParams}
        showProjectColumn
      />
    );
  }

  const groups = new Map<string, { label: string; tasks: Task[] }>();
  for (const task of tasks) {
    const key = task.project_id ?? "internal";
    if (!groups.has(key)) {
      const label = task.project_id
        ? (projects.find((p) => p.id === task.project_id)?.name ?? "Onbekend project")
        : "Intern";
      groups.set(key, { label, tasks: [] });
    }
    groups.get(key)!.tasks.push(task);
  }

  return (
    <div className="flex flex-col gap-6">
      {Array.from(groups.values()).map((group) => (
        <div key={group.label}>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">
            {group.label}
          </h3>
          <TaskTableGroup
            tasks={group.tasks}
            projects={projects}
            sort={sort}
            sortDir={sortDir}
            currentParams={currentParams}
            showProjectColumn={false}
          />
        </div>
      ))}
    </div>
  );
}
