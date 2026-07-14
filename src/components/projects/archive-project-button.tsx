"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  archiveProjectAction,
  unarchiveProjectAction,
} from "@/app/(app)/projects/actions";

export function ArchiveProjectButton({
  projectId,
  isArchived,
}: {
  projectId: string;
  isArchived: boolean;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleClick() {
    setIsSubmitting(true);
    try {
      if (isArchived) {
        await unarchiveProjectAction(projectId);
        toast.success("Project hersteld");
      } else {
        await archiveProjectAction(projectId);
        toast.success("Project gearchiveerd");
      }
      router.refresh();
    } catch (error) {
      toast.error("Actie mislukt", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Button variant="outline" size="sm" disabled={isSubmitting} onClick={handleClick}>
      {isArchived ? "Herstellen" : "Archiveren"}
    </Button>
  );
}
