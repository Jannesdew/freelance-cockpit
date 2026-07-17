"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function GoogleConnectStatus() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("google_connected")) {
      toast.success("Google Agenda gekoppeld");
      router.replace("/settings");
    } else if (searchParams.get("google_error")) {
      toast.error("Koppelen mislukt", {
        description: "Probeer het opnieuw of controleer de OAuth-instellingen.",
      });
      router.replace("/settings");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
