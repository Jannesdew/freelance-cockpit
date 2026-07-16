import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import type { FinancialSummary } from "@/lib/services/financial-documents";

export function FinancialSummaryWidget({ summary }: { summary: FinancialSummary }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Link href="/financials" className="hover:underline">
            Financieel overzicht
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Openstaand (facturen)</p>
            <p className="text-xl font-semibold">
              {formatCurrency(summary.invoicesOpenAmount)}
            </p>
            <p className="text-xs text-muted-foreground">
              {summary.invoicesOpenCount} {summary.invoicesOpenCount === 1 ? "factuur" : "facturen"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Betaald</p>
            <p className="text-xl font-semibold">
              {formatCurrency(summary.invoicesPaidAmount)}
            </p>
          </div>
        </div>

        {summary.quotesByStatus.length > 0 && (
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Offertes per status</p>
            <div className="flex flex-col gap-1">
              {summary.quotesByStatus.map((s) => (
                <div key={s.status} className="flex items-center justify-between text-sm">
                  <span>{s.status}</span>
                  <span className="text-muted-foreground">
                    {s.count}x · {formatCurrency(s.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
