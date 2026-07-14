"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import * as projectsService from "@/lib/services/projects";
import type { ProjectInput } from "@/lib/services/projects";
import { getTemplate } from "@/lib/services/templates";
import { createTasksFromTemplate } from "@/lib/services/tasks";

export async function createProjectAction(
  input: ProjectInput,
  templateId?: string
) {
  if (!input.name.trim()) throw new Error("Naam is verplicht");

  const supabase = await createClient();
  const project = await projectsService.createProject(supabase, input);

  if (templateId) {
    const template = await getTemplate(supabase, templateId);
    if (template) {
      await createTasksFromTemplate(supabase, project.id, template.tasks);
    }
  }

  revalidatePath("/projects");
  revalidatePath("/");
  revalidatePath("/board");
  revalidatePath("/list");
  return project;
}

export async function updateProjectAction(
  id: string,
  input: Partial<ProjectInput>
) {
  if (input.name !== undefined && !input.name.trim()) {
    throw new Error("Naam is verplicht");
  }

  const supabase = await createClient();
  const project = await projectsService.updateProject(supabase, id, input);
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  revalidatePath("/");
  return project;
}

export async function archiveProjectAction(id: string) {
  const supabase = await createClient();
  await projectsService.archiveProject(supabase, id);
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  revalidatePath("/");
}

export async function unarchiveProjectAction(id: string) {
  const supabase = await createClient();
  await projectsService.unarchiveProject(supabase, id);
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  revalidatePath("/");
}
