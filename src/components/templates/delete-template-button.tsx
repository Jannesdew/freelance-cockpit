"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteTemplateAction } from "@/app/(app)/templates/actions";

export function DeleteTemplateButton({
  templateId,
  templateName,
}: {
  templateId: string;
  templateName: string;
}) {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);

  async function handleDelete() {
    if (!window.confirm(`Sjabloon "${templateName}" verwijderen?`)) return;
    setIsBusy(true);
    try {
      await deleteTemplateAction(templateId);
      toast.success("Sjabloon verwijderd");
      router.refresh();
    } catch (error) {
      toast.error("Verwijderen mislukt", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <Button variant="ghost" size="icon-sm" disabled={isBusy} onClick={handleDelete}>
      <Trash2 />
      <span className="sr-only">Verwijderen</span>
    </Button>
  );
}
