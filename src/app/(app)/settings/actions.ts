"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getGoogleAuthUrl } from "@/lib/google-calendar";
import {
  disconnectGoogleCalendar,
  updateWorkingHours,
  type WorkingHoursInput,
} from "@/lib/services/settings";

export async function startGoogleConnectAction() {
  redirect(getGoogleAuthUrl());
}

export async function disconnectGoogleAction() {
  const supabase = await createClient();
  await disconnectGoogleCalendar(supabase);
  revalidatePath("/settings");
}

export async function updateWorkingHoursAction(input: WorkingHoursInput) {
  const supabase = await createClient();
  await updateWorkingHours(supabase, input);
  revalidatePath("/settings");
  revalidatePath("/agenda");
}
