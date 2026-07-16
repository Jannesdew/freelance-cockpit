import type { Database } from "@/lib/database.types";

export type ProjectStatus = "concept" | "actief" | "on_hold" | "afgerond";
export const PROJECT_STATUSES: ProjectStatus[] = [
  "concept",
  "actief",
  "on_hold",
  "afgerond",
];
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  concept: "Concept",
  actief: "Actief",
  on_hold: "On hold",
  afgerond: "Afgerond",
};

export type TaskStatus = "backlog" | "todo" | "doing" | "feedback" | "done";
export const TASK_STATUSES: TaskStatus[] = [
  "backlog",
  "todo",
  "doing",
  "feedback",
  "done",
];
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "To do",
  doing: "Doing",
  feedback: "Feedback",
  done: "Done",
};

export type TaskUrgency = "low" | "normal" | "high" | "urgent";
export const TASK_URGENCIES: TaskUrgency[] = ["low", "normal", "high", "urgent"];
export const TASK_URGENCY_LABELS: Record<TaskUrgency, string> = {
  low: "Laag",
  normal: "Normaal",
  high: "Hoog",
  urgent: "Urgent",
};

export type FinancialDocumentKind = "invoice" | "quote";

// Business-logic progression of a quote's lifecycle; unrecognized statuses
// (any future DigiBoox label) are appended at the end in first-seen order
// rather than dropped, so nothing is ever silently lost.
export const QUOTE_STATUS_ORDER = ["Open", "Verzonden", "Geaccepteerd", "Gefactureerd", "Afgewezen", "Verlopen"];
export const INVOICE_STATUS_OPTIONS = ["Betaald", "Niet betaald"];

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
type ProjectProgressRow = Database["public"]["Views"]["project_progress"]["Row"];
type ProjectTemplateRow = Database["public"]["Tables"]["project_templates"]["Row"];
type FinancialDocumentRow = Database["public"]["Tables"]["financial_documents"]["Row"];
export type Subtask = Database["public"]["Tables"]["subtasks"]["Row"];

export type Project = Omit<ProjectRow, "status"> & { status: ProjectStatus };
export type Task = Omit<TaskRow, "status" | "urgency"> & {
  status: TaskStatus;
  urgency: TaskUrgency;
};

export type ProjectWithProgress = Project & {
  total_tasks: number;
  done_tasks: number;
  percent_done: number;
};

export function toProject(row: ProjectRow): Project {
  return { ...row, status: row.status as ProjectStatus };
}

export function toTask(row: TaskRow): Task {
  return {
    ...row,
    status: row.status as TaskStatus,
    urgency: row.urgency as TaskUrgency,
  };
}

export type ProjectTemplateTask = {
  title: string;
  urgency?: TaskUrgency;
};

export type ProjectTemplate = Omit<ProjectTemplateRow, "tasks"> & {
  tasks: ProjectTemplateTask[];
};

export function toProjectTemplate(row: ProjectTemplateRow): ProjectTemplate {
  return { ...row, tasks: (row.tasks as ProjectTemplateTask[] | null) ?? [] };
}

export type FinancialDocument = Omit<FinancialDocumentRow, "kind"> & {
  kind: FinancialDocumentKind;
};

export function toFinancialDocument(row: FinancialDocumentRow): FinancialDocument {
  return { ...row, kind: row.kind as FinancialDocumentKind };
}

export function toProjectWithProgress(
  row: ProjectRow,
  progress: ProjectProgressRow | undefined
): ProjectWithProgress {
  return {
    ...toProject(row),
    total_tasks: progress?.total_tasks ?? 0,
    done_tasks: progress?.done_tasks ?? 0,
    percent_done: progress?.percent_done ?? 0,
  };
}
