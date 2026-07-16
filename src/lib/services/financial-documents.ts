import ExcelJS from "exceljs";
import type { SupabaseClient } from "@supabase/supabase-js";
import { format, parseISO, startOfMonth, subMonths } from "date-fns";
import type { Database } from "@/lib/database.types";
import {
  QUOTE_STATUS_ORDER,
  toFinancialDocument,
  type FinancialDocument,
  type FinancialDocumentKind,
} from "@/lib/types";
import { listProjects } from "@/lib/services/projects";

type Client = SupabaseClient<Database>;

export type ParsedFinancialDocument = {
  kind: FinancialDocumentKind;
  number: string;
  status: string;
  documentDate: string | null;
  amountIncl: number;
  amountExcl: number;
  vatAmount: number;
  relationName: string | null;
  description: string | null;
};

const NUMBER_COLUMN: Record<FinancialDocumentKind, string> = {
  invoice: "Factuurnummer",
  quote: "Offertenummer",
};
const AMOUNT_INCL_COLUMN: Record<FinancialDocumentKind, string> = {
  invoice: "Bedrag",
  quote: "Totaal incl. btw",
};
const AMOUNT_EXCL_COLUMN: Record<FinancialDocumentKind, string> = {
  invoice: "excl. btw",
  quote: "Totaal excl. btw",
};

function toNumber(value: ExcelJS.CellValue): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function toText(value: ExcelJS.CellValue): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "object" && "text" in value) return String(value.text).trim() || null;
  return String(value).trim() || null;
}

function toIsoDate(value: ExcelJS.CellValue): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
  }
  return null;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function parseFinancialDocumentsWorkbook(
  buffer: ArrayBuffer,
  kind: FinancialDocumentKind
): Promise<ParsedFinancialDocument[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const columnIndex = new Map<string, number>();
  sheet.getRow(1).eachCell((cell, colNumber) => {
    const value = toText(cell.value);
    if (value) columnIndex.set(value, colNumber);
  });

  const numberCol = columnIndex.get(NUMBER_COLUMN[kind]);
  const amountInclCol = columnIndex.get(AMOUNT_INCL_COLUMN[kind]);
  if (!numberCol || !amountInclCol) {
    throw new Error(
      `Onverwacht bestandsformaat: kolom "${NUMBER_COLUMN[kind]}" of "${AMOUNT_INCL_COLUMN[kind]}" niet gevonden.`
    );
  }
  const statusCol = columnIndex.get("Status");
  const dateCol = columnIndex.get("Datum");
  const amountExclCol = columnIndex.get(AMOUNT_EXCL_COLUMN[kind]);
  const vatCol = columnIndex.get("Btw €");
  const relationCol = columnIndex.get("Relatie");
  const descriptionCol = columnIndex.get("Omschrijving");

  type Group = {
    status: string;
    documentDate: string | null;
    amountIncl: number;
    amountExcl: number;
    vatAmount: number;
    relationName: string | null;
    descriptions: Set<string>;
  };
  const groups = new Map<string, Group>();

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const number = toText(row.getCell(numberCol).value);
    if (!number) return;

    const amountIncl = toNumber(row.getCell(amountInclCol).value);
    const amountExcl = amountExclCol ? toNumber(row.getCell(amountExclCol).value) : 0;
    const vatAmount = vatCol ? toNumber(row.getCell(vatCol).value) : 0;
    const description = descriptionCol ? toText(row.getCell(descriptionCol).value) : null;

    const existing = groups.get(number);
    if (existing) {
      existing.amountIncl += amountIncl;
      existing.amountExcl += amountExcl;
      existing.vatAmount += vatAmount;
      if (description) existing.descriptions.add(description);
    } else {
      groups.set(number, {
        status: (statusCol ? toText(row.getCell(statusCol).value) : null) ?? "",
        documentDate: dateCol ? toIsoDate(row.getCell(dateCol).value) : null,
        amountIncl,
        amountExcl,
        vatAmount,
        relationName: relationCol ? toText(row.getCell(relationCol).value) : null,
        descriptions: new Set(description ? [description] : []),
      });
    }
  });

  return Array.from(groups.entries()).map(([number, g]) => ({
    kind,
    number,
    status: g.status,
    documentDate: g.documentDate,
    amountIncl: round2(g.amountIncl),
    amountExcl: round2(g.amountExcl),
    vatAmount: round2(g.vatAmount),
    relationName: g.relationName,
    description: Array.from(g.descriptions).join("; ") || null,
  }));
}

export async function upsertFinancialDocuments(
  client: Client,
  docs: ParsedFinancialDocument[]
): Promise<number> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Error("Niet ingelogd");
  if (docs.length === 0) return 0;

  const projects = await listProjects(client, { includeArchived: true });
  const projectIdByName = new Map(
    projects
      .filter((p) => p.client_name)
      .map((p) => [normalizeName(p.client_name!), p.id])
  );

  const kinds = Array.from(new Set(docs.map((d) => d.kind)));
  const { data: existingRows, error: existingError } = await client
    .from("financial_documents")
    .select("number, kind, project_id, status, status_override")
    .eq("user_id", user.id)
    .in("kind", kinds);
  if (existingError) throw existingError;

  const existingByKey = new Map(
    (existingRows ?? []).map((row) => [`${row.kind}:${row.number}`, row])
  );

  const rows = docs.map((d) => {
    const key = `${d.kind}:${d.number}`;
    const matchedProjectId = d.relationName
      ? projectIdByName.get(normalizeName(d.relationName)) ?? null
      : null;
    const existing = existingByKey.get(key);

    return {
      user_id: user.id,
      kind: d.kind,
      number: d.number,
      // A manually-set status (via the app) survives re-imports — otherwise
      // re-uploading an export would silently overwrite an edit made here.
      status: existing?.status_override ? existing.status : d.status,
      document_date: d.documentDate,
      amount_incl: d.amountIncl,
      amount_excl: d.amountExcl,
      vat_amount: d.vatAmount,
      relation_name: d.relationName,
      description: d.description,
      project_id: existing ? (existing.project_id ?? matchedProjectId) : matchedProjectId,
      imported_at: new Date().toISOString(),
    };
  });

  const { error } = await client
    .from("financial_documents")
    .upsert(rows, { onConflict: "user_id,kind,number" });
  if (error) throw error;

  return rows.length;
}

