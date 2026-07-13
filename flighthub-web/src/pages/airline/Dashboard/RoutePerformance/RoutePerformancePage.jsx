import React from "react";
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

import { getRoutePerformanceForAirline } from "@/Redux/booking/bookingThunk";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const formatNumber = (value) => new Intl.NumberFormat("en-US").format(numberValue(value));

const routeCode = (route) =>
  route?.routeName ||
  route?.route ||
  `${route?.departureAirportCode || "--"} to ${route?.arrivalAirportCode || "--"}`;

const routeCities = (route) =>
  [route?.departureAirportName, route?.arrivalAirportName].filter(Boolean).join(" to ") ||
  route?.flightNumber ||
  "Route detail unavailable";

const progressValue = (value, max) => {
  const top = numberValue(max, 1);
  return top <= 0 ? 0 : Math.min(100, Math.round((numberValue(value) / top) * 100));
};

const mergeRoutes = (...lists) => {
  const rows = new Map();
  lists.flat().forEach((route) => {
    if (!route) return;
    const key = route?.flightId || routeCode(route);
    rows.set(key, { ...(rows.get(key) || {}), ...route });
  });
  return Array.from(rows.values()).sort(
    (a, b) =>
      numberValue(b.totalBookings) - numberValue(a.totalBookings) ||
      numberValue(b.totalRevenue) - numberValue(a.totalRevenue)
  );
};

const MetricCard = ({ icon: Icon, label, value, detail, tone = "primary" }) => {
  const tones = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    sky: "bg-sky-500/10 text-sky-600 dark:text-sky-300",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
  };

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 truncate text-2xl font-semibold text-foreground">{value}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground" title={detail}>
            {detail}
          </p>
        </div>
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
};

const EmptyState = ({ title, description, onRefresh, loading }) => (
  <Card>
    <CardContent className="flex min-h-[340px] flex-col items-center justify-center p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Activity className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">{description}</p>
      <Button variant="outline" className="mt-5" onClick={onRefresh} disabled={loading}>
        <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
        Refresh
      </Button>
    </CardContent>
  </Card>
);

const RankingList = ({ title, description, rows, metric, maxValue }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-base">
        {metric === "revenue" ? (
          <DollarSign className="h-5 w-5 text-primary" />
        ) : (
          <Users className="h-5 w-5 text-primary" />
        )}
        {title}
      </CardTitle>
      <p className="text-sm text-muted-foreground">{description}</p>
    </CardHeader>
    <CardContent className="space-y-3">
      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No ranking data available.
        </p>
      ) : (
        rows.map((route, index) => {
          const value = metric === "revenue" ? route.totalRevenue : route.totalBookings;
          return (
            <div key={`${routeCode(route)}-${index}`} className="rounded-lg border bg-muted/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant={index === 0 ? "default" : "secondary"} className="rounded-md">
                      {index === 0 ? <Trophy className="mr-1 h-3.5 w-3.5" /> : null}
                      #{index + 1}
                    </Badge>
                    <p className="truncate font-semibold" title={routeCode(route)}>
                      {routeCode(route)}
                    </p>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground" title={routeCities(route)}>
                    {routeCities(route)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold">
                    {metric === "revenue" ? formatCurrency(value) : formatNumber(value)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {metric === "revenue" ? `${formatNumber(route.totalBookings)} bookings` : formatCurrency(route.totalRevenue)}
                  </p>
                </div>
              </div>
              <Progress className="mt-4 h-2" value={progressValue(value, maxValue)} />
            </div>
          );
        })
      )}
    </CardContent>
  </Card>
);

