import Link from "next/link";
import { addDays, eachDayOfInterval, endOfDay, format, parseISO, startOfDay, startOfWeek } from "date-fns";
import { nl } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { listScheduledTasks, listUnscheduledTasks } from "@/lib/services/tasks";
import { listProjects } from "@/lib/services/projects";
import { getUserSettings } from "@/lib/services/settings";
import { getBusyBlocks } from "@/lib/services/calendar";
import { Button } from "@/components/ui/button";
import { AgendaView } from "@/components/agenda/agenda-view";
import type { BusyBlock } from "@/lib/google-calendar";

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const params = await searchParams;
  const refDate = params.week ? parseISO(params.week) : new Date();
  const weekStart = startOfWeek(refDate, { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const range = {
    from: startOfDay(weekStart).toISOString(),
    to: endOfDay(weekEnd).toISOString(),
  };

  const supabase = await createClient();
  const [scheduledTasks, unscheduledTasks, projects, settings] = await Promise.all([
    listScheduledTasks(supabase, range),
    listUnscheduledTasks(supabase),
    listProjects(supabase),
    getUserSettings(supabase),
  ]);

  let busyBlocks: BusyBlock[] = [];
  if (settings?.google_refresh_token) {
    try {
      busyBlocks = await getBusyBlocks(supabase, range);
    } catch {
      // Google-token verlopen of API-fout — grid werkt gewoon door zonder overlay.
    }
  }

  const prevWeekHref = `/agenda?week=${format(addDays(weekStart, -7), "yyyy-MM-dd")}`;
  const nextWeekHref = `/agenda?week=${format(addDays(weekStart, 7), "yyyy-MM-dd")}`;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Agenda</h1>
          <p className="text-sm text-muted-foreground">
            {format(weekStart, "d MMM", { locale: nl })} –{" "}
            {format(weekEnd, "d MMM yyyy", { locale: nl })}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            nativeButton={false}
            render={<Link href={prevWeekHref} />}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            nativeButton={false}
            render={<Link href={nextWeekHref} />}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <AgendaView
          weekDaysISO={weekDays.map((d) => format(d, "yyyy-MM-dd"))}
          initialScheduledTasks={scheduledTasks}
          initialUnscheduledTasks={unscheduledTasks}
          busyBlocks={busyBlocks}
          projects={projects.map((p) => ({ id: p.id, name: p.name }))}
          range={range}
        />
      </div>
    </div>
  );
}
