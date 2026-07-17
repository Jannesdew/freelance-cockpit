import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureCockpitCalendar, exchangeCodeForTokens } from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  const settingsUrl = new URL("/settings", request.url);
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    settingsUrl.searchParams.set("google_error", "geweigerd");
    return NextResponse.redirect(settingsUrl);
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Niet ingelogd");

    const tokens = await exchangeCodeForTokens(code);
    const calendarId = await ensureCockpitCalendar(tokens.accessToken, null);

    const { error } = await supabase.from("user_settings").upsert(
      {
        user_id: user.id,
        google_refresh_token: tokens.refreshToken,
        google_access_token: tokens.accessToken,
        google_token_expires_at: tokens.expiresAt,
        google_calendar_id: calendarId,
      },
      { onConflict: "user_id" }
    );
    if (error) throw error;

    settingsUrl.searchParams.set("google_connected", "1");
    return NextResponse.redirect(settingsUrl);
  } catch {
    settingsUrl.searchParams.set("google_error", "koppelen_mislukt");
    return NextResponse.redirect(settingsUrl);
  }
}
