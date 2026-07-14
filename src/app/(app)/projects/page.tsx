import Link from "next/link";
import { FolderPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { listProjects } from "@/lib/services/projects";
import { listTemplates } from "@/lib/services/templates";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string }>;
}) {
  const { archived } = await searchParams;
  const showArchived = archived === "1";

  const supabase = await createClient();
  const [projects, templates] = await Promise.all([
    listProjects(supabase, { includeArchived: showArchived }),
    listTemplates(supabase),
  ]);
  const templateOptions = templates.map((t) => ({ id: t.id, name: t.name }));
  const visibleProjects = showArchived
    ? projects.filter((p) => p.archived_at !== null)
    : projects;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projecten</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={
              <Link href={showArchived ? "/projects" : "/projects?archived=1"} />
            }
          >
            {showArchived ? "Actieve projecten" : "Gearchiveerde projecten"}
          </Button>
          <ProjectFormDialog
            templates={templateOptions}
            trigger={<Button>Nieuw project</Button>}
          />
        </div>
      </div>

      <div className="mt-6">
        {visibleProjects.length === 0 ? (
          <EmptyState
            icon={FolderPlus}
            title={showArchived ? "Geen gearchiveerde projecten" : "Nog geen projecten"}
            description={
              showArchived
                ? undefined
                : "Maak je eerste project aan om taken te kunnen koppelen."
            }
            action={
              !showArchived && (
                <ProjectFormDialog
            templates={templateOptions}
            trigger={<Button>Nieuw project</Button>}
          />
              )
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
