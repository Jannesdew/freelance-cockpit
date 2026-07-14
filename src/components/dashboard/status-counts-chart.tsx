"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { TASK_STATUSES, TASK_STATUS_LABELS, type TaskStatus } from "@/lib/types";

const STATUS_COLORS: Record<TaskStatus, string> = {
  backlog: "#a1a1aa",
  todo: "#3b82f6",
  doing: "#8b5cf6",
  feedback: "#f59e0b",
  done: "#22c55e",
};

const chartConfig = {
  count: { label: "Taken" },
} satisfies ChartConfig;

export function StatusCountsChart({
  counts,
}: {
  counts: Record<TaskStatus, number>;
}) {
  const data = TASK_STATUSES.map((status) => ({
    status,
    label: TASK_STATUS_LABELS[status],
    count: counts[status],
    fill: STATUS_COLORS[status],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Taken per status</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-48 w-full">
          <BarChart data={data} layout="vertical" margin={{ left: 0 }}>
            <CartesianGrid horizontal={false} />
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="label"
              tickLine={false}
              axisLine={false}
              width={70}
              className="text-xs"
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
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
