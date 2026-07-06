import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  AlertCircle,
  Banknote,
  BarChart3,
  Calendar,
  Loader2,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/formateCurrency";
import { getBookingStatisticsForAirline } from "@/Redux/booking/bookingThunk";
import DailyBookingChart from "./DailyBookingChart";
import DailyRevenueChart from "./DailyRevenueChart";
import MonthlyBookingChart from "./MonthlyBookingChart";
import MonthlyRevenueChart from "./MonthlyRevenueChart";

const BookingStatisticsOverview = () => {
  const dispatch = useDispatch();
  const { statistics, loading, error } = useSelector((store) => store.booking);

  useEffect(() => {
    dispatch(getBookingStatisticsForAirline());
  }, [dispatch]);

  const dailyTrend = Array.isArray(statistics?.dailyTrend) ? statistics.dailyTrend : [];
  const monthlyData = Array.isArray(statistics?.monthlyData) ? statistics.monthlyData : [];
  const totals = useMemo(() => ({
    todayBookings: Number(statistics?.totalBookingsToday || 0),
    todayRevenue: Number(statistics?.revenueToday || 0),
    monthBookings: Number(statistics?.totalBookingsThisMonth || 0),
    monthRevenue: Number(statistics?.revenueThisMonth || 0),
  }), [statistics]);

  const refresh = () => dispatch(getBookingStatisticsForAirline());

  if (loading && !statistics) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading booking analytics...</p>
        </div>
      </div>
    );
  }

  if (error && !statistics) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          <AlertCircle className="mx-auto mb-4 h-8 w-8" />
          <p className="mb-4 text-sm font-medium">Error loading booking analytics: {error}</p>
          <Button onClick={refresh}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Booking Analytics
            </h2>
            <p className="text-sm text-muted-foreground">
              Track confirmed booking volume, revenue, and trend quality for this airline.
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={refresh} disabled={loading}>
          <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Today's Bookings"
          value={totals.todayBookings.toLocaleString()}
          detail="Confirmed bookings today"
          icon={Calendar}
          tone="blue"
        />
        <MetricCard
          label="Today's Revenue"
          value={formatCurrency(totals.todayRevenue)}
          detail="Confirmed revenue today"
          icon={Banknote}
          tone="emerald"
        />
        <MetricCard
          label="Monthly Bookings"
          value={totals.monthBookings.toLocaleString()}
          detail="Confirmed bookings this month"
          icon={TrendingUp}
          tone="amber"
        />
        <MetricCard
          label="Monthly Revenue"
          value={formatCurrency(totals.monthRevenue)}
          detail="Confirmed revenue this month"
          icon={BarChart3}
          tone="violet"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <DailyBookingChart data={dailyTrend} />
        <DailyRevenueChart data={dailyTrend} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <MonthlyBookingChart data={monthlyData} />
        <MonthlyRevenueChart data={monthlyData} />
      </div>
    </div>
  );
};

const toneClasses = {
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-300",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
};

const MetricCard = ({ label, value, detail, icon: Icon, tone }) => (
  <Card className="overflow-hidden">
    <CardContent className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 truncate text-2xl font-semibold text-foreground">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
        </div>
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-md", toneClasses[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default BookingStatisticsOverview;
