import * as React from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock,
  DollarSign,
  Gauge,
  MapPin,
  Plane,
  Route,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const numberOrZero = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const safePercent = (value, total) => {
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
};

const formatCurrency = (value, compact = true) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: compact ? 0 : 2,
    notation: compact && Math.abs(value) >= 10000 ? "compact" : "standard",
  }).format(numberOrZero(value));

const formatNumber = (value) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(numberOrZero(value));

const getStatus = (flight) => String(flight?.realTimeStatus || flight?.status || "Scheduled").toUpperCase();

const textValue = (value, fallback = "") => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (!value || typeof value !== "object") return fallback;
  return (
    value.iataCode ||
    value.code ||
    value.name ||
    value.cityName ||
    value.label ||
    value.value ||
    fallback
  );
};

const normalizeAirport = (airport) => {
  if (!airport || typeof airport !== "object") return airport;
  return airport.airport || airport.airportInfo || airport.location || airport;
};

const getAirportCode = (airport) => {
  const normalized = normalizeAirport(airport);
  return textValue(
    normalized?.iataCode ||
      normalized?.code ||
      airport?.iataCode ||
      airport?.code ||
      airport?.airportCode ||
      airport,
    "--",
  );
};

const getCity = (airport) => {
  const normalized = normalizeAirport(airport);
  return textValue(
    normalized?.city?.name ||
      normalized?.city ||
      normalized?.cityName ||
      normalized?.name ||
      airport?.city?.name ||
      airport?.cityName ||
      airport?.name,
    "Unknown city",
  );
};

const getRouteInfo = (flight) => {
  const departure = flight?.route?.departure || flight?.departureAirport || {};
  const arrival = flight?.route?.arrival || flight?.arrivalAirport || {};
  return {
    code: `${getAirportCode(departure)}-${getAirportCode(arrival)}`,
    cities: `${getCity(departure)} -> ${getCity(arrival)}`,
  };
};

const getAircraftInfo = (flight) => {
  const aircraft = flight?.aircraft || {};
  return {
    type: aircraft.type || aircraft.model || aircraft.code || flight?.aircraftCode || "Unassigned aircraft",
    capacity: numberOrZero(aircraft.capacity || aircraft.seatingCapacity || aircraft.totalSeats || flight?.availableSeats),
  };
};

const getBookings = (flight) => numberOrZero(flight?.bookings || flight?.bookingCount || flight?.confirmedBookings);

const getFare = (flight) =>
  numberOrZero(
    flight?.pricing?.economy ||
      flight?.fare?.totalPrice ||
      flight?.fare?.currentPrice ||
      flight?.fare?.baseFare ||
      flight?.baseFare,
  );

