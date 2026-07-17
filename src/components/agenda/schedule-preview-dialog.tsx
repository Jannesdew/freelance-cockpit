"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UrgencyDot } from "@/components/tasks/urgency-badge";
import { formatDateTime } from "@/lib/date";
import type { SchedulePreviewItem } from "@/app/(app)/agenda/actions";

export function SchedulePreviewDialog({
  open,
  onOpenChange,
  items,
  isCommitting,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: SchedulePreviewItem[];
  isCommitting: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Voorstel voor deze periode</DialogTitle>
        </DialogHeader>
        <div className="flex max-h-96 flex-col gap-2 overflow-y-auto">
          {items.map((item) => (
            <div
              key={item.task.id}
              className="flex items-center justify-between gap-3 rounded-lg border p-2.5 text-sm"
            >
              <div className="flex items-center gap-2 min-w-0">
                <UrgencyDot urgency={item.task.urgency} />
                <span className="truncate font-medium">{item.task.title}</span>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatDateTime(item.start)}
              </span>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCommitting}>
            Annuleren
          </Button>
          <Button onClick={onConfirm} disabled={isCommitting}>
            {isCommitting ? "Bezig..." : `${items.length} taken inplannen`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
