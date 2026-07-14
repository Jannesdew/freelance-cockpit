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

export function TaskTable({
  tasks,
  projects,
  currentParams,
}: {
  tasks: Task[];
  projects: { id: string; name: string }[];
  currentParams: Record<string, string | undefined>;
}) {
  const sort = currentParams.sort ?? "created_at";
  const sortDir = currentParams.sortDir ?? "desc";

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title="Geen taken gevonden"
        description="Pas de filters aan of maak een nieuwe taak aan."
      />
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHead column="title" sort={sort} sortDir={sortDir} currentParams={currentParams}>
              Titel
            </SortableHead>
            <TableHead>Project</TableHead>
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
            <TaskTableRow key={task.id} task={task} projects={projects} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
