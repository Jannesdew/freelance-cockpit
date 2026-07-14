import Link from "next/link";
import { ProjectCard } from "@/components/projects/project-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import type { ProjectWithProgress } from "@/lib/types";

export function ProjectCardsRow({ projects }: { projects: ProjectWithProgress[] }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Actieve projecten</h2>
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/projects" />}>
          Alle projecten
        </Button>
      </div>
      <div className="mt-3">
        {projects.length === 0 ? (
          <EmptyState
            title="Nog geen actieve projecten"
            description="Maak een project aan om hier voortgang te zien."
            action={
              <Button nativeButton={false} render={<Link href="/projects" />}>
                Naar projecten
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