const StatCard = ({ icon: Icon, label, value, detail, tone = "indigo" }) => {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300",
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    sky: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
    violet: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
    rose: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="mt-2 truncate text-2xl font-semibold tracking-tight">{value}</p>
            {detail && <p className="mt-1 truncate text-xs text-muted-foreground" title={detail}>{detail}</p>}
          </div>
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", tones[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ProgressRow = ({ label, value, total, tone = "bg-primary", detail }) => {
  const percent = safePercent(value, total);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="min-w-0 truncate font-medium">{label}</span>
        <span className="shrink-0 text-muted-foreground">{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${percent}%` }} />
      </div>
      {detail && <p className="truncate text-xs text-muted-foreground" title={detail}>{detail}</p>}
    </div>
  );
};

const EmptyState = () => (
  <Card>
    <CardContent className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <BarChart3 className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">No insight data yet</h3>
      <p className="mt-2 max-w-lg text-sm text-muted-foreground">
        Create flight definitions, schedules, fares, and bookings to populate owner performance insights.
      </p>
    </CardContent>
  </Card>
);

const AnalyticsDashboard = ({ flights = [] }) => {
  const [dateRange, setDateRange] = React.useState("30days");
  const safeFlights = React.useMemo(() => (Array.isArray(flights) ? flights : []), [flights]);

  const analytics = React.useMemo(() => {
    const totalFlights = safeFlights.length;
    const activeFlights = safeFlights.filter((flight) => ["ACTIVE", "SCHEDULED", "ON-TIME", "ON_TIME"].includes(getStatus(flight))).length;
    const delayedFlights = safeFlights.filter((flight) => getStatus(flight).includes("DELAY")).length;
    const cancelledFlights = safeFlights.filter((flight) => getStatus(flight).includes("CANCEL")).length;
    const onTimeFlights = Math.max(0, activeFlights - delayedFlights);

    const totals = safeFlights.reduce(
      (acc, flight) => {
        const bookings = getBookings(flight);
        const fare = getFare(flight);
        const aircraft = getAircraftInfo(flight);
        acc.bookings += bookings;
        acc.capacity += aircraft.capacity;
        acc.revenue += bookings * fare;
        return acc;
      },
      { bookings: 0, capacity: 0, revenue: 0 },
    );

    const routeMap = new Map();
    const aircraftMap = new Map();

    safeFlights.forEach((flight) => {
      const bookings = getBookings(flight);
      const fare = getFare(flight);
      const revenue = bookings * fare;
      const route = getRouteInfo(flight);
      const aircraft = getAircraftInfo(flight);

      const routeEntry = routeMap.get(route.code) || {
        route: route.code,
        cities: route.cities,
        flights: 0,
        bookings: 0,
        revenue: 0,
        capacity: 0,
      };
      routeEntry.flights += 1;
      routeEntry.bookings += bookings;
      routeEntry.revenue += revenue;
      routeEntry.capacity += aircraft.capacity;
      routeMap.set(route.code, routeEntry);

      const aircraftEntry = aircraftMap.get(aircraft.type) || {
        type: aircraft.type,
        flights: 0,
        bookings: 0,
        revenue: 0,
        capacity: 0,
      };
      aircraftEntry.flights += 1;
      aircraftEntry.bookings += bookings;
      aircraftEntry.revenue += revenue;
      aircraftEntry.capacity += aircraft.capacity;
      aircraftMap.set(aircraft.type, aircraftEntry);
    });

    const topRoutes = [...routeMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    const topAircraft = [...aircraftMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    return {
      totalFlights,
      activeFlights,
      delayedFlights,
      cancelledFlights,
      onTimeFlights,
      topRoutes,
      topAircraft,
      totalBookings: totals.bookings,
      totalCapacity: totals.capacity,
      totalRevenue: totals.revenue,
      avgOccupancy: safePercent(totals.bookings, totals.capacity),
      onTimePercentage: safePercent(onTimeFlights, totalFlights),
      revenuePerFlight: totalFlights ? Math.round(totals.revenue / totalFlights) : 0,
      fleetUtilization: safePercent(activeFlights, totalFlights),
    };
  }, [safeFlights]);

  const recommendations = [
    {
      title: "Revenue focus",
      icon: DollarSign,
      tone: "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100",
      text: analytics.topRoutes[0]
        ? `${analytics.topRoutes[0].route} is currently the strongest revenue route. Review frequency and fare availability there first.`
        : "No route revenue signal yet. Publish fares and schedules to activate revenue analytics.",
    },
    {
      title: "Capacity signal",
      icon: Target,
      tone: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100",
      text:
        analytics.avgOccupancy >= 80
          ? `Average occupancy is strong at ${analytics.avgOccupancy}%. Protect inventory and monitor overbooking risk.`
          : `Average occupancy is ${analytics.avgOccupancy}%. Consider promotions or route-level schedule adjustments.`,
    },
    {
      title: "Operational health",
      icon: Clock,
      tone: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100",
      text:
        analytics.onTimePercentage >= 85
          ? `On-time rate is healthy at ${analytics.onTimePercentage}%. Keep monitoring delay-heavy turns.`
          : `On-time rate is ${analytics.onTimePercentage}%. Investigate delayed flights and aircraft rotations.`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Airline owner insights
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">Performance Overview</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Monitor commercial, operational, route, and fleet signals for your airline workspace.
          </p>
        </div>

        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Last 7 days</SelectItem>
            <SelectItem value="30days">Last 30 days</SelectItem>
            <SelectItem value="90days">Last 90 days</SelectItem>
            <SelectItem value="1year">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {analytics.totalFlights === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <StatCard icon={DollarSign} label="Revenue" value={formatCurrency(analytics.totalRevenue)} detail="Estimated from bookings x fare" tone="emerald" />
            <StatCard icon={Users} label="Bookings" value={formatNumber(analytics.totalBookings)} detail="Confirmed booking signal" tone="sky" />
            <StatCard icon={Target} label="Occupancy" value={`${analytics.avgOccupancy}%`} detail={`${formatNumber(analytics.totalBookings)} of ${formatNumber(analytics.totalCapacity)} seats`} tone="violet" />
            <StatCard icon={Clock} label="On-time" value={`${analytics.onTimePercentage}%`} detail={`${analytics.onTimeFlights} flights on schedule`} tone="amber" />
            <StatCard icon={TrendingUp} label="Revenue / flight" value={formatCurrency(analytics.revenuePerFlight)} detail="Average estimate" tone="indigo" />
            <StatCard icon={Plane} label="Fleet utilization" value={`${analytics.fleetUtilization}%`} detail={`${analytics.activeFlights} active flights`} tone="rose" />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-5 w-5 text-primary" />
                  Operational Mix
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <ProgressRow label="On schedule" value={analytics.onTimeFlights} total={analytics.totalFlights} tone="bg-emerald-500" detail={`${analytics.onTimeFlights} of ${analytics.totalFlights} flights`} />
                <ProgressRow label="Delayed" value={analytics.delayedFlights} total={analytics.totalFlights} tone="bg-amber-500" detail={`${analytics.delayedFlights} flights need attention`} />
                <ProgressRow label="Cancelled" value={analytics.cancelledFlights} total={analytics.totalFlights} tone="bg-rose-500" detail={`${analytics.cancelledFlights} flights cancelled`} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Route className="h-5 w-5 text-primary" />
                  Top Route Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analytics.topRoutes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No route performance data available.</p>
                ) : (
                  analytics.topRoutes.map((route, index) => {
                    const occupancy = safePercent(route.bookings, route.capacity);
                    return (
                      <div key={route.route} className="rounded-lg border bg-muted/20 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="rounded-md">#{index + 1}</Badge>
                              <p className="truncate font-semibold" title={route.route}>{route.route}</p>
                            </div>
                            <p className="mt-1 truncate text-xs text-muted-foreground" title={route.cities}>{route.cities}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="font-semibold">{formatCurrency(route.revenue)}</p>
                            <p className="text-xs text-muted-foreground">{route.bookings} bookings</p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <ProgressRow label="Occupancy" value={route.bookings} total={route.capacity} detail={`${occupancy}% booked capacity`} />
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Gauge className="h-5 w-5 text-primary" />
                  Fleet Utilization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analytics.topAircraft.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No aircraft performance data available.</p>
                ) : (
                  analytics.topAircraft.map((aircraft) => (
                    <div key={aircraft.type} className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold" title={aircraft.type}>{aircraft.type}</p>
                          <p className="text-xs text-muted-foreground">{aircraft.flights} flights · {aircraft.bookings} bookings</p>
                        </div>
                        <p className="shrink-0 text-sm font-semibold">{formatCurrency(aircraft.revenue)}</p>
                      </div>
                      <ProgressRow label="Seat utilization" value={aircraft.bookings} total={aircraft.capacity} />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-5 w-5 text-primary" />
                  Action Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {recommendations.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className={cn("rounded-lg border p-4", item.tone)}>
                      <div className="flex items-start gap-3">
                        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold">{item.title}</p>
                          <p className="mt-1 text-sm opacity-90">{item.text}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="rounded-lg border bg-muted/20 p-4">
                  <div className="flex items-start gap-3">
                    {analytics.cancelledFlights > 0 ? (
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    ) : (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    )}
                    <div>
                      <p className="font-semibold">Next best action</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Review route performance, then adjust fare availability and aircraft assignment for the top under-utilized routes.
                      </p>
                    </div>
                    <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
