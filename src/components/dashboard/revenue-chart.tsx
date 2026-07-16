"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCurrency } from "@/lib/format";
import type { MonthlyRevenue } from "@/lib/services/financial-documents";

const chartConfig = {
  paid: { label: "Betaald", color: "#0ca30c" },
  open: { label: "Openstaand", color: "#fab219" },
} satisfies ChartConfig;

export function RevenueChart({ data }: { data: MonthlyRevenue[] }) {
  const hasData = data.some((d) => d.paid > 0 || d.open > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Omzet per maand</CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ChartContainer config={chartConfig} className="h-56 w-full">
            <BarChart data={data} margin={{ left: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} className="text-xs" />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={44}
                className="text-xs"
                tickFormatter={(v) => `€${Math.round(v / 100) / 10}k`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <span className="flex w-full justify-between gap-4">
                        <span className="text-muted-foreground">
                          {name === "paid" ? "Betaald" : "Openstaand"}
                        </span>
                        <span className="font-medium">{formatCurrency(Number(value))}</span>
                      </span>
                    )}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="paid"
                stackId="revenue"
                fill="var(--color-paid)"
                stroke="var(--card)"
                strokeWidth={2}
                radius={[0, 0, 4, 4]}
              />
              <Bar
                dataKey="open"
                stackId="revenue"
                fill="var(--color-open)"
                stroke="var(--card)"
                strokeWidth={2}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nog geen facturen geïmporteerd.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
