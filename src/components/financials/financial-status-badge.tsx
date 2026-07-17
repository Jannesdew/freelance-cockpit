import {
  CheckCircle2,
  Circle,
  CircleDashed,
  CircleDollarSign,
  Clock,
  FileCheck2,
  Send,
  ThumbsUp,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const FINANCIAL_STATUS_CLASSES: Record<string, string> = {
  Betaald: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  "Niet betaald": "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  Open: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  Verzonden: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  Geaccepteerd: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  Gefactureerd: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  Afgewezen: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  Verlopen: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
};

export const FINANCIAL_STATUS_ICON_CLASSES: Record<string, string> = {
  Betaald: "text-green-600 dark:text-green-400",
  "Niet betaald": "text-amber-600 dark:text-amber-400",
  Open: "text-zinc-500 dark:text-zinc-400",
  Verzonden: "text-blue-600 dark:text-blue-400",
  Geaccepteerd: "text-violet-600 dark:text-violet-400",
  Gefactureerd: "text-teal-600 dark:text-teal-400",
  Afgewezen: "text-red-600 dark:text-red-400",
  Verlopen: "text-orange-600 dark:text-orange-400",
};

export const FINANCIAL_STATUS_ICONS: Record<string, typeof Circle> = {
  Betaald: CheckCircle2,
  "Niet betaald": CircleDollarSign,
  Open: CircleDashed,
  Verzonden: Send,
  Geaccepteerd: ThumbsUp,
  Gefactureerd: FileCheck2,
  Afgewezen: XCircle,
  Verlopen: Clock,
};

const FALLBACK_CLASS = "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
const FALLBACK_ICON_CLASS = "text-zinc-500 dark:text-zinc-400";

export function FinancialStatusIcon({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const Icon = FINANCIAL_STATUS_ICONS[status] ?? Circle;
  return (
    <Icon
      className={cn(
        "size-3.5 shrink-0",
        FINANCIAL_STATUS_ICON_CLASSES[status] ?? FALLBACK_ICON_CLASS,
        className
      )}
    />
  );
}

export function FinancialStatusBadge({ status }: { status: string }) {
  const Icon = FINANCIAL_STATUS_ICONS[status] ?? Circle;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        FINANCIAL_STATUS_CLASSES[status] ?? FALLBACK_CLASS
      )}
    >
      <Icon className="size-3" />
      {status}
    </span>
  );
}
