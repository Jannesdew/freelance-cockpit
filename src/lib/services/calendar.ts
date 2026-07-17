import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { toTask, type Task } from "@/lib/types";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  queryFreeBusy,
  refreshAccessToken,
  updateCalendarEvent,
  type BusyBlock,
} from "@/lib/google-calendar";

type Client = SupabaseClient<Database>;

const TOKEN_REFRESH_MARGIN_MS = 2 * 60 * 1000;

async function getValidGoogleAccessToken(
  client: Client,
  userId: string
): Promise<{ accessToken: string; calendarId: string }> {
  const { data: settings, error } = await client
    .from("user_settings")
    .select("google_refresh_token, google_access_token, google_token_expires_at, google_calendar_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!settings?.google_refresh_token || !settings.google_calendar_id) {
    throw new Error("Geen Google-agenda gekoppeld. Verbind deze eerst bij Instellingen.");
  }

  const expiresAt = settings.google_token_expires_at
    ? new Date(settings.google_token_expires_at).getTime()
    : 0;

  if (settings.google_access_token && expiresAt - Date.now() > TOKEN_REFRESH_MARGIN_MS) {
    return { accessToken: settings.google_access_token, calendarId: settings.google_calendar_id };
  }

  const refreshed = await refreshAccessToken(settings.google_refresh_token);
  const { error: updateError } = await client
    .from("user_settings")
    .update({
      google_access_token: refreshed.accessToken,
      google_token_expires_at: refreshed.expiresAt,
    })
    .eq("user_id", userId);
  if (updateError) throw updateError;

  return { accessToken: refreshed.accessToken, calendarId: settings.google_calendar_id };
}

export async function getBusyBlocks(
  client: Client,
  range: { from: string; to: string }
): Promise<BusyBlock[]> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Error("Niet ingelogd");

  const { accessToken, calendarId } = await getValidGoogleAccessToken(client, user.id);
  return queryFreeBusy(accessToken, ["primary", calendarId], range);
}

export async function scheduleTask(
  client: Client,
  taskId: string,
  start: string,
  end: string
): Promise<Task> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Error("Niet ingelogd");

  const { data: taskRow, error: taskError } = await client
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .single();
  if (taskError) throw taskError;

  const { accessToken, calendarId } = await getValidGoogleAccessToken(client, user.id);

  const googleEventId = taskRow.google_event_id
    ? await updateCalendarEvent(accessToken, calendarId, taskRow.google_event_id, {
        title: taskRow.title,
        start,
        end,
      }).then(() => taskRow.google_event_id!)
    : await createCalendarEvent(accessToken, calendarId, { title: taskRow.title, start, end });

  const { data, error } = await client
    .from("tasks")
    .update({ scheduled_start: start, scheduled_end: end, google_event_id: googleEventId })
    .eq("id", taskId)
    .select()
    .single();

  if (error) throw error;
  return toTask(data);
}

export async function unscheduleTask(client: Client, taskId: string): Promise<Task> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Error("Niet ingelogd");

  const { data: taskRow, error: taskError } = await client
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .single();
  if (taskError) throw taskError;

  if (taskRow.google_event_id) {
    try {
      const { accessToken, calendarId } = await getValidGoogleAccessToken(client, user.id);
      await deleteCalendarEvent(accessToken, calendarId, taskRow.google_event_id);
    } catch {
      // Best-effort: if the Google connection is broken, still clear the
      // local schedule rather than blocking the user from unscheduling.
    }
  }

  const { data, error } = await client
    .from("tasks")
    .update({ scheduled_start: null, scheduled_end: null, google_event_id: null })
    .eq("id", taskId)
    .select()
    .single();

  if (error) throw error;
  return toTask(data);
}
