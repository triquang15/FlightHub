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
import { formatMonth } from "@/utils/formateMonth";
import { Banknote } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

const chartConfig = {
  revenue: {
    label: "Revenue",
    theme: {
      light: "#d97706",
      dark: "#fbbf24",
    },
  },
};

const MonthlyRevenueChart = ({ data = [] }) => {
  const hasData = data.length > 0;

  return (
    <Card className="overflow-hidden border-border/70 bg-card/85 shadow-sm backdrop-blur">
      <CardHeader className="border-b border-border/70">
        <CardTitle className="flex items-center gap-2 text-base">
          <Banknote className="h-4 w-4 text-amber-600 dark:text-amber-300" />
          Monthly Revenue
        </CardTitle>
        <CardDescription>Confirmed booking value across the last 12 months.</CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        {hasData ? (
          <ChartContainer config={chartConfig} className="h-[330px] w-full">
            <BarChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="month"
                tickFormatter={formatMonth}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
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
                    labelFormatter={formatMonth}
                    formatter={(value) => [formatCurrency(value), "Revenue"]}
                    indicator="line"
                  />
                }
              />
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartContainer>
        ) : (
          <EmptyChartState />
        )}
      </CardContent>
    </Card>
  );
};

const EmptyChartState = () => (
  <div className="flex h-[330px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
    No monthly revenue data yet.
  </div>
);

export default MonthlyRevenueChart;
