import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ProjectStatusBadge } from "@/components/projects/status-badge";
import { cn } from "@/lib/utils";
import type { ProjectWithProgress } from "@/lib/types";

const PLACEHOLDER_GRADIENTS = [
  "from-blue-400 to-violet-500",
  "from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-rose-400 to-pink-500",
  "from-indigo-400 to-blue-500",
];

function placeholderGradient(seed: string) {
  const index =
    seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) %
    PLACEHOLDER_GRADIENTS.length;
  return PLACEHOLDER_GRADIENTS[index];
}

export function ProjectCard({ project }: { project: ProjectWithProgress }) {
  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="h-full overflow-hidden pt-0 transition-colors hover:border-foreground/30">
        <div
          className={cn(
            "h-24 w-full bg-cover bg-center",
            !project.cover_image_url &&
              cn("bg-gradient-to-br", placeholderGradient(project.id))
          )}
          style={
            project.cover_image_url
              ? { backgroundImage: `url(${project.cover_image_url})` }
              : undefined
          }
        />
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <div>
            <h3 className="font-medium leading-tight">{project.name}</h3>
            {project.client_name && (
              <p className="text-sm text-muted-foreground">{project.client_name}</p>
            )}
          </div>
          <ProjectStatusBadge status={project.status} />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-foreground"
                style={{ width: `${project.percent_done}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {project.percent_done}%
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {project.done_tasks}/{project.total_tasks} taken afgerond
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
