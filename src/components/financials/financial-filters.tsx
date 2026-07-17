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
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FinancialStatusIcon } from "@/components/financials/financial-status-badge";

const ALL_VALUE = "all";
const NO_PROJECT_VALUE = "none";
const KIND_LABELS: Record<string, string> = { invoice: "Facturen", quote: "Offertes" };

export function FinancialFilters({
  projects,
  statuses,
}: {
  projects: { id: string; name: string }[];
  statuses: string[];
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

  const kind = searchParams.get("kind") ?? ALL_VALUE;
  const status = searchParams.get("status") ?? ALL_VALUE;
  const project = searchParams.get("project") ?? ALL_VALUE;
  const activeCount = [kind !== ALL_VALUE, status !== ALL_VALUE, project !== ALL_VALUE].filter(
    Boolean
  ).length;

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
            <Label className="text-xs text-muted-foreground">Type</Label>
            <Select value={kind} onValueChange={(v) => setParam("kind", v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Type">
                  {(value: string) => (value === ALL_VALUE ? "Alle types" : KIND_LABELS[value])}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>Alle types</SelectItem>
                <SelectItem value="invoice">Facturen</SelectItem>
                <SelectItem value="quote">Offertes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Select value={status} onValueChange={(v) => setParam("status", v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Status">
                  {(value: string) =>
                    value === ALL_VALUE ? (
                      "Alle statussen"
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <FinancialStatusIcon status={value} />
                        {value}
                      </span>
                    )
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>Alle statussen</SelectItem>
                {statuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    <FinancialStatusIcon status={s} />
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Project</Label>
            <Select value={project} onValueChange={(v) => setParam("project", v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Project">
                  {(value: string) => {
                    if (value === ALL_VALUE) return "Alle projecten";
                    if (value === NO_PROJECT_VALUE) return "Geen project";
                    return projects.find((p) => p.id === value)?.name;
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>Alle projecten</SelectItem>
                <SelectItem value={NO_PROJECT_VALUE}>Geen project</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
