"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  TASK_STATUS_LABELS,
  TASK_STATUSES,
  TASK_URGENCY_LABELS,
  TASK_URGENCIES,
} from "@/lib/types";

const ALL_VALUE = "all";
const INTERNAL_VALUE = "internal";

export function TaskFilters({
  projects,
  showStatusFilter = false,
}: {
  projects: { id: string; name: string }[];
  showStatusFilter?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || value === ALL_VALUE) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const project = searchParams.get("project") ?? ALL_VALUE;
  const status = searchParams.get("status") ?? ALL_VALUE;
  const urgency = searchParams.get("urgency") ?? ALL_VALUE;
  const deadlineFrom = searchParams.get("deadlineFrom") ?? "";
  const deadlineTo = searchParams.get("deadlineTo") ?? "";
  const hasFilters =
    project !== ALL_VALUE ||
    status !== ALL_VALUE ||
    urgency !== ALL_VALUE ||
    deadlineFrom ||
    deadlineTo;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={project} onValueChange={(v) => setParam("project", v)}>
        <SelectTrigger size="sm">
          <SelectValue placeholder="Project">
            {(value: string) => {
              if (value === ALL_VALUE) return "Alle projecten";
              if (value === INTERNAL_VALUE) return "Alleen intern";
              return projects.find((p) => p.id === value)?.name;
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>Alle projecten</SelectItem>
          <SelectItem value={INTERNAL_VALUE}>Alleen intern</SelectItem>
          {projects.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showStatusFilter && (
        <Select value={status} onValueChange={(v) => setParam("status", v)}>
          <SelectTrigger size="sm">
            <SelectValue placeholder="Status">
              {(value: string) =>
                value === ALL_VALUE
                  ? "Alle statussen"
                  : TASK_STATUS_LABELS[value as keyof typeof TASK_STATUS_LABELS]
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Alle statussen</SelectItem>
            {TASK_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {TASK_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select value={urgency} onValueChange={(v) => setParam("urgency", v)}>
        <SelectTrigger size="sm">
          <SelectValue placeholder="Urgentie">
            {(value: string) =>
              value === ALL_VALUE
                ? "Alle urgenties"
                : TASK_URGENCY_LABELS[value as keyof typeof TASK_URGENCY_LABELS]
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>Alle urgenties</SelectItem>
          {TASK_URGENCIES.map((u) => (
            <SelectItem key={u} value={u}>
              {TASK_URGENCY_LABELS[u]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="date"
        value={deadlineFrom}
        onChange={(e) => setParam("deadlineFrom", e.target.value || null)}
        className="h-7 w-36"
        aria-label="Deadline vanaf"
      />
      <span className="text-xs text-muted-foreground">t/m</span>
      <Input
        type="date"
        value={deadlineTo}
        onChange={(e) => setParam("deadlineTo", e.target.value || null)}
        className="h-7 w-36"
        aria-label="Deadline tot"
      />

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={() => router.push(pathname)}>
          Filters wissen
        </Button>
      )}
    </div>
  );
}
