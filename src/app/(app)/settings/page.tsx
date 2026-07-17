import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getUserSettings } from "@/lib/services/settings";
import { GoogleCalendarCard } from "@/components/settings/google-calendar-card";
import { WorkingHoursForm } from "@/components/settings/working-hours-form";
import { GoogleConnectStatus } from "@/components/settings/google-connect-status";

export default async function SettingsPage() {
  const supabase = await createClient();
  const settings = await getUserSettings(supabase);

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <Suspense fallback={null}>
        <GoogleConnectStatus />
      </Suspense>
      <div>
        <h1 className="text-2xl font-semibold">Instellingen</h1>
        <p className="text-sm text-muted-foreground">
          Koppel je agenda en stel je werkuren in voor de auto-planner.
        </p>
      </div>

      <GoogleCalendarCard isConnected={!!settings?.google_refresh_token} />
      <WorkingHoursForm settings={settings} />
    </div>
  );
}
