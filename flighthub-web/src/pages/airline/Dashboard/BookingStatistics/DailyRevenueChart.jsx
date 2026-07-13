import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatCurrency } from "@/utils/formateCurrency";
import { formatDate } from "@/utils/formateDate";
import { LineChart as LineChartIcon } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

const chartConfig = {
  revenue: {
    label: "Revenue",
    theme: {
      light: "#059669",
      dark: "#34d399",
    },
  },
};

const DailyRevenueChart = ({ data = [] }) => {
  const hasData = data.length > 0;

  return (
    <Card className="overflow-hidden border-border/70 bg-card/85 shadow-sm backdrop-blur">
      <CardHeader className="border-b border-border/70">
        <CardTitle className="flex items-center gap-2 text-base">
          <LineChartIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
          Daily Revenue
        </CardTitle>
        <CardDescription>Confirmed booking value across the last 30 days.</CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        {hasData ? (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <LineChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => formatCurrency(value)}
                width={72}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={formatDate}
                    formatter={(value) => [formatCurrency(value), "Revenue"]}
                    indicator="line"
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="var(--color-revenue)"
                strokeWidth={2}
                dot={{ fill: "var(--color-revenue)" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ChartContainer>
        ) : (
          <EmptyChartState />
        )}
      </CardContent>
    </Card>
  );
};

const EmptyChartState = () => (
  <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
    No daily revenue data yet.
  </div>
);

export default DailyRevenueChart;
