"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { format, isSameDay, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { UrgencyDot } from "@/components/tasks/urgency-badge";
import type { Task } from "@/lib/types";
import type { BusyBlock } from "@/lib/google-calendar";

export const HOUR_START = 7;
export const HOUR_END = 20;
const ROW_HEIGHT_PX = 48;

function minutesFromDayStart(date: Date): number {
  return (date.getHours() - HOUR_START) * 60 + date.getMinutes();
}

function blockStyle(start: Date, end: Date): React.CSSProperties {
  const top = (minutesFromDayStart(start) / 60) * ROW_HEIGHT_PX;
  const height = Math.max(
    ((end.getTime() - start.getTime()) / 60000 / 60) * ROW_HEIGHT_PX,
    20
  );
  return { top, height };
}

function HourCell({ dateISO, hour }: { dateISO: string; hour: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${dateISO}-${hour}` });
  return (
    <div
      ref={setNodeRef}
      style={{ height: ROW_HEIGHT_PX }}
      className={cn(
        "border-b border-dashed border-border/60",
        isOver && "bg-accent"
      )}
    />
  );
}

function ScheduledTaskBlock({
  task,
  onClick,
}: {
  task: Task;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
  });

  if (!task.scheduled_start || !task.scheduled_end) return null;
  const start = parseISO(task.scheduled_start);
  const end = parseISO(task.scheduled_end);

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onClick}
      style={blockStyle(start, end)}
      className={cn(
        "absolute inset-x-0.5 z-10 cursor-grab overflow-hidden rounded-md border border-primary/30 bg-primary/15 px-1.5 py-1 text-xs leading-tight active:cursor-grabbing",
        isDragging && "opacity-40"
      )}
    >
      <div className="flex items-center gap-1 font-medium">
        <UrgencyDot urgency={task.urgency} />
        <span className="truncate">{task.title}</span>
      </div>
    </div>
  );
}

function BusyBlockOverlay({ block }: { block: BusyBlock }) {
  const start = parseISO(block.start);
  const end = parseISO(block.end);
  return (
    <div
      style={blockStyle(start, end)}
      className="absolute inset-x-0.5 rounded-md bg-muted-foreground/15 px-1.5 py-1 text-xs text-muted-foreground"
    >
      Bezet
    </div>
  );
}

export function WeekGrid({
  weekDays,
  scheduledTasks,
  busyBlocks,
  onTaskClick,
}: {
  weekDays: Date[];
  scheduledTasks: Task[];
  busyBlocks: BusyBlock[];
  onTaskClick: (task: Task) => void;
}) {
  const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);
  const today = new Date();

  return (
    <div className="flex overflow-x-auto rounded-lg border">
      <div className="flex w-12 shrink-0 flex-col pt-9">
        {hours.map((hour) => (
          <div
            key={hour}
            style={{ height: ROW_HEIGHT_PX }}
            className="pr-2 text-right text-xs text-muted-foreground"
          >
            {hour}:00
          </div>
        ))}
      </div>
      {weekDays.map((day) => {
        const dateISO = format(day, "yyyy-MM-dd");
        const dayTasks = scheduledTasks.filter(
          (t) => t.scheduled_start && isSameDay(parseISO(t.scheduled_start), day)
        );
        const dayBusy = busyBlocks.filter((b) => isSameDay(parseISO(b.start), day));

        return (
          <div key={dateISO} className="w-40 shrink-0 border-l">
            <div
              className={cn(
                "sticky top-0 border-b bg-background px-2 py-1.5 text-center text-xs",
                isSameDay(day, today) && "font-semibold text-primary"
              )}
            >
              {format(day, "EEE d MMM", { locale: nl })}
            </div>
            <div className="relative">
              {hours.map((hour) => (
                <HourCell key={hour} dateISO={dateISO} hour={hour} />
              ))}
              {dayBusy.map((block, i) => (
                <BusyBlockOverlay key={i} block={block} />
              ))}
              {dayTasks.map((task) => (
                <ScheduledTaskBlock
                  key={task.id}
                  task={task}
                  onClick={() => onTaskClick(task)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
