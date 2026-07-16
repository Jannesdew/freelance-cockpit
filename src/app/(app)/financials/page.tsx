import { createClient } from "@/lib/supabase/server";
import { listFinancialDocuments } from "@/lib/services/financial-documents";
import { listProjects } from "@/lib/services/projects";
import { ImportForm } from "@/components/financials/import-form";
import { FinancialDocumentsTable } from "@/components/financials/financial-documents-table";

export default async function FinancialsPage() {
  const supabase = await createClient();
  const [documents, projects] = await Promise.all([
    listFinancialDocuments(supabase),
    listProjects(supabase, { includeArchived: true }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Financieel</h1>
        <p className="text-sm text-muted-foreground">
          Facturen en offertes uit DigiBoox, gekoppeld aan je projecten.
        </p>
      </div>

      <ImportForm />

      <FinancialDocumentsTable
        documents={documents}
        projects={projects.map((p) => ({ id: p.id, name: p.name }))}
      />
    </div>
  );
}
