"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCurrency } from "@/lib/format";
import type { QuoteConversionStage } from "@/lib/services/financial-documents";

// Fixed per-status colors so a status always renders the same hue regardless
// of which subset of statuses is present in the data.
const STATUS_COLORS: Record<string, string> = {
  Open: "#2a78d6",
  Verzonden: "#1baf7a",
  Geaccepteerd: "#4a3aa7",
  Gefactureerd: "#008300",
  Afgewezen: "#e34948",
  Verlopen: "#eb6834",
};
const FALLBACK_COLOR = "#898781";

const chartConfig = { count: { label: "Offertes" } } satisfies ChartConfig;

export function QuoteConversionChart({ stages }: { stages: QuoteConversionStage[] }) {
  if (stages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Offerte-conversie</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nog geen offertes geïmporteerd.
          </p>
        </CardContent>
      </Card>
    );
  }

  const data = stages.map((s) => ({
    ...s,
    fill: STATUS_COLORS[s.status] ?? FALLBACK_COLOR,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Offerte-conversie</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-56 w-full">
          <BarChart data={data} layout="vertical" margin={{ left: 0 }}>
            <CartesianGrid horizontal={false} />
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="status"
              tickLine={false}
              axisLine={false}
              width={90}
              className="text-xs"
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, _name, item) => (
                    <span className="flex w-full justify-between gap-4">
                      <span className="text-muted-foreground">{item.payload.status}</span>
                      <span className="font-medium">
                        {value}x · {formatCurrency(item.payload.amount)}
                      </span>
                    </span>
                  )}
                />
              }
            />
            <Bar dataKey="count" radius={4}>
              {data.map((entry) => (
                <Cell key={entry.status} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
