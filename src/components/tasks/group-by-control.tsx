"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NONE_VALUE = "none";

export function GroupByControl() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const groupBy = searchParams.get("groupBy") ?? NONE_VALUE;

  function handleChange(value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === NONE_VALUE) {
      params.delete("groupBy");
    } else {
      params.set("groupBy", value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Select value={groupBy} onValueChange={handleChange}>
      <SelectTrigger size="sm">
        <SelectValue placeholder="Groeperen">
          {(value: string) =>
            value === "project" ? "Groeperen op opdracht" : "Niet groeperen"
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE_VALUE}>Niet groeperen</SelectItem>
        <SelectItem value="project">Groeperen op opdracht</SelectItem>
      </SelectContent>
    </Select>
  );
}
