const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const CALENDAR_API_URL = "https://www.googleapis.com/calendar/v3";
const COCKPIT_CALENDAR_NAME = "Cockpit Taken";

function getClientId() {
  return process.env.GOOGLE_CLIENT_ID!;
}
function getClientSecret() {
  return process.env.GOOGLE_CLIENT_SECRET!;
}
function getRedirectUri() {
  return process.env.GOOGLE_REDIRECT_URI!;
}

export function getGoogleAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: getClientId(),
    redirect_uri: getRedirectUri(),
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: "https://www.googleapis.com/auth/calendar",
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export type GoogleTokens = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string;
};

export async function exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: getClientId(),
      client_secret: getClientSecret(),
      redirect_uri: getRedirectUri(),
      code,
      grant_type: "authorization_code",
    }),
  });
  if (!response.ok) throw new Error(`Google token exchange mislukt: ${await response.text()}`);

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
  };
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; expiresAt: string }> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: getClientId(),
      client_secret: getClientSecret(),
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!response.ok) throw new Error(`Google token refresh mislukt: ${await response.text()}`);

  const data = await response.json();
  return {
    accessToken: data.access_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
  };
}

async function callCalendarApi(accessToken: string, path: string, init?: RequestInit) {
  const response = await fetch(`${CALENDAR_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`Google Calendar API-fout (${response.status}): ${await response.text()}`);
  }
  return response.status === 204 ? null : response.json();
}

// Cockpit keeps its scheduled task-blocks in a dedicated secondary calendar
// (rather than the user's primary one) so they can be shown/hidden/wiped
// independently of personal events.
export async function ensureCockpitCalendar(
  accessToken: string,
  existingCalendarId: string | null
): Promise<string> {
  if (existingCalendarId) {
    try {
      await callCalendarApi(accessToken, `/calendars/${existingCalendarId}`);
      return existingCalendarId;
    } catch {
      // Calendar was deleted on the Google side — fall through and recreate it.
    }
  }

  const created = await callCalendarApi(accessToken, "/calendars", {
    method: "POST",
    body: JSON.stringify({ summary: COCKPIT_CALENDAR_NAME }),
  });
  return created.id;
}

export type BusyBlock = { start: string; end: string };

export async function queryFreeBusy(
  accessToken: string,
  calendarIds: string[],
  range: { from: string; to: string }
): Promise<BusyBlock[]> {
  const data = await callCalendarApi(accessToken, "/freeBusy", {
    method: "POST",
    body: JSON.stringify({
      timeMin: range.from,
      timeMax: range.to,
      items: calendarIds.map((id) => ({ id })),
    }),
  });

  const blocks: BusyBlock[] = [];
  for (const calendarId of calendarIds) {
    const busy = data.calendars?.[calendarId]?.busy ?? [];
    for (const block of busy) {
      blocks.push({ start: block.start, end: block.end });
    }
  }
  return blocks;
}

export async function createCalendarEvent(
  accessToken: string,
  calendarId: string,
  event: { title: string; start: string; end: string }
): Promise<string> {
  const created = await callCalendarApi(
    accessToken,
    `/calendars/${calendarId}/events`,
    {
      method: "POST",
      body: JSON.stringify({
        summary: event.title,
        start: { dateTime: event.start },
        end: { dateTime: event.end },
      }),
    }
  );
  return created.id;
}

export async function updateCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  event: { title: string; start: string; end: string }
): Promise<void> {
  await callCalendarApi(accessToken, `/calendars/${calendarId}/events/${eventId}`, {
    method: "PATCH",
    body: JSON.stringify({
      summary: event.title,
      start: { dateTime: event.start },
      end: { dateTime: event.end },
    }),
  });
}

export async function deleteCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<void> {
  try {
    await callCalendarApi(accessToken, `/calendars/${calendarId}/events/${eventId}`, {
      method: "DELETE",
    });
  } catch {
    // Already deleted on the Google side (e.g. removed manually) — nothing to clean up.
  }
}
