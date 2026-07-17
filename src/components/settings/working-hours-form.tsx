"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { updateWorkingHoursAction } from "@/app/(app)/settings/actions";
import type { UserSettings } from "@/lib/types";

const WEEKDAYS = [
  { value: 1, label: "Ma" },
  { value: 2, label: "Di" },
  { value: 3, label: "Wo" },
  { value: 4, label: "Do" },
  { value: 5, label: "Vr" },
  { value: 6, label: "Za" },
  { value: 7, label: "Zo" },
];

export function WorkingHoursForm({ settings }: { settings: UserSettings | null }) {
  const [start, setStart] = useState(settings?.working_hours_start?.slice(0, 5) ?? "09:00");
  const [end, setEnd] = useState(settings?.working_hours_end?.slice(0, 5) ?? "17:00");
  const [days, setDays] = useState<number[]>(settings?.working_days ?? [1, 2, 3, 4, 5]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleDay(day: number) {
    setDays((current) =>
      current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort()
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await updateWorkingHoursAction({
        working_hours_start: start,
        working_hours_end: end,
        working_days: days,
        timezone: settings?.timezone ?? "Europe/Amsterdam",
      });
      toast.success("Werkuren opgeslagen");
    } catch (error) {
      toast.error("Opslaan mislukt", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="font-medium">Werkuren</h3>
        <p className="text-sm text-muted-foreground">
          Bepaalt binnen welke uren &ldquo;plan mijn dag/week&rdquo; taken mag inplannen.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 max-w-xs">
            <div className="flex flex-col gap-2">
              <Label htmlFor="working_hours_start">Van</Label>
              <Input
                id="working_hours_start"
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="working_hours_end">Tot</Label>
              <Input
                id="working_hours_end"
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Werkdagen</Label>
            <div className="flex gap-1.5">
              {WEEKDAYS.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={cn(
                    "flex size-9 items-center justify-center rounded-md border text-xs font-medium transition-colors",
                    days.includes(day.value)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input text-muted-foreground hover:bg-muted"
                  )}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Bezig..." : "Opslaan"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
