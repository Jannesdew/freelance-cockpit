import { createClient } from "@/lib/supabase/server";
import { groupFinancialDocuments, listFinancialDocuments } from "@/lib/services/financial-documents";
import { listProjects } from "@/lib/services/projects";
import { ImportForm } from "@/components/financials/import-form";
import { FinancialDocumentsTable } from "@/components/financials/financial-documents-table";
import { FinancialFilters } from "@/components/financials/financial-filters";
import type { FinancialDocumentKind } from "@/lib/types";

const NO_PROJECT_VALUE = "none";

export default async function FinancialsPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; status?: string; project?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const [allDocuments, projects] = await Promise.all([
    listFinancialDocuments(supabase),
    listProjects(supabase, { includeArchived: true }),
  ]);

  const grouped = groupFinancialDocuments(allDocuments);
  const statuses = Array.from(new Set(allDocuments.map((d) => d.status))).sort();

  const documents = grouped.filter((doc) => {
    if (params.kind && doc.kind !== (params.kind as FinancialDocumentKind)) return false;
    if (params.status && doc.status !== params.status) return false;
    if (params.project === NO_PROJECT_VALUE && doc.project_id !== null) return false;
    if (
      params.project &&
      params.project !== NO_PROJECT_VALUE &&
      doc.project_id !== params.project
    )
      return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Financieel</h1>
        <p className="text-sm text-muted-foreground">
          Facturen en offertes uit DigiBoox, gekoppeld aan je projecten.
        </p>
      </div>

      <ImportForm />

      <FinancialFilters projects={projects.map((p) => ({ id: p.id, name: p.name }))} statuses={statuses} />

      <FinancialDocumentsTable
        documents={documents}
        projects={projects.map((p) => ({ id: p.id, name: p.name }))}
      />
    </div>
  );
}
