import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { UserSettings } from "@/lib/types";

type Client = SupabaseClient<Database>;

export async function getUserSettings(client: Client): Promise<UserSettings | null> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Error("Niet ingelogd");

  const { data, error } = await client
    .from("user_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export type WorkingHoursInput = {
  working_hours_start: string;
  working_hours_end: string;
  working_days: number[];
  timezone: string;
};

export async function updateWorkingHours(
  client: Client,
  input: WorkingHoursInput
): Promise<void> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Error("Niet ingelogd");

  const { error } = await client
    .from("user_settings")
    .upsert({ user_id: user.id, ...input }, { onConflict: "user_id" });

  if (error) throw error;
}

export async function disconnectGoogleCalendar(client: Client): Promise<void> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Error("Niet ingelogd");

  const { error } = await client
    .from("user_settings")
    .update({
      google_refresh_token: null,
      google_access_token: null,
      google_token_expires_at: null,
      google_calendar_id: null,
    })
    .eq("user_id", user.id);

  if (error) throw error;
}
