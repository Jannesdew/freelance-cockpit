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
import { formatDate } from "@/lib/date";
import { formatCurrency } from "@/lib/format";
import {
  updateFinancialDocumentProjectAction,
  updateFinancialDocumentStatusAction,
} from "@/app/(app)/financials/actions";
import { INVOICE_STATUS_OPTIONS, QUOTE_STATUS_ORDER, type FinancialDocument } from "@/lib/types";

const NO_PROJECT_VALUE = "none";
const KIND_LABELS = { invoice: "Factuur", quote: "Offerte" } as const;
const STATUS_OPTIONS = { invoice: INVOICE_STATUS_OPTIONS, quote: QUOTE_STATUS_ORDER } as const;

function DocumentRow({
  doc,
  projects,
  showProjectColumn,
}: {
  doc: FinancialDocument;
  projects: { id: string; name: string }[];
  showProjectColumn: boolean;
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

  return (
    <TableRow>
      <TableCell>
        <Badge variant="outline">{KIND_LABELS[doc.kind]}</Badge>
      </TableCell>
      <TableCell className="font-medium">{doc.number}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5">
          <Select value={doc.status} onValueChange={handleStatusChange} disabled={isBusy}>
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((s) => (
                <SelectItem key={s} value={s}>
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
  documents: FinancialDocument[];
  projects: { id: string; name: string }[];
  showProjectColumn?: boolean;
}) {
  if (documents.length === 0) {
    return (
      <EmptyState
        icon={FileX}
        title="Nog geen facturen of offertes"
        description="Importeer een export uit DigiBoox om te beginnen."
      />
    );
  }

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
          {documents.map((doc) => (
            <DocumentRow
              key={doc.id}
              doc={doc}
              projects={projects}
              showProjectColumn={showProjectColumn}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
