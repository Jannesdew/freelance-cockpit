"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  parseFinancialDocumentsWorkbook,
  updateFinancialDocumentProject,
  updateFinancialDocumentStatus,
  upsertFinancialDocuments,
} from "@/lib/services/financial-documents";

export async function importFinancialDocumentsAction(formData: FormData) {
  const invoiceFile = formData.get("invoiceFile");
  const quoteFile = formData.get("quoteFile");

  const parsed = [];
  if (invoiceFile instanceof File && invoiceFile.size > 0) {
    parsed.push(
      ...(await parseFinancialDocumentsWorkbook(await invoiceFile.arrayBuffer(), "invoice"))
    );
  }
  if (quoteFile instanceof File && quoteFile.size > 0) {
    parsed.push(
      ...(await parseFinancialDocumentsWorkbook(await quoteFile.arrayBuffer(), "quote"))
    );
  }

  if (parsed.length === 0) {
    throw new Error("Selecteer minstens één bestand om te importeren");
  }

  const supabase = await createClient();
  const count = await upsertFinancialDocuments(supabase, parsed);
  revalidatePath("/financials");
  revalidatePath("/");
  return count;
}

export async function updateFinancialDocumentProjectAction(
  id: string,
  projectId: string | null
) {
  const supabase = await createClient();
  await updateFinancialDocumentProject(supabase, id, projectId);
  revalidatePath("/financials");
  revalidatePath("/");
}

export async function updateFinancialDocumentStatusAction(id: string, status: string) {
  if (!status.trim()) throw new Error("Status is verplicht");
  const supabase = await createClient();
  await updateFinancialDocumentStatus(supabase, id, status);
  revalidatePath("/financials");
  revalidatePath("/projects");
  revalidatePath("/");
}
