"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import * as projectsService from "@/lib/services/projects";
import type { ProjectInput } from "@/lib/services/projects";

export async function createProjectAction(input: ProjectInput) {
  if (!input.name.trim()) throw new Error("Naam is verplicht");

  const supabase = await createClient();
  const project = await projectsService.createProject(supabase, input);
  revalidatePath("/projects");
  revalidatePath("/");
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
