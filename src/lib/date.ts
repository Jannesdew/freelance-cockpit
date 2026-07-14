import { differenceInCalendarDays, format, parseISO } from "date-fns";

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "";
  return format(parseISO(dateString), "dd-MM-yyyy");
}

export function formatRelativeDeadline(dateString: string): {
  label: string;
  isOverdue: boolean;
  isToday: boolean;
} {
  const diff = differenceInCalendarDays(parseISO(dateString), new Date());

  let label: string;
  if (diff === 0) label = "Vandaag";
  else if (diff === 1) label = "Morgen";
  else if (diff === -1) label = "Gisteren";
  else if (diff > 1) label = `Over ${diff} dagen`;
  else label = `${Math.abs(diff)} dagen geleden`;

  return { label, isOverdue: diff < 0, isToday: diff === 0 };
}
