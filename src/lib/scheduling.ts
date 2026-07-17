import { addMinutes, eachDayOfInterval, getISODay, max, min } from "date-fns";
import type { Task, TaskUrgency } from "@/lib/types";

export type ScheduleProposal = { taskId: string; start: string; end: string };

type BusyBlock = { start: string; end: string };

type WorkingHours = {
  start: string; // "HH:MM:SS"
  end: string;
  days: number[]; // ISO weekday, 1 = Monday .. 7 = Sunday
};

type FreeSlot = { start: Date; end: Date };

const URGENCY_ORDER: Record<TaskUrgency, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

function sortTasksByPriority(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const urgencyDiff = URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency];
    if (urgencyDiff !== 0) return urgencyDiff;

    if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    return 0;
  });
}

function timeStringToParts(time: string): { hours: number; minutes: number } {
  const [hours, minutes] = time.split(":").map(Number);
  return { hours, minutes };
}

function buildFreeSlots(
  range: { from: string; to: string },
  workingHours: WorkingHours,
  busyBlocks: BusyBlock[]
): FreeSlot[] {
  const rangeStart = new Date(range.from);
  const rangeEnd = new Date(range.to);
  const start = timeStringToParts(workingHours.start);
  const end = timeStringToParts(workingHours.end);

  const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
  const busy = busyBlocks.map((b) => ({ start: new Date(b.start), end: new Date(b.end) }));

  const slots: FreeSlot[] = [];

  for (const day of days) {
    if (!workingHours.days.includes(getISODay(day))) continue;

    const dayStart = new Date(day);
    dayStart.setHours(start.hours, start.minutes, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(end.hours, end.minutes, 0, 0);

    const windowStart = max([dayStart, rangeStart]);
    const windowEnd = min([dayEnd, rangeEnd]);
    if (windowStart >= windowEnd) continue;

    // Carve out any busy blocks that overlap today's working-hours window,
    // left to right, splitting the window into the free gaps between them.
    const overlapping = busy
      .filter((b) => b.start < windowEnd && b.end > windowStart)
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    let cursor = windowStart;
    for (const block of overlapping) {
      const blockStart = max([block.start, windowStart]);
      const blockEnd = min([block.end, windowEnd]);
      if (blockStart > cursor) slots.push({ start: cursor, end: blockStart });
      if (blockEnd > cursor) cursor = blockEnd;
    }
    if (cursor < windowEnd) slots.push({ start: cursor, end: windowEnd });
  }

  return slots;
}

export function planTasks({
  tasks,
  busyBlocks,
  workingHours,
  range,
}: {
  tasks: Task[];
  busyBlocks: BusyBlock[];
  workingHours: WorkingHours;
  range: { from: string; to: string };
}): ScheduleProposal[] {
  const slots = buildFreeSlots(range, workingHours, busyBlocks);
  const sortedTasks = sortTasksByPriority(tasks);
  const proposals: ScheduleProposal[] = [];

  for (const task of sortedTasks) {
    const durationMinutes = task.estimated_minutes ?? 30;
    const slotIndex = slots.findIndex(
      (slot) => (slot.end.getTime() - slot.start.getTime()) / 60000 >= durationMinutes
    );
    if (slotIndex === -1) continue;

    const slot = slots[slotIndex];
    const start = slot.start;
    const end = addMinutes(start, durationMinutes);

    proposals.push({ taskId: task.id, start: start.toISOString(), end: end.toISOString() });

    if (end.getTime() >= slot.end.getTime()) {
      slots.splice(slotIndex, 1);
    } else {
      slots[slotIndex] = { start: end, end: slot.end };
    }
  }

  return proposals;
}
