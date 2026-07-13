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
import { formatMonth } from "@/utils/formateMonth";
import { BarChart3 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

const chartConfig = {
  bookingCount: {
    label: "Bookings",
    theme: {
      light: "#7c3aed",
      dark: "#a78bfa",
    },
  },
};

const MonthlyBookingChart = ({ data = [] }) => {
  const hasData = data.length > 0;

  return (
    <Card className="overflow-hidden border-border/70 bg-card/85 shadow-sm backdrop-blur">
      <CardHeader className="border-b border-border/70">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4 text-violet-600 dark:text-violet-300" />
          Monthly Bookings
        </CardTitle>
        <CardDescription>Confirmed booking volume across the last 12 months.</CardDescription>
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
                tickFormatter={(value) => value.toLocaleString()}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent labelFormatter={formatMonth} indicator="line" />}
              />
              <Bar dataKey="bookingCount" fill="var(--color-bookingCount)" radius={[6, 6, 0, 0]} />
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
    No monthly booking data yet.
  </div>
);

export default MonthlyBookingChart;