export async function listFinancialDocuments(
  client: Client,
  { projectId, kind }: { projectId?: string; kind?: FinancialDocumentKind } = {}
): Promise<FinancialDocument[]> {
  let query = client
    .from("financial_documents")
    .select("*")
    .order("document_date", { ascending: false, nullsFirst: false });

  if (projectId) query = query.eq("project_id", projectId);
  if (kind) query = query.eq("kind", kind);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(toFinancialDocument);
}

export async function updateFinancialDocumentProject(
  client: Client,
  id: string,
  projectId: string | null
): Promise<void> {
  const { error } = await client
    .from("financial_documents")
    .update({ project_id: projectId })
    .eq("id", id);
  if (error) throw error;
}

export async function updateFinancialDocumentStatus(
  client: Client,
  id: string,
  status: string
): Promise<void> {
  const { error } = await client
    .from("financial_documents")
    .update({ status, status_override: true })
    .eq("id", id);
  if (error) throw error;
}

export type FinancialSummary = {
  invoicesPaidAmount: number;
  invoicesOpenAmount: number;
  invoicesOpenCount: number;
  quotesByStatus: { status: string; count: number; amount: number }[];
};

export async function getFinancialSummary(client: Client): Promise<FinancialSummary> {
  const { data, error } = await client
    .from("financial_documents")
    .select("kind, status, amount_incl");
  if (error) throw error;

  const rows = data ?? [];
  const invoices = rows.filter((r) => r.kind === "invoice");
  const quotes = rows.filter((r) => r.kind === "quote");

  const paidInvoices = invoices.filter((r) => r.status === "Betaald");
  const openInvoices = invoices.filter((r) => r.status !== "Betaald");

  const quotesByStatusMap = new Map<string, { count: number; amount: number }>();
  for (const q of quotes) {
    const entry = quotesByStatusMap.get(q.status) ?? { count: 0, amount: 0 };
    entry.count += 1;
    entry.amount += Number(q.amount_incl);
    quotesByStatusMap.set(q.status, entry);
  }

  return {
    invoicesPaidAmount: round2(paidInvoices.reduce((sum, r) => sum + Number(r.amount_incl), 0)),
    invoicesOpenAmount: round2(openInvoices.reduce((sum, r) => sum + Number(r.amount_incl), 0)),
    invoicesOpenCount: openInvoices.length,
    quotesByStatus: Array.from(quotesByStatusMap.entries()).map(([status, v]) => ({
      status,
      count: v.count,
      amount: round2(v.amount),
    })),
  };
}

export type MonthlyRevenue = { month: string; label: string; paid: number; open: number };

export async function getMonthlyRevenue(client: Client, months = 6): Promise<MonthlyRevenue[]> {
  const now = new Date();
  const earliestMonth = startOfMonth(subMonths(now, months - 1));

  const { data, error } = await client
    .from("financial_documents")
    .select("document_date, status, amount_incl")
    .eq("kind", "invoice")
    .gte("document_date", format(earliestMonth, "yyyy-MM-dd"));
  if (error) throw error;

  const paidByMonth = new Map<string, number>();
  const openByMonth = new Map<string, number>();
  for (const row of data ?? []) {
    if (!row.document_date) continue;
    const key = format(startOfMonth(parseISO(row.document_date)), "yyyy-MM");
    const map = row.status === "Betaald" ? paidByMonth : openByMonth;
    map.set(key, (map.get(key) ?? 0) + Number(row.amount_incl));
  }

  const result: MonthlyRevenue[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i));
    const key = format(monthStart, "yyyy-MM");
    result.push({
      month: key,
      label: format(monthStart, "MMM yyyy"),
      paid: round2(paidByMonth.get(key) ?? 0),
      open: round2(openByMonth.get(key) ?? 0),
    });
  }
  return result;
}

export type QuoteConversionStage = { status: string; count: number; amount: number };

export async function getQuoteConversion(client: Client): Promise<QuoteConversionStage[]> {
  const { data, error } = await client
    .from("financial_documents")
    .select("status, amount_incl")
    .eq("kind", "quote");
  if (error) throw error;

  const byStatus = new Map<string, { count: number; amount: number }>();
  for (const row of data ?? []) {
    const entry = byStatus.get(row.status) ?? { count: 0, amount: 0 };
    entry.count += 1;
    entry.amount += Number(row.amount_incl);
    byStatus.set(row.status, entry);
  }

  const known = QUOTE_STATUS_ORDER.filter((status) => byStatus.has(status));
  const unknown = Array.from(byStatus.keys()).filter((status) => !QUOTE_STATUS_ORDER.includes(status));

  return [...known, ...unknown].map((status) => {
    const entry = byStatus.get(status)!;
    return { status, count: entry.count, amount: round2(entry.amount) };
  });
}
