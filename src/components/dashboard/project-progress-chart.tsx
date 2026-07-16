"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

const chartConfig = {
  percent_done: { label: "Voortgang", color: "#256abf" },
} satisfies ChartConfig;

export function ProjectProgressChart({
  projects,
}: {
  projects: { id: string; name: string; percent_done: number }[];
}) {
  if (projects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Projectvoortgang</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-muted-foreground">
            Geen actieve projecten.
          </p>
        </CardContent>
      </Card>
    );
  }

  const data = [...projects]
    .sort((a, b) => b.percent_done - a.percent_done)
    .slice(0, 6);
  const height = Math.max(56 * data.length, 160);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Projectvoortgang</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} style={{ height }} className="w-full">
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 24 }}>
            <CartesianGrid horizontal={false} />
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis
              type="category"
              dataKey="name"
              tickLine={false}
              axisLine={false}
              width={130}
              className="text-xs"
              tickFormatter={(v: string) => (v.length > 18 ? `${v.slice(0, 17)}…` : v)}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, _name, item) => (
                    <span className="flex w-full justify-between gap-4">
                      <span className="text-muted-foreground">{item.payload.name}</span>
                      <span className="font-medium">{value}%</span>
                    </span>
                  )}
                />
              }
            />
            <Bar dataKey="percent_done" fill="var(--color-percent_done)" radius={4}>
              <LabelList
                dataKey="percent_done"
                position="right"
                className="fill-muted-foreground text-xs"
                formatter={(value?: React.ReactNode) => `${value}%`}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
