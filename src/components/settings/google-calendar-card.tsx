"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarCheck2, CalendarOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { disconnectGoogleAction, startGoogleConnectAction } from "@/app/(app)/settings/actions";

export function GoogleCalendarCard({ isConnected }: { isConnected: boolean }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleDisconnect() {
    setIsSubmitting(true);
    try {
      await disconnectGoogleAction();
      toast.success("Google-agenda ontkoppeld");
      router.refresh();
    } catch (error) {
      toast.error("Ontkoppelen mislukt", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <h3 className="font-medium">Google Agenda</h3>
          <p className="text-sm text-muted-foreground">
            Nodig voor &ldquo;plan mijn dag/week&rdquo; en om taken buiten Cockpit
            zichtbaar te maken.
          </p>
        </div>
        {isConnected ? (
          <CalendarCheck2 className="size-5 shrink-0 text-green-600 dark:text-green-400" />
        ) : (
          <CalendarOff className="size-5 shrink-0 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">
              Gekoppeld — geplande taken staan in de agenda &ldquo;Cockpit Taken&rdquo;.
            </p>
            <Button
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={handleDisconnect}
            >
              Ontkoppelen
            </Button>
          </div>
        ) : (
          <form action={startGoogleConnectAction}>
            <Button type="submit">Google Agenda koppelen</Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
