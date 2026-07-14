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

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
type ProjectProgressRow = Database["public"]["Views"]["project_progress"]["Row"];

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
