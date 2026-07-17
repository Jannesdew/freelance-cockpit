"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SchedulePreviewDialog } from "@/components/agenda/schedule-preview-dialog";
import {
  commitScheduleAction,
  previewScheduleAction,
  type SchedulePreviewItem,
} from "@/app/(app)/agenda/actions";
import type { Task } from "@/lib/types";

export function PlanWeekButton({
  range,
  onPlanned,
}: {
  range: { from: string; to: string };
  onPlanned: (tasks: Task[]) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [previewItems, setPreviewItems] = useState<SchedulePreviewItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  async function handlePlan() {
    setIsLoading(true);
    try {
      const items = await previewScheduleAction(range);
      if (items.length === 0) {
        toast.info("Niets om in te plannen", {
          description: "Alle taken zijn al ingepland of er is geen vrije ruimte.",
        });
        return;
      }
      setPreviewItems(items);
      setIsOpen(true);
    } catch (error) {
      toast.error("Plannen mislukt", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConfirm() {
    setIsCommitting(true);
    try {
      const updated = await commitScheduleAction(
        previewItems.map((item) => ({
          taskId: item.task.id,
          start: item.start,
          end: item.end,
        }))
      );
      onPlanned(updated);
      toast.success(`${updated.length} taken ingepland`);
      setIsOpen(false);
    } catch (error) {
      toast.error("Bevestigen mislukt", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsCommitting(false);
    }
  }

  return (
    <>
      <Button variant="outline" onClick={handlePlan} disabled={isLoading}>
        <Sparkles />
        {isLoading ? "Bezig..." : "Plan deze week"}
      </Button>
      <SchedulePreviewDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        items={previewItems}
        isCommitting={isCommitting}
        onConfirm={handleConfirm}
      />
    </>
  );
}
