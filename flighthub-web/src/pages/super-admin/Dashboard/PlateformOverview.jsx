import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Activity,
  AlertCircle,
  Banknote,
  Building2,
  CheckCircle2,
  MapPin,
  Plane,
  RefreshCw,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/formateCurrency";
import {
  getAirlinePerformanceForSuperAdmin,
  getBookingStatisticsForSuperAdmin,
  getRoutePerformanceForSuperAdmin,
  getSuperAdminDashboardStats,
} from "@/Redux/booking/bookingThunk";

const monthLabel = (month = "") => {
  const [year, value] = String(month).split("-");
  if (!year || !value) return month || "—";
  return new Date(Number(year), Number(value) - 1).toLocaleDateString("en-US", {
    month: "short",
  });
};

const numberValue = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatNumber = (value) => numberValue(value).toLocaleString();
const formatPercent = (value) => `${numberValue(value).toFixed(1)}%`;

const PlatformOverview = ({ platformStats }) => {
  const dispatch = useDispatch();
  const {
    superAdminStatistics,
    superAdminStatisticsLoading,
    superAdminAirlinePerformance,
    superAdminAirlinePerformanceLoading,
    superAdminRoutePerformance,
    superAdminRoutePerformanceLoading,
    superAdminDashboardStats,
    superAdminDashboardStatsLoading,
    error,
  } = useSelector((store) => store.booking);

  const refresh = () => {
    dispatch(getBookingStatisticsForSuperAdmin());
    dispatch(getAirlinePerformanceForSuperAdmin());
    dispatch(getRoutePerformanceForSuperAdmin());
    dispatch(getSuperAdminDashboardStats());
  };

  useEffect(() => {
    refresh();
  }, [dispatch]);

  const monthlyData = useMemo(
    () => (Array.isArray(superAdminStatistics?.monthlyData) ? superAdminStatistics.monthlyData : []),
    [superAdminStatistics],
  );
  const revenueData = monthlyData.map((item) => ({
    month: monthLabel(item.month),
    bookings: numberValue(item.bookingCount),
    revenue: numberValue(item.revenue),
  }));
  const topAirlines = Array.isArray(superAdminAirlinePerformance?.topAirlinesByBookings)
    ? superAdminAirlinePerformance.topAirlinesByBookings
    : [];
  const topRoutes = Array.isArray(superAdminRoutePerformance?.topRoutesByBookings)
    ? superAdminRoutePerformance.topRoutesByBookings
    : [];

  const loading =
    superAdminStatisticsLoading ||
    superAdminAirlinePerformanceLoading ||
    superAdminRoutePerformanceLoading ||
    superAdminDashboardStatsLoading ||
    Boolean(platformStats?.loading);

  const kpi = {
    totalAirlines: platformStats?.totalAirlines,
    activeAirlines: platformStats?.activeAirlines,
    totalAirports: platformStats?.totalAirports,
    totalCities: platformStats?.totalCities,
    totalUsers: platformStats?.totalUsers,
    totalBookings: superAdminDashboardStats?.totalBookings,
    totalRevenue: superAdminDashboardStats?.totalRevenue,
    weeklyBookingGrowthPercent: superAdminDashboardStats?.weeklyBookingGrowthPercent,
    monthlyRevenueGrowthPercent: superAdminDashboardStats?.monthlyRevenueGrowthPercent,
    systemUptime: superAdminDashboardStats?.systemUptime,
    securityAlerts: superAdminDashboardStats?.securityAlerts ?? platformStats?.securityAlerts,
    failedNotifications: platformStats?.failedNotifications,
  };

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Platform Overview
            </h2>
            <p className="text-sm text-muted-foreground">
              Live platform KPIs from airline, network, booking, and notification services.
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={refresh} disabled={loading}>
          <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          Some dashboard widgets could not refresh: {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Airlines"
          value={loading ? "…" : formatNumber(kpi.totalAirlines)}
          detail={`${formatNumber(kpi.activeAirlines)} active airlines`}
          icon={Building2}
          tone="violet"
        />
        <MetricCard
          label="Confirmed Bookings"
          value={loading ? "…" : formatNumber(kpi.totalBookings)}
          detail={`${formatPercent(kpi.weeklyBookingGrowthPercent)} weekly change`}
          icon={Users}
          tone="emerald"
        />
        <MetricCard
          label="Platform Revenue"
          value={loading ? "…" : formatCurrency(kpi.totalRevenue)}
          detail={`${formatPercent(kpi.monthlyRevenueGrowthPercent)} monthly change`}
          icon={Banknote}
          tone="amber"
        />
        <MetricCard
          label="Network Data"
          value={loading ? "…" : formatNumber(kpi.totalAirports)}
          detail={`${formatNumber(kpi.totalCities)} cities connected`}
          icon={MapPin}
          tone="blue"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <HealthCard
          label="System Uptime"
          value={formatPercent(kpi.systemUptime)}
          detail="Reported by platform dashboard stats"
          icon={CheckCircle2}
          tone="emerald"
        />
        <HealthCard
          label="Security Alerts"
          value={formatNumber(kpi.securityAlerts)}
          detail="Current platform alert count"
          icon={Shield}
          tone="red"
        />
        <HealthCard
          label="Failed Notifications"
          value={formatNumber(kpi.failedNotifications)}
          detail="Delivery failures from notification overview"
          icon={AlertCircle}
          tone="amber"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="border-b border-border">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-primary" />
                Revenue & Bookings Trend
              </CardTitle>
              <Badge variant="outline">Last 12 months</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {superAdminStatisticsLoading ? (
              <LoadingPanel label="Loading booking trend..." height="h-[300px]" />
            ) : revenueData.length === 0 ? (
              <EmptyPanel label="No confirmed booking trend data yet." height="h-[300px]" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="platformRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis yAxisId="revenue" tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(value)} width={78} />
                  <YAxis yAxisId="bookings" orientation="right" tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(value, name) => [
                      name === "revenue" ? formatCurrency(value) : formatNumber(value),
                      name === "revenue" ? "Revenue" : "Bookings",
                    ]}
                  />
                  <Area yAxisId="revenue" type="monotone" dataKey="revenue" stroke="#2563eb" fill="url(#platformRevenue)" strokeWidth={2} />
                  <Area yAxisId="bookings" type="monotone" dataKey="bookings" stroke="#7c3aed" fill="transparent" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-violet-600" />
              Top Airlines
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {superAdminAirlinePerformanceLoading ? (
              <LoadingPanel label="Loading airline performance..." height="h-[300px]" />
            ) : topAirlines.length === 0 ? (
              <EmptyPanel label="No airline performance data yet." height="h-[300px]" />
            ) : (
              <div className="space-y-4">
                {topAirlines.slice(0, 6).map((airline, index) => (
                  <RankRow
                    key={airline.airlineId || index}
                    rank={index + 1}
                    label={airline.airlineName || airline.airlineCode || `Airline #${airline.airlineId}`}
                    value={`${formatNumber(airline.totalBookings)} bookings`}
                    progress={progressValue(airline.totalBookings, topAirlines[0]?.totalBookings)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2 text-base">
              <Plane className="h-4 w-4 text-blue-600" />
              Top Routes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {superAdminRoutePerformanceLoading ? (
              <LoadingPanel label="Loading route performance..." height="h-[300px]" />
            ) : topRoutes.length === 0 ? (
              <EmptyPanel label="No route performance data yet." height="h-[300px]" />
            ) : (
              <div className="space-y-4">
                {topRoutes.slice(0, 7).map((route, index) => (
                  <RankRow
                    key={route.flightId || index}
                    rank={index + 1}
                    label={route.routeName || `${route.departureAirportCode} → ${route.arrivalAirportCode}`}
                    value={`${formatNumber(route.totalBookings)} bookings · ${formatCurrency(route.totalRevenue)}`}
                    progress={progressValue(route.totalBookings, topRoutes[0]?.totalBookings)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChartIcon className="h-4 w-4 text-emerald-600" />
              Airline Revenue Mix
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {superAdminAirlinePerformanceLoading ? (
              <LoadingPanel label="Loading revenue mix..." height="h-[300px]" />
            ) : topAirlines.length === 0 ? (
              <EmptyPanel label="No airline revenue mix yet." height="h-[300px]" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topAirlines.slice(0, 7)} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="airlineCode" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(value)} width={78} />
                  <Tooltip formatter={(value) => [formatCurrency(value), "Revenue"]} />
                  <Bar dataKey="totalRevenue" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const toneClasses = {
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-300",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
  red: "bg-red-500/10 text-red-600 dark:text-red-300",
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

const HealthCard = ({ label, value, detail, icon: Icon, tone }) => (
  <Card className="overflow-hidden">
    <CardContent className="flex items-center justify-between gap-4 p-4">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </div>
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-md", toneClasses[tone])}>
        <Icon className="h-5 w-5" />
      </div>
    </CardContent>
  </Card>
);

const RankRow = ({ rank, label, value, progress }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold">
        {rank}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{value}</p>
      </div>
    </div>
    <Progress value={progress} className="h-1.5" />
  </div>
);

const LoadingPanel = ({ label, height }) => (
  <div className={cn("flex items-center justify-center", height)}>
    <div className="text-center">
      <RefreshCw className="mx-auto mb-3 h-6 w-6 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  </div>
);

const EmptyPanel = ({ label, height }) => (
  <div className={cn("flex items-center justify-center rounded-md border border-dashed border-border bg-muted/30 text-sm text-muted-foreground", height)}>
    {label}
  </div>
);

const progressValue = (value, max) => {
  const current = numberValue(value);
  const top = numberValue(max, 1);
  return top <= 0 ? 0 : Math.round((current / top) * 100);
};

const BarChartIcon = TrendingUp;

export default PlatformOverview;
