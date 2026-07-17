import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProject, listProjects } from "@/lib/services/projects";
import { listTasks } from "@/lib/services/tasks";
import { groupFinancialDocuments, listFinancialDocuments } from "@/lib/services/financial-documents";
import { Button } from "@/components/ui/button";
import { ProjectStatusBadge } from "@/components/projects/status-badge";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { ArchiveProjectButton } from "@/components/projects/archive-project-button";
import { TaskListSection } from "@/components/tasks/task-list-section";
import { FinancialDocumentsTable } from "@/components/financials/financial-documents-table";
import { formatDate, formatRelativeDeadline } from "@/lib/date";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const project = await getProject(supabase, id);

  if (!project) notFound();

  const [tasks, allProjects, financialDocuments] = await Promise.all([
    listTasks(supabase, { projectId: id }),
    listProjects(supabase),
    listFinancialDocuments(supabase, { projectId: id }),
  ]);

  const invoicedTotal = financialDocuments
    .filter((d) => d.kind === "invoice")
    .reduce((sum, d) => sum + Number(d.amount_incl), 0);
  const paidTotal = financialDocuments
    .filter((d) => d.kind === "invoice" && d.status === "Betaald")
    .reduce((sum, d) => sum + Number(d.amount_incl), 0);

  return (
    <div>
      <Link href="/projects" className="text-sm text-muted-foreground hover:text-foreground">
        &larr; Projecten
      </Link>

      {project.cover_image_url && (
        <div
          className="mt-4 h-40 w-full rounded-xl bg-cover bg-center"
          style={{ backgroundImage: `url(${project.cover_image_url})` }}
        />
      )}

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{project.name}</h1>
            <ProjectStatusBadge status={project.status} />
          </div>
          {project.client_name && (
            <p className="mt-1 text-muted-foreground">{project.client_name}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ProjectFormDialog
            project={project}
            trigger={<Button variant="outline">Bewerken</Button>}
          />
          <ArchiveProjectButton
            projectId={project.id}
            isArchived={project.archived_at !== null}
          />
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 max-w-sm">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-foreground"
            style={{ width: `${project.percent_done}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {project.done_tasks}/{project.total_tasks} taken ({project.percent_done}%)
        </span>
      </div>

      {project.description && (
        <p className="mt-6 max-w-2xl whitespace-pre-wrap text-sm">{project.description}</p>
      )}

      <div className="mt-4 flex gap-6 text-sm text-muted-foreground">
        {project.start_date && <span>Start: {formatDate(project.start_date)}</span>}
        {project.end_date && (
          <span>
            Deadline:{" "}
            <span
              className={cn(
                formatRelativeDeadline(project.end_date).isOverdue &&
                  project.status !== "afgerond" &&
                  "font-medium text-red-600 dark:text-red-400"
              )}
            >
              {formatRelativeDeadline(project.end_date).label}
            </span>
          </span>
        )}
      </div>

      <div className="mt-10">
        <TaskListSection
          tasks={tasks}
          projects={allProjects.map((p) => ({ id: p.id, name: p.name }))}
          defaultProjectId={project.id}
        />
      </div>

      {financialDocuments.length > 0 && (
        <div className="mt-10">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Facturen & offertes</h2>
            <p className="text-sm text-muted-foreground">
              Gefactureerd: {formatCurrency(invoicedTotal)} · Betaald: {formatCurrency(paidTotal)}
            </p>
          </div>
          <FinancialDocumentsTable
            documents={groupFinancialDocuments(financialDocuments)}
            projects={allProjects.map((p) => ({ id: p.id, name: p.name }))}
            showProjectColumn={false}
          />
        </div>
      )}
    </div>
  );
}
