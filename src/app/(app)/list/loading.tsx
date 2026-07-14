import { Skeleton } from "@/components/ui/skeleton";

export default function ListLoading() {
  return (
    <div>
      <Skeleton className="h-8 w-20" />
      <div className="mt-4 flex flex-col gap-3">
        <Skeleton className="h-8 w-full max-w-2xl" />
        <Skeleton className="h-8 w-full max-w-md" />
      </div>
      <div className="mt-6 flex flex-col gap-2 rounded-lg border p-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
