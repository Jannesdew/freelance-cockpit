"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import * as templatesService from "@/lib/services/templates";
import type { TemplateInput } from "@/lib/services/templates";

function assertValidTemplate(input: Partial<TemplateInput>) {
  if (input.name !== undefined && !input.name.trim()) {
    throw new Error("Naam is verplicht");
  }
  if (input.tasks) {
    for (const task of input.tasks) {
      if (!task.title.trim()) {
        throw new Error("Elke taak moet een titel hebben");
      }
    }
  }
}

export async function createTemplateAction(input: TemplateInput) {
  assertValidTemplate(input);
  const supabase = await createClient();
  const template = await templatesService.createTemplate(supabase, input);
  revalidatePath("/templates");
  return template;
}

export async function updateTemplateAction(
  id: string,
  input: Partial<TemplateInput>
) {
  assertValidTemplate(input);
  const supabase = await createClient();
  const template = await templatesService.updateTemplate(supabase, id, input);
  revalidatePath("/templates");
  return template;
}

export async function deleteTemplateAction(id: string) {
  const supabase = await createClient();
  await templatesService.deleteTemplate(supabase, id);
  revalidatePath("/templates");
}