const RoutePerformancePage = () => {
  const dispatch = useDispatch();
  const { routePerformance, routePerformanceLoading, error } = useSelector((store) => store.booking);

  const refresh = React.useCallback(() => {
    dispatch(getRoutePerformanceForAirline());
  }, [dispatch]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const routesByBookings = React.useMemo(
    () => asArray(routePerformance?.topRoutesByBookings),
    [routePerformance]
  );

  const routesByRevenue = React.useMemo(() => {
    const revenueRows = asArray(routePerformance?.topRoutesByRevenue);
    if (revenueRows.length > 0) return revenueRows;
    return [...routesByBookings].sort(
      (a, b) => numberValue(b.totalRevenue) - numberValue(a.totalRevenue)
    );
  }, [routePerformance, routesByBookings]);

  const rows = React.useMemo(
    () => mergeRoutes(routesByBookings, routesByRevenue),
    [routesByBookings, routesByRevenue]
  );

  const totalRoutes = rows.length;
  const totalBookings = rows.reduce((sum, route) => sum + numberValue(route.totalBookings), 0);
  const totalRevenue = rows.reduce((sum, route) => sum + numberValue(route.totalRevenue), 0);
  const totalFlights = rows.reduce((sum, route) => sum + numberValue(route.totalFlights), 0);
  const averageBookingValue = totalBookings ? totalRevenue / totalBookings : 0;
  const maxBookings = Math.max(...routesByBookings.map((route) => numberValue(route.totalBookings)), 1);
  const maxRevenue = Math.max(...routesByRevenue.map((route) => numberValue(route.totalRevenue)), 1);
  const leader = routesByBookings[0] || routesByRevenue[0];

  if (routePerformanceLoading && !routePerformance) {
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
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border bg-card">
        <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Route className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">Route Performance</h1>
                <Badge variant="outline">Owner analytics</Badge>
              </div>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Monitor confirmed booking demand, revenue contribution, and route quality signals for your airline.
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={refresh} disabled={routePerformanceLoading}>
            <RefreshCw className={cn("mr-2 h-4 w-4", routePerformanceLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </section>

      {error ? (
        <EmptyState
          title="Route analytics could not load"
          description={error}
          onRefresh={refresh}
          loading={routePerformanceLoading}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No route analytics yet"
          description="Confirmed bookings are required before route ranking and revenue contribution can be calculated."
          onRefresh={refresh}
          loading={routePerformanceLoading}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard icon={Plane} label="Tracked Routes" value={formatNumber(totalRoutes)} detail="Routes with confirmed bookings" tone="primary" />
            <MetricCard icon={Users} label="Bookings" value={formatNumber(totalBookings)} detail="Confirmed route bookings" tone="sky" />
            <MetricCard icon={DollarSign} label="Revenue" value={formatCurrency(totalRevenue)} detail="USD confirmed value" tone="emerald" />
            <MetricCard icon={Gauge} label="Avg Value" value={formatCurrency(averageBookingValue)} detail="Revenue per booking" tone="amber" />
            <MetricCard icon={BarChart3} label="Flight Coverage" value={formatNumber(totalFlights)} detail="Distinct flight instances" tone="primary" />
          </div>

          <Card>
            <CardContent className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">Strongest route</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-xl font-semibold">{routeCode(leader)}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{routeCities(leader)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-right sm:min-w-[320px]">
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <p className="text-xs text-muted-foreground">Bookings</p>
                    <p className="text-lg font-semibold">{formatNumber(leader?.totalBookings)}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <p className="text-xs text-muted-foreground">Revenue</p>
                    <p className="text-lg font-semibold">{formatCurrency(leader?.totalRevenue)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-5 xl:grid-cols-2">
            <RankingList
              title="Top routes by bookings"
              description="Demand ranking from confirmed bookings."
              rows={routesByBookings.slice(0, 6)}
              metric="bookings"
              maxValue={maxBookings}
            />
            <RankingList
              title="Top routes by revenue"
              description="Commercial contribution ranked by confirmed revenue."
              rows={routesByRevenue.slice(0, 6)}
              metric="revenue"
              maxValue={maxRevenue}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-5 w-5 text-primary" />
                Route ranking detail
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-full overflow-x-auto">
                <Table className="min-w-[980px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Route</TableHead>
                      <TableHead>Flight</TableHead>
                      <TableHead className="text-right">Bookings</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Avg / Booking</TableHead>
                      <TableHead className="text-right">Coverage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((route, index) => (
                      <TableRow key={`${routeCode(route)}-${index}`}>
                        <TableCell>
                          <div className="font-medium">{routeCode(route)}</div>
                          <div className="max-w-[320px] truncate text-xs text-muted-foreground" title={routeCities(route)}>
                            {routeCities(route)}
                          </div>
                        </TableCell>
                        <TableCell>{route.flightNumber || `#${route.flightId || "N/A"}`}</TableCell>
                        <TableCell className="text-right">{formatNumber(route.totalBookings)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(route.totalRevenue)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(route.averageRevenuePerBooking)}</TableCell>
                        <TableCell className="text-right">{formatNumber(route.totalFlights)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default RoutePerformancePage;
