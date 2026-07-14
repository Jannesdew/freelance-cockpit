import { Skeleton } from "@/components/ui/skeleton";
import { TASK_STATUSES } from "@/lib/types";

export default function BoardLoading() {
  return (
    <div>
      <Skeleton className="h-8 w-24" />
      <div className="mt-4 flex flex-col gap-3">
        <Skeleton className="h-8 w-full max-w-2xl" />
        <Skeleton className="h-8 w-full max-w-md" />
      </div>
      <div className="mt-6 flex gap-3 overflow-x-auto pb-4">
        {TASK_STATUSES.map((status) => (
          <div key={status} className="flex w-72 shrink-0 flex-col gap-2 rounded-lg bg-muted/40 p-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
