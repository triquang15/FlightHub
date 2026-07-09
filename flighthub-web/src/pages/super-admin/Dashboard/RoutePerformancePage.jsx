import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Activity,
  ArrowRight,
  BarChart3,
  DollarSign,
  Gauge,
  Plane,
  RefreshCw,
  Route,
  Trophy,
  Users,
} from "lucide-react";
import { getRoutePerformanceForSuperAdmin } from "@/Redux/booking/bookingThunk";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const asArray = (value) => (Array.isArray(value) ? value : []);

const numberValue = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(numberValue(value));

const formatNumber = (value) => numberValue(value).toLocaleString("en-US");

const routeLabel = (route) =>
  route?.routeName ||
  route?.route ||
  `${route?.departureAirportCode || "-"} -> ${route?.arrivalAirportCode || "-"}`;

const progressValue = (value, max) => {
  const top = numberValue(max, 1);
  return top <= 0 ? 0 : Math.min(100, Math.round((numberValue(value) / top) * 100));
};

const getRouteKey = (route, index) => `${route?.flightId || routeLabel(route)}-${index}`;

const RoutePerformancePage = () => {
  const dispatch = useDispatch();
  const { superAdminRoutePerformance, superAdminRoutePerformanceLoading } = useSelector(
    (store) => store.booking
  );

  const refresh = () => dispatch(getRoutePerformanceForSuperAdmin());

  useEffect(() => {
    refresh();
  }, [dispatch]);

  const routesByBookings = useMemo(
    () => asArray(superAdminRoutePerformance?.topRoutesByBookings),
    [superAdminRoutePerformance]
  );

  const routesByRevenue = useMemo(() => {
    const revenueRoutes = asArray(superAdminRoutePerformance?.topRoutesByRevenue);
    if (revenueRoutes.length > 0) return revenueRoutes;
    return [...routesByBookings].sort(
      (a, b) => numberValue(b.totalRevenue) - numberValue(a.totalRevenue)
    );
  }, [superAdminRoutePerformance, routesByBookings]);

  const rows = routesByBookings.length > 0 ? routesByBookings : routesByRevenue;
  const hasData = rows.length > 0;

  const totalRoutes = new Set([...routesByBookings, ...routesByRevenue].map(routeLabel)).size;
  const totalBookings = routesByBookings.reduce(
    (sum, route) => sum + numberValue(route.totalBookings),
    0
  );
  const totalRevenue = routesByRevenue.reduce(
    (sum, route) => sum + numberValue(route.totalRevenue),
    0
  );
  const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
  const maxBookings = Math.max(...rows.map((route) => numberValue(route.totalBookings)), 1);
  const maxRevenue = Math.max(...routesByRevenue.map((route) => numberValue(route.totalRevenue)), 1);
  const strongestRoute = rows[0];
  const highestRevenueRoute = routesByRevenue[0];

  if (superAdminRoutePerformanceLoading) {
    return (
      <div className="flex min-h-[460px] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading route performance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-max min-w-[1200px] max-w-none space-y-6 p-6">
      <section className="overflow-hidden rounded-lg border bg-card">
        <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Route className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  Route Performance
                </h1>
                <Badge variant="outline">Analytics</Badge>
              </div>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Monitor demand, revenue contribution, and average booking value by route.
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={refresh} disabled={superAdminRoutePerformanceLoading}>
            <RefreshCw
              className={cn("mr-2 h-4 w-4", superAdminRoutePerformanceLoading && "animate-spin")}
            />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 border-t bg-muted/20 md:grid-cols-2 xl:grid-cols-4">
          <MetricBlock
            label="Active Routes"
            value={formatNumber(totalRoutes)}
            detail="Confirmed route pairs"
            icon={Plane}
          />
          <MetricBlock
            label="Bookings"
            value={formatNumber(totalBookings)}
            detail="Confirmed bookings"
            icon={Users}
          />
          <MetricBlock
            label="Revenue"
            value={formatCurrency(totalRevenue)}
            detail="USD booking value"
            icon={DollarSign}
          />
          <MetricBlock
            label="Average Value"
            value={formatCurrency(averageBookingValue)}
            detail="Revenue per booking"
            icon={Gauge}
          />
        </div>
      </section>

      {!hasData ? (
        <EmptyState
          title="No route analytics yet"
          description="Confirmed bookings are required before route ranking and revenue contribution can be calculated."
        />
      ) : (
        <>
          <section className="grid grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)] gap-5">
            <RouteBoard
              rows={rows.slice(0, 7)}
              maxBookings={maxBookings}
              strongestRoute={strongestRoute}
            />
            <RevenuePanel
              rows={routesByRevenue.slice(0, 6)}
              maxRevenue={maxRevenue}
              highestRevenueRoute={highestRevenueRoute}
            />
          </section>

          <RouteRankingTable rows={rows} maxBookings={maxBookings} />
        </>
      )}
    </div>
  );
};

const MetricBlock = ({ label, value, detail, icon: Icon }) => (
  <div className="flex min-w-0 items-center justify-between gap-4 border-b border-r p-4 last:border-r-0 md:[&:nth-child(2n)]:border-r-0 xl:[&:nth-child(2n)]:border-r xl:[&:nth-child(4n)]:border-r-0">
    <div className="min-w-0">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-2xl font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
      <Icon className="h-5 w-5" />
    </div>
  </div>
);

const EmptyState = ({ title, description }) => (
  <div className="flex min-h-[320px] flex-col items-center justify-center rounded-lg border border-dashed bg-card p-8 text-center">
    <Activity className="h-10 w-10 text-muted-foreground" />
    <p className="mt-3 font-medium text-foreground">{title}</p>
    <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
  </div>
);

const RouteBoard = ({ rows, maxBookings, strongestRoute }) => (
  <Card className="overflow-hidden">
    <CardContent className="p-0">
      <div className="border-b p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Demand Map
            </p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">
              Route demand ranking
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Highest confirmed booking volume across the platform.
            </p>
          </div>
          {strongestRoute && (
            <div className="rounded-md border bg-muted/25 px-4 py-3">
              <p className="text-xs text-muted-foreground">Leader</p>
              <div className="mt-1 flex items-center gap-2 font-semibold">
                <RouteCode code={strongestRoute.departureAirportCode} compact />
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                <RouteCode code={strongestRoute.arrivalAirportCode} compact />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="divide-y">
        {rows.map((route, index) => (
          <RouteDemandRow
            key={getRouteKey(route, index)}
            route={route}
            index={index}
            maxBookings={maxBookings}
          />
        ))}
      </div>
    </CardContent>
  </Card>
);

const RouteDemandRow = ({ route, index, maxBookings }) => {
  const bookings = numberValue(route.totalBookings);
  const demand = progressValue(bookings, maxBookings);

  return (
    <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-[64px_minmax(240px,0.9fr)_minmax(260px,1.1fr)_160px] lg:items-center">
      <div className="flex items-center gap-3 lg:block">
        <RankBadge index={index} />
        <span className="text-xs text-muted-foreground lg:hidden">Rank {index + 1}</span>
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <RouteCode code={route.departureAirportCode} />
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <RouteCode code={route.arrivalAirportCode} />
          <Badge variant="secondary">{route.flightNumber || "N/A"}</Badge>
        </div>
        <p className="mt-2 truncate text-sm text-muted-foreground">{routeLabel(route)}</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Booking demand</span>
          <span>{demand}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${demand}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:text-right">
        <div>
          <p className="text-xs text-muted-foreground">Bookings</p>
          <p className="font-semibold text-foreground">{formatNumber(route.totalBookings)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Revenue</p>
          <p className="font-semibold text-foreground">{formatCurrency(route.totalRevenue)}</p>
        </div>
      </div>
    </div>
  );
};

const RevenuePanel = ({ rows, maxRevenue, highestRevenueRoute }) => (
  <Card className="overflow-hidden">
    <CardContent className="p-0">
      <div className="border-b p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500">
          Commercial View
        </p>
        <h2 className="mt-2 text-xl font-semibold text-foreground">Revenue contribution</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Route value ranked by confirmed booking revenue.
        </p>
      </div>

      {highestRevenueRoute && (
        <div className="border-b bg-emerald-500/5 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Top revenue route</p>
              <div className="mt-2 flex items-center gap-2">
                <RouteCode code={highestRevenueRoute.departureAirportCode} />
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <RouteCode code={highestRevenueRoute.arrivalAirportCode} />
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold text-foreground">
                {formatCurrency(highestRevenueRoute.totalRevenue)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatNumber(highestRevenueRoute.totalBookings)} bookings
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4 p-5">
        {rows.map((route, index) => {
          const revenueShare = progressValue(route.totalRevenue, maxRevenue);
          return (
            <div key={getRouteKey(route, index)} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {route.departureAirportCode || "-"} to {route.arrivalAirportCode || "-"}
                  </p>
                  <p className="text-xs text-muted-foreground">{route.flightNumber || "N/A"}</p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-foreground">
                  {formatCurrency(route.totalRevenue)}
                </p>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${revenueShare}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </CardContent>
  </Card>
);

const RouteRankingTable = ({ rows, maxBookings }) => (
  <Card className="overflow-hidden">
    <CardContent className="p-0">
      <div className="flex flex-col gap-2 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Route Ledger
          </p>
          <h2 className="mt-2 text-xl font-semibold text-foreground">Performance details</h2>
        </div>
        <Badge variant="outline">{rows.length} ranked routes</Badge>
      </div>

      <div className="overflow-x-auto">
        <Table className="min-w-[1040px]">
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[72px]">Rank</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Flight</TableHead>
              <TableHead className="text-right">Bookings</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Avg Value</TableHead>
              <TableHead className="w-[180px]">Demand</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((route, index) => (
              <TableRow key={getRouteKey(route, index)}>
                <TableCell>
                  <RankBadge index={index} compact />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 font-medium">
                    <span>{route.departureAirportCode || "-"}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{route.arrivalAirportCode || "-"}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{routeLabel(route)}</p>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{route.flightNumber || "N/A"}</Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatNumber(route.totalBookings)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(route.totalRevenue)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(route.averageRevenuePerBooking)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={progressValue(route.totalBookings, maxBookings)}
                      className="h-1.5"
                    />
                    <span className="w-9 text-right text-xs text-muted-foreground">
                      {progressValue(route.totalBookings, maxBookings)}%
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>
);

const RouteCode = ({ code, compact = false }) => (
  <span
    className={cn(
      "inline-flex items-center justify-center rounded-md bg-primary/10 font-semibold text-primary",
      compact ? "min-w-[48px] px-2 py-1 text-sm" : "min-w-[58px] px-3 py-1.5 text-sm"
    )}
  >
    {code || "-"}
  </span>
);

const RankBadge = ({ index, compact = false }) => (
  <span
    className={cn(
      "inline-flex items-center justify-center rounded-md font-semibold",
      compact ? "h-8 w-8 text-sm" : "h-10 w-10 text-base",
      index < 3
        ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
        : "bg-muted text-muted-foreground"
    )}
  >
    {index === 0 ? <Trophy className="h-4 w-4" /> : index + 1}
  </span>
);

export default RoutePerformancePage;
