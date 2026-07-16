"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { importFinancialDocumentsAction } from "@/app/(app)/financials/actions";

export function ImportForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData(event.currentTarget);
      const count = await importFinancialDocumentsAction(formData);
      toast.success(`${count} document(en) geïmporteerd`);
      formRef.current?.reset();
      router.refresh();
    } catch (error) {
      toast.error("Importeren mislukt", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Importeren vanuit DigiBoox</CardTitle>
        <CardDescription>
          Exporteer facturen en/of offertes als Excel-bestand (knop &quot;Exporteer&quot; in
          DigiBoox) en upload ze hier. Relaties worden automatisch aan projecten gekoppeld op
          basis van de klantnaam.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="invoiceFile">Facturen (.xlsx)</Label>
              <Input id="invoiceFile" name="invoiceFile" type="file" accept=".xlsx" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="quoteFile">Offertes (.xlsx)</Label>
              <Input id="quoteFile" name="quoteFile" type="file" accept=".xlsx" />
            </div>
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-fit">
            <Upload />
            {isSubmitting ? "Bezig..." : "Importeren"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
