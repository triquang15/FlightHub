import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Activity,
  BarChart3,
  Building2,
  DollarSign,
  Gauge,
  Plane,
  RefreshCw,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import { getAirlinePerformanceForSuperAdmin } from "@/Redux/booking/bookingThunk";
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

const airlineName = (airline) => airline?.airlineName || "Unknown Airline";
const airlineCode = (airline) => airline?.airlineCode || "--";
const airlineKey = (airline, index) => `${airline?.airlineId || airlineCode(airline)}-${index}`;

const progressValue = (value, max) => {
  const top = numberValue(max, 1);
  return top <= 0 ? 0 : Math.min(100, Math.round((numberValue(value) / top) * 100));
};

const mergeAirlineRows = (...lists) => {
  const rows = new Map();

  lists.flat().forEach((item) => {
    if (!item) return;
    const key = item.airlineId || airlineCode(item) || airlineName(item);
    const existing = rows.get(key) || {};
    rows.set(key, { ...existing, ...item });
  });

  return Array.from(rows.values()).sort(
    (a, b) =>
      numberValue(b.totalRevenue) - numberValue(a.totalRevenue) ||
      numberValue(b.totalBookings) - numberValue(a.totalBookings)
  );
};

const AirlinePerformancePage = () => {
  const dispatch = useDispatch();
  const { superAdminAirlinePerformance, superAdminAirlinePerformanceLoading } = useSelector(
    (store) => store.booking
  );

  const refresh = () => dispatch(getAirlinePerformanceForSuperAdmin());

  useEffect(() => {
    refresh();
  }, [dispatch]);

  const topAirlinesByBookings = useMemo(
    () => asArray(superAdminAirlinePerformance?.topAirlinesByBookings),
    [superAdminAirlinePerformance]
  );

  const topAirlinesByRevenue = useMemo(
    () => asArray(superAdminAirlinePerformance?.topAirlinesByRevenue),
    [superAdminAirlinePerformance]
  );

  const topAirlinesByAverageRevenue = useMemo(
    () => asArray(superAdminAirlinePerformance?.topAirlinesByAverageRevenue),
    [superAdminAirlinePerformance]
  );

  const topAirlinesByFlightCount = useMemo(
    () => asArray(superAdminAirlinePerformance?.topAirlinesByFlightCount),
    [superAdminAirlinePerformance]
  );

  const rows = useMemo(
    () =>
      mergeAirlineRows(
        topAirlinesByRevenue,
        topAirlinesByBookings,
        topAirlinesByAverageRevenue,
        topAirlinesByFlightCount
      ),
    [
      topAirlinesByRevenue,
      topAirlinesByBookings,
      topAirlinesByAverageRevenue,
      topAirlinesByFlightCount,
    ]
  );

  const hasData = rows.length > 0;
  const totalAirlines = new Set(rows.map((airline) => airline.airlineId || airlineCode(airline))).size;
  const totalBookings = topAirlinesByBookings.reduce(
    (sum, airline) => sum + numberValue(airline.totalBookings),
    0
  );
  const totalRevenue = topAirlinesByRevenue.reduce(
    (sum, airline) => sum + numberValue(airline.totalRevenue),
    0
  );
  const totalFlights = topAirlinesByFlightCount.reduce(
    (sum, airline) => sum + numberValue(airline.totalFlights),
    0
  );
  const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
  const maxBookings = Math.max(...rows.map((airline) => numberValue(airline.totalBookings)), 1);
  const maxRevenue = Math.max(...rows.map((airline) => numberValue(airline.totalRevenue)), 1);
  const maxFlights = Math.max(...rows.map((airline) => numberValue(airline.totalFlights)), 1);
  const bookingLeader = topAirlinesByBookings[0];
  const revenueLeader = topAirlinesByRevenue[0];

  if (superAdminAirlinePerformanceLoading) {
    return (
      <div className="flex min-h-[460px] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading airline performance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-max min-w-[1240px] max-w-none space-y-6 p-6">
      <section className="overflow-hidden rounded-lg border bg-card">
        <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Building2 className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  Airline Performance
                </h1>
                <Badge variant="outline">Platform Analytics</Badge>
              </div>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Compare carrier demand, revenue contribution, flight activity, and booking value
                across the marketplace.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {revenueLeader && (
              <div className="hidden rounded-md border bg-muted/25 px-3 py-2 text-sm xl:block">
                <span className="text-muted-foreground">Revenue leader</span>
                <span className="ml-2 font-semibold text-foreground">
                  {airlineCode(revenueLeader)}
                </span>
              </div>
            )}
            <Button variant="outline" onClick={refresh} disabled={superAdminAirlinePerformanceLoading}>
              <RefreshCw
                className={cn("mr-2 h-4 w-4", superAdminAirlinePerformanceLoading && "animate-spin")}
              />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 border-t bg-muted/20 md:grid-cols-2 xl:grid-cols-4">
          <MetricBlock
            label="Tracked Airlines"
            value={formatNumber(totalAirlines)}
            detail="Carriers with performance records"
            icon={Building2}
          />
          <MetricBlock
            label="Bookings"
            value={formatNumber(totalBookings)}
            detail="Confirmed marketplace bookings"
            icon={Users}
          />
          <MetricBlock
            label="Revenue"
            value={formatCurrency(totalRevenue)}
            detail="USD confirmed booking value"
            icon={DollarSign}
          />
          <MetricBlock
            label="Average Value"
            value={formatCurrency(averageBookingValue)}
            detail="Revenue per confirmed booking"
            icon={Gauge}
          />
        </div>
      </section>

      {!hasData ? (
        <EmptyState
          title="No airline analytics yet"
          description="Confirmed bookings are required before FlightHub can rank airlines by bookings, revenue, or operational activity."
        />
      ) : (
        <>
          <section className="grid grid-cols-[minmax(0,1.25fr)_minmax(390px,0.75fr)] gap-5">
            <AirlineDemandBoard
              rows={topAirlinesByBookings.slice(0, 7)}
              maxBookings={maxBookings}
              bookingLeader={bookingLeader}
            />
            <AirlineRevenuePanel
              rows={topAirlinesByRevenue.slice(0, 6)}
              maxRevenue={maxRevenue}
              revenueLeader={revenueLeader}
            />
          </section>

          <section className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-5">
            <AverageRevenuePanel rows={topAirlinesByAverageRevenue.slice(0, 5)} />
            <FlightActivityPanel rows={topAirlinesByFlightCount.slice(0, 6)} maxFlights={maxFlights} />
          </section>

          <AirlineRankingTable rows={rows} maxRevenue={maxRevenue} maxBookings={maxBookings} />
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

const AirlineDemandBoard = ({ rows, maxBookings, bookingLeader }) => (
  <Card className="overflow-hidden">
    <CardContent className="p-0">
      <div className="border-b p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Demand Board
            </p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">
              Booking volume ranking
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Carriers ranked by confirmed marketplace demand.
            </p>
          </div>
          {bookingLeader && (
            <div className="rounded-md border bg-muted/25 px-4 py-3 text-right">
              <p className="text-xs text-muted-foreground">Demand leader</p>
              <p className="mt-1 font-semibold text-foreground">{airlineCode(bookingLeader)}</p>
            </div>
          )}
        </div>
      </div>

      <div className="divide-y">
        {rows.map((airline, index) => (
          <AirlineDemandRow
            key={airlineKey(airline, index)}
            airline={airline}
            index={index}
            maxBookings={maxBookings}
          />
        ))}
      </div>
    </CardContent>
  </Card>
);

const AirlineDemandRow = ({ airline, index, maxBookings }) => {
  const bookings = numberValue(airline.totalBookings);
  const percent = progressValue(bookings, maxBookings);

  return (
    <div className="grid grid-cols-[52px_minmax(280px,1fr)_130px] items-center gap-4 p-4">
      <RankBadge rank={index + 1} />
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-3">
          <AirlineAvatar airline={airline} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">{airlineName(airline)}</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="h-6 px-2">
                {airlineCode(airline)}
              </Badge>
              <span>{statusLabel(airline.status)}</span>
            </div>
          </div>
        </div>
        <Progress value={percent} className="mt-3 h-2" />
      </div>
      <div className="text-right">
        <p className="text-lg font-semibold text-foreground">{formatNumber(bookings)}</p>
        <p className="text-xs text-muted-foreground">bookings</p>
      </div>
    </div>
  );
};

const AirlineRevenuePanel = ({ rows, maxRevenue, revenueLeader }) => (
  <Card className="overflow-hidden">
    <CardContent className="p-0">
      <div className="border-b p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Revenue
        </p>
        <h2 className="mt-2 text-xl font-semibold text-foreground">Revenue contribution</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Top carriers by confirmed USD booking value.
        </p>
      </div>

      {revenueLeader && (
        <div className="border-b bg-primary/5 p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Top contributor</p>
              <p className="mt-1 truncate text-lg font-semibold text-foreground">
                {airlineName(revenueLeader)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl font-semibold text-foreground">
                {formatCurrency(revenueLeader.totalRevenue)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatNumber(revenueLeader.totalBookings)} bookings
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4 p-5">
        {rows.map((airline, index) => {
          const revenue = numberValue(airline.totalRevenue);
          return (
            <div key={airlineKey(airline, index)} className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="w-7 text-xs font-semibold text-muted-foreground">
                    #{index + 1}
                  </span>
                  <span className="truncate text-sm font-medium text-foreground">
                    {airlineName(airline)}
                  </span>
                </div>
                <span className="shrink-0 text-sm font-semibold text-foreground">
                  {formatCurrency(revenue)}
                </span>
              </div>
              <Progress value={progressValue(revenue, maxRevenue)} className="h-2" />
            </div>
          );
        })}
      </div>
    </CardContent>
  </Card>
);

const AverageRevenuePanel = ({ rows }) => (
  <Card className="overflow-hidden">
    <CardContent className="p-0">
      <div className="border-b p-5">
        <div className="flex items-center gap-2">
          <Gauge className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Booking value quality</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Carriers with the highest average revenue per booking.
        </p>
      </div>
      <div className="divide-y">
        {rows.length === 0 ? (
          <SmallEmptyState label="No average revenue data yet." />
        ) : (
          rows.map((airline, index) => (
            <div
              key={airlineKey(airline, index)}
              className="flex items-center justify-between gap-4 p-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <RankBadge rank={index + 1} compact />
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{airlineName(airline)}</p>
                  <p className="text-xs text-muted-foreground">{airlineCode(airline)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-foreground">
                  {formatCurrency(airline.averageRevenuePerBooking)}
                </p>
                <p className="text-xs text-muted-foreground">avg value</p>
              </div>
            </div>
          ))
        )}
      </div>
    </CardContent>
  </Card>
);

const FlightActivityPanel = ({ rows, maxFlights }) => (
  <Card className="overflow-hidden">
    <CardContent className="p-0">
      <div className="border-b p-5">
        <div className="flex items-center gap-2">
          <Plane className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Flight activity</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Operational footprint based on flight count in analytics data.
        </p>
      </div>
      <div className="space-y-4 p-5">
        {rows.length === 0 ? (
          <SmallEmptyState label="No flight activity data yet." />
        ) : (
          rows.map((airline, index) => {
            const flights = numberValue(airline.totalFlights);
            return (
              <div key={airlineKey(airline, index)} className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {airlineName(airline)}
                    </p>
                    <p className="text-xs text-muted-foreground">{airlineCode(airline)}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-foreground">
                    {formatNumber(flights)} flights
                  </span>
                </div>
                <Progress value={progressValue(flights, maxFlights)} className="h-2" />
              </div>
            );
          })
        )}
      </div>
    </CardContent>
  </Card>
);

const AirlineRankingTable = ({ rows, maxRevenue, maxBookings }) => (
  <Card className="overflow-hidden">
    <CardContent className="p-0">
      <div className="flex items-start justify-between gap-4 border-b p-5">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Airline ranking detail</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Revenue, demand, activity, and average value in one operator view.
          </p>
        </div>
        <Badge variant="outline">{rows.length} records</Badge>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="w-16">#</TableHead>
            <TableHead className="min-w-[310px]">Airline</TableHead>
            <TableHead className="min-w-[150px]">Status</TableHead>
            <TableHead className="min-w-[190px] text-right">Revenue</TableHead>
            <TableHead className="min-w-[170px] text-right">Bookings</TableHead>
            <TableHead className="min-w-[150px] text-right">Flights</TableHead>
            <TableHead className="min-w-[180px] text-right">Avg Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((airline, index) => {
            const revenue = numberValue(airline.totalRevenue);
            const bookings = numberValue(airline.totalBookings);
            return (
              <TableRow key={airlineKey(airline, index)} className="align-middle">
                <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                <TableCell>
                  <div className="flex min-w-0 items-center gap-3">
                    <AirlineAvatar airline={airline} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{airlineName(airline)}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{airlineCode(airline)}</span>
                        {airline.totalRoutes ? <span>{formatNumber(airline.totalRoutes)} routes</span> : null}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={airline.status} />
                </TableCell>
                <TableCell className="text-right">
                  <p className="font-semibold text-foreground">{formatCurrency(revenue)}</p>
                  <Progress value={progressValue(revenue, maxRevenue)} className="mt-2 h-1.5" />
                </TableCell>
                <TableCell className="text-right">
                  <p className="font-semibold text-foreground">{formatNumber(bookings)}</p>
                  <Progress value={progressValue(bookings, maxBookings)} className="mt-2 h-1.5" />
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatNumber(airline.totalFlights)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(airline.averageRevenuePerBooking)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

const RankBadge = ({ rank, compact = false }) => {
  const isPodium = rank <= 3;
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-md border font-semibold",
        compact ? "h-9 w-9 text-sm" : "h-11 w-11",
        isPodium ? "border-primary/25 bg-primary/10 text-primary" : "bg-muted/30 text-muted-foreground"
      )}
    >
      {rank === 1 ? <Trophy className="h-5 w-5" /> : rank}
    </div>
  );
};

const AirlineAvatar = ({ airline }) => {
  const code = airlineCode(airline);
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-semibold text-primary">
      {code.slice(0, 2)}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const normalized = statusLabel(status);
  const className =
    normalized === "Active"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
      : normalized === "Banned"
        ? "border-destructive/30 bg-destructive/10 text-destructive"
        : normalized === "Pending"
          ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300"
          : "border-muted-foreground/20 bg-muted/30 text-muted-foreground";

  return (
    <Badge variant="outline" className={cn("gap-1.5", className)}>
      {normalized === "Active" ? <ShieldCheck className="h-3.5 w-3.5" /> : null}
      {normalized}
    </Badge>
  );
};

const statusLabel = (status) => {
  const value = String(status || "ACTIVE").toLowerCase();
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const SmallEmptyState = ({ label }) => (
  <div className="flex min-h-[180px] items-center justify-center p-6 text-center text-sm text-muted-foreground">
    {label}
  </div>
);

export default AirlinePerformancePage;
