"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { FileX, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/date";
import { formatCurrency } from "@/lib/format";
import {
  updateFinancialDocumentProjectAction,
  updateFinancialDocumentStatusAction,
} from "@/app/(app)/financials/actions";
import { INVOICE_STATUS_OPTIONS, QUOTE_STATUS_ORDER } from "@/lib/types";
import { FinancialStatusIcon } from "@/components/financials/financial-status-badge";
import type { FinancialDocumentWithGroup } from "@/lib/services/financial-documents";

const NO_PROJECT_VALUE = "none";
const KIND_LABELS = { invoice: "Factuur", quote: "Offerte" } as const;
const STATUS_OPTIONS = { invoice: INVOICE_STATUS_OPTIONS, quote: QUOTE_STATUS_ORDER } as const;

function DocumentRow({
  doc,
  projects,
  showProjectColumn,
  banded,
}: {
  doc: FinancialDocumentWithGroup;
  projects: { id: string; name: string }[];
  showProjectColumn: boolean;
  banded: boolean;
}) {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);

  async function handleProjectChange(value: string | null) {
    const projectId = value === NO_PROJECT_VALUE || !value ? null : value;
    setIsBusy(true);
    try {
      await updateFinancialDocumentProjectAction(doc.id, projectId);
      router.refresh();
    } catch (error) {
      toast.error("Koppelen mislukt", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsBusy(false);
    }
  }

  async function handleStatusChange(value: string | null) {
    if (!value) return;
    setIsBusy(true);
    try {
      await updateFinancialDocumentStatusAction(doc.id, value);
      router.refresh();
    } catch (error) {
      toast.error("Status wijzigen mislukt", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsBusy(false);
    }
  }

  // Statuses come from a free-text DigiBoox export, so the current value
  // might not be in the known list — always include it so it never disappears.
  const statusOptions = STATUS_OPTIONS[doc.kind].includes(doc.status)
    ? STATUS_OPTIONS[doc.kind]
    : [...STATUS_OPTIONS[doc.kind], doc.status];

  const showLinkHint = doc.kind === "invoice" && doc.linkedNumber && doc.groupKey.startsWith("quote:");

  return (
    <TableRow className={cn(banded && "bg-muted/30")}>
      <TableCell>
        <Badge variant="outline">{KIND_LABELS[doc.kind]}</Badge>
      </TableCell>
      <TableCell className="font-medium">
        {doc.number}
        {showLinkHint && (
          <div className="text-xs font-normal text-muted-foreground">
            ↳ offerte {doc.linkedNumber}
          </div>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5">
          <Select value={doc.status} onValueChange={handleStatusChange} disabled={isBusy}>
            <SelectTrigger size="sm">
              <SelectValue>
                {(value: string) => (
                  <>
                    <FinancialStatusIcon status={value} />
                    {value}
                  </>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((s) => (
                <SelectItem key={s} value={s}>
                  <FinancialStatusIcon status={s} />
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {doc.status_override && (
            <PenLine
              className="size-3.5 shrink-0 text-muted-foreground"
              aria-label="Handmatig aangepast"
            >
              <title>Handmatig aangepast — blijft staan bij een nieuwe import</title>
            </PenLine>
          )}
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">{formatDate(doc.document_date)}</TableCell>
      <TableCell>{formatCurrency(Number(doc.amount_incl))}</TableCell>
      <TableCell className="text-muted-foreground">{doc.relation_name ?? "—"}</TableCell>
      {showProjectColumn && (
        <TableCell>
          <Select
            value={doc.project_id ?? NO_PROJECT_VALUE}
            onValueChange={handleProjectChange}
            disabled={isBusy}
          >
            <SelectTrigger size="sm">
              <SelectValue>
                {(value: string) =>
                  value === NO_PROJECT_VALUE
                    ? "Geen project"
                    : projects.find((p) => p.id === value)?.name
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_PROJECT_VALUE}>Geen project</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
      )}
    </TableRow>
  );
}

export function FinancialDocumentsTable({
  documents,
  projects,
  showProjectColumn = true,
}: {
  documents: FinancialDocumentWithGroup[];
  projects: { id: string; name: string }[];
  showProjectColumn?: boolean;
}) {
  if (documents.length === 0) {
    return (
      <EmptyState
        icon={FileX}
        title="Nog geen facturen of offertes"
        description="Importeer een export uit DigiBoox om te beginnen, of pas de filters aan."
      />
    );
  }

  const groupIndices = computeGroupIndices(documents);

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Nummer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Datum</TableHead>
            <TableHead>Bedrag</TableHead>
            <TableHead>Relatie</TableHead>
            {showProjectColumn && <TableHead>Project</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc, index) => (
            <DocumentRow
              key={doc.id}
              doc={doc}
              projects={projects}
              showProjectColumn={showProjectColumn}
              banded={groupIndices[index] % 2 === 1}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Assigns each document the index of its group (in first-seen order) so
// adjacent rows from the same group can share an alternating background band.
function computeGroupIndices(documents: FinancialDocumentWithGroup[]): number[] {
  const indices: number[] = [];
  let currentIndex = -1;
  let previousKey: string | null = null;
  for (const doc of documents) {
    if (doc.groupKey !== previousKey) {
      currentIndex += 1;
      previousKey = doc.groupKey;
    }
    indices.push(currentIndex);
  }
  return indices;
}
