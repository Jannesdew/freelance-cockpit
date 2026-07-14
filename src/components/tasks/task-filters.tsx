"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ListFilter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  const activeCount = [
    project !== ALL_VALUE,
    status !== ALL_VALUE,
    urgency !== ALL_VALUE,
    !!deadlineFrom,
    !!deadlineTo,
  ].filter(Boolean).length;

  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" size="sm" />}>
        <ListFilter />
        Filters
        {activeCount > 0 && (
          <Badge variant="secondary" className="ml-0.5 px-1.5">
            {activeCount}
          </Badge>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Project</Label>
            <Select value={project} onValueChange={(v) => setParam("project", v)}>
              <SelectTrigger className="w-full">
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
          </div>

          {showStatusFilter && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={status} onValueChange={(v) => setParam("status", v)}>
                <SelectTrigger className="w-full">
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
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Urgentie</Label>
            <Select value={urgency} onValueChange={(v) => setParam("urgency", v)}>
              <SelectTrigger className="w-full">
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
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Deadline</Label>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={deadlineFrom}
                onChange={(e) => setParam("deadlineFrom", e.target.value || null)}
                aria-label="Deadline vanaf"
              />
              <span className="text-xs text-muted-foreground">t/m</span>
              <Input
                type="date"
                value={deadlineTo}
                onChange={(e) => setParam("deadlineTo", e.target.value || null)}
                aria-label="Deadline tot"
              />
            </div>
          </div>

          {activeCount > 0 && (
            <Button variant="ghost" size="sm" onClick={() => router.push(pathname)}>
              Filters wissen
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
