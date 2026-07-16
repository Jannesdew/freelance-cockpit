"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { WeeklyCompletedCount } from "@/lib/services/tasks";

const chartConfig = {
  count: { label: "Afgerond", color: "#2a78d6" },
} satisfies ChartConfig;

export function CompletedTasksTrendChart({ data }: { data: WeeklyCompletedCount[] }) {
  const hasData = data.some((d) => d.count > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Afgeronde taken per week</CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ChartContainer config={chartConfig} className="h-56 w-full">
            <AreaChart data={data} margin={{ left: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} className="text-xs" />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={28}
                allowDecimals={false}
                className="text-xs"
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Area
                dataKey="count"
                type="monotone"
                stroke="var(--color-count)"
                strokeWidth={2}
                fill="var(--color-count)"
                fillOpacity={0.1}
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nog geen taken afgerond in deze periode.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
