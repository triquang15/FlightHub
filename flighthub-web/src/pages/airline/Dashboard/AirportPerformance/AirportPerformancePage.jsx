import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  BadgeDollarSign,
  BarChart3,
  Gauge,
  Globe2,
  MapPin,
  Plane,
  RefreshCw,
  Trophy,
  Users,
} from "lucide-react";

import { getAirportPerformanceForAirline } from "@/Redux/booking/bookingThunk";
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

const airportCode = (airport) => airport?.airportCode || "--";
const airportName = (airport) => airport?.airportName || "Unknown airport";
const airportLocation = (airport) =>
  [airport?.city, airport?.country].filter(Boolean).join(", ") || "Location unavailable";

const progressValue = (value, max) => {
  const top = numberValue(max, 1);
  return top <= 0 ? 0 : Math.min(100, Math.round((numberValue(value) / top) * 100));
};

const mergeAirportRows = (...lists) => {
  const rows = new Map();
  lists.flat().forEach((airport) => {
    if (!airport) return;
    const key = airport.airportId || airportCode(airport) || airportName(airport);
    rows.set(key, { ...(rows.get(key) || {}), ...airport });
  });
  return Array.from(rows.values()).sort(
    (a, b) =>
      numberValue(b.totalRevenue) - numberValue(a.totalRevenue) ||
      numberValue(b.totalBookings) - numberValue(a.totalBookings)
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

const AirportRankingList = ({ title, description, rows, metric, maxValue }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-base">
        {metric === "revenue" ? (
          <BadgeDollarSign className="h-5 w-5 text-primary" />
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
          No airport ranking data available.
        </p>
      ) : (
        rows.map((airport, index) => {
          const value = metric === "revenue" ? airport.totalRevenue : airport.totalBookings;
          return (
            <div key={`${airportCode(airport)}-${index}`} className="rounded-lg border bg-muted/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant={index === 0 ? "default" : "secondary"} className="rounded-md">
                      {index === 0 ? <Trophy className="mr-1 h-3.5 w-3.5" /> : null}
                      #{index + 1}
                    </Badge>
                    <p className="truncate font-semibold" title={`${airportCode(airport)} - ${airportName(airport)}`}>
                      {airportCode(airport)} - {airportName(airport)}
                    </p>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground" title={airportLocation(airport)}>
                    {airportLocation(airport)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold">
                    {metric === "revenue" ? formatCurrency(value) : formatNumber(value)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {metric === "revenue" ? `${formatNumber(airport.totalBookings)} bookings` : formatCurrency(airport.totalRevenue)}
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

const HubCard = ({ title, icon: Icon, rows }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-base">
        <Icon className="h-5 w-5 text-primary" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No hub data available.
        </p>
      ) : (
        rows.slice(0, 5).map((airport, index) => (
          <div key={`${title}-${airportCode(airport)}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 p-3">
            <div className="min-w-0">
              <p className="truncate font-semibold">{airportCode(airport)} - {airportName(airport)}</p>
              <p className="truncate text-xs text-muted-foreground">{airportLocation(airport)}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-semibold">{formatNumber(airport.totalBookings)}</p>
              <p className="text-xs text-muted-foreground">bookings</p>
            </div>
          </div>
        ))
      )}
    </CardContent>
  </Card>
);

const AirportPerformancePage = () => {
  const dispatch = useDispatch();
  const { airportPerformance, airportPerformanceLoading, error } = useSelector((store) => store.booking);

  const refresh = React.useCallback(() => {
    dispatch(getAirportPerformanceForAirline());
  }, [dispatch]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const topAirportsByBookings = React.useMemo(
    () => asArray(airportPerformance?.topAirportsByBookings),
    [airportPerformance]
  );
  const topAirportsByRevenue = React.useMemo(
    () => asArray(airportPerformance?.topAirportsByRevenue),
    [airportPerformance]
  );
  const topDepartureAirports = React.useMemo(
    () => asArray(airportPerformance?.topDepartureAirports),
    [airportPerformance]
  );
  const topArrivalAirports = React.useMemo(
    () => asArray(airportPerformance?.topArrivalAirports),
    [airportPerformance]
  );

  const rows = React.useMemo(
    () =>
      mergeAirportRows(
        topAirportsByRevenue,
        topAirportsByBookings,
        topDepartureAirports,
        topArrivalAirports
      ),
    [topAirportsByRevenue, topAirportsByBookings, topDepartureAirports, topArrivalAirports]
  );

  const totalAirports =
    numberValue(airportPerformance?.totalAirports) ||
    new Set(rows.map((airport) => airport.airportId || airportCode(airport))).size;
  const totalBookings =
    numberValue(airportPerformance?.totalBookings) ||
    rows.reduce((sum, airport) => sum + numberValue(airport.totalBookings), 0);
  const totalRevenue =
    numberValue(airportPerformance?.totalRevenue) ||
    rows.reduce((sum, airport) => sum + numberValue(airport.totalRevenue), 0);
  const totalFlights =
    numberValue(airportPerformance?.totalFlights) ||
    rows.reduce((sum, airport) => sum + numberValue(airport.totalFlights), 0);
  const averageBookingValue = totalBookings ? totalRevenue / totalBookings : 0;
  const maxBookings = Math.max(...topAirportsByBookings.map((airport) => numberValue(airport.totalBookings)), 1);
  const maxRevenue = Math.max(...topAirportsByRevenue.map((airport) => numberValue(airport.totalRevenue)), 1);
  const leader = topAirportsByBookings[0] || topAirportsByRevenue[0];

  if (airportPerformanceLoading && !airportPerformance) {
    return (
      <div className="flex min-h-[460px] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading airport performance...</p>
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
              <MapPin className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">Airport Performance</h1>
                <Badge variant="outline">Owner analytics</Badge>
              </div>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Track airport demand, revenue, and departure/arrival hub patterns for your airline.
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={refresh} disabled={airportPerformanceLoading}>
            <RefreshCw className={cn("mr-2 h-4 w-4", airportPerformanceLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </section>

      {error ? (
        <EmptyState
          title="Airport analytics could not load"
          description={error}
          onRefresh={refresh}
          loading={airportPerformanceLoading}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No airport analytics yet"
          description="Confirmed bookings with flight airport data are required before airport ranking can be calculated."
          onRefresh={refresh}
          loading={airportPerformanceLoading}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard icon={Globe2} label="Tracked Airports" value={formatNumber(totalAirports)} detail="Airports touched by bookings" tone="primary" />
            <MetricCard icon={Users} label="Bookings" value={formatNumber(totalBookings)} detail="Confirmed airport demand" tone="sky" />
            <MetricCard icon={BadgeDollarSign} label="Revenue" value={formatCurrency(totalRevenue)} detail="USD confirmed value" tone="emerald" />
            <MetricCard icon={Gauge} label="Avg Value" value={formatCurrency(averageBookingValue)} detail="Revenue per booking touchpoint" tone="amber" />
            <MetricCard icon={Plane} label="Flight Coverage" value={formatNumber(totalFlights)} detail="Distinct flight coverage" tone="primary" />
          </div>

          <Card>
            <CardContent className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">Demand leader</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-xl font-semibold">{airportCode(leader)}</span>
                    <span className="text-sm text-muted-foreground">{airportName(leader)} - {airportLocation(leader)}</span>
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
            <AirportRankingList
              title="Top airports by bookings"
              description="Passenger demand ranked by airport touchpoint."
              rows={topAirportsByBookings.slice(0, 6)}
              metric="bookings"
              maxValue={maxBookings}
            />
            <AirportRankingList
              title="Top airports by revenue"
              description="Commercial contribution ranked by confirmed revenue."
              rows={topAirportsByRevenue.slice(0, 6)}
              metric="revenue"
              maxValue={maxRevenue}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <HubCard title="Departure hubs" icon={ArrowUpFromLine} rows={topDepartureAirports} />
            <HubCard title="Arrival hubs" icon={ArrowDownToLine} rows={topArrivalAirports} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-5 w-5 text-primary" />
                Airport ranking detail
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-full overflow-x-auto">
                <Table className="min-w-[1080px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Airport</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Bookings</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Avg / Booking</TableHead>
                      <TableHead className="text-right">Flights</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((airport, index) => (
                      <TableRow key={`${airportCode(airport)}-${index}`}>
                        <TableCell>
                          <div className="font-medium">{airportCode(airport)}</div>
                          <div className="max-w-[320px] truncate text-xs text-muted-foreground" title={airportName(airport)}>
                            {airportName(airport)}
                          </div>
                        </TableCell>
                        <TableCell>{airportLocation(airport)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {airport.performanceType || "mixed"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatNumber(airport.totalBookings)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(airport.totalRevenue)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(airport.averageRevenuePerBooking)}</TableCell>
                        <TableCell className="text-right">{formatNumber(airport.totalFlights)}</TableCell>
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

export default AirportPerformancePage;
