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
import { formatDate } from "@/utils/formateDate";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

const chartConfig = {
  bookingCount: {
    label: "Bookings",
    color: "hsl(var(--chart-1))",
  },
};

const DailyBookingChart = ({ data = [] }) => {
  const hasData = data.length > 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Daily Bookings</CardTitle>
        <CardDescription>Confirmed bookings across the last 30 days.</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <AreaChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fillBookingCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-bookingCount)" stopOpacity={0.75} />
                  <stop offset="95%" stopColor="var(--color-bookingCount)" stopOpacity={0.08} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
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
                tickFormatter={(value) => value.toLocaleString()}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent labelFormatter={formatDate} indicator="line" />}
              />
              <Area
                type="monotone"
                dataKey="bookingCount"
                stroke="var(--color-bookingCount)"
                fill="url(#fillBookingCount)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <EmptyChartState />
        )}
      </CardContent>
    </Card>
  );
};

const EmptyChartState = () => (
  <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
    No daily booking data yet.
  </div>
);

export default DailyBookingChart;
