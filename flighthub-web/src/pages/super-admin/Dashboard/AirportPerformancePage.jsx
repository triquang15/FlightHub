import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  BadgeDollarSign,
  Gauge,
  Globe2,
  MapPin,
  Plane,
  RefreshCw,
  Trophy,
  Users,
} from "lucide-react";
import { getAirportPerformanceForSuperAdmin } from "@/Redux/booking/bookingThunk";
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
import { formatCurrency } from "@/utils/formateCurrency";
import { formatNumber } from "@/utils/formateNumber";

const asArray = (value) => (Array.isArray(value) ? value : []);

const numberValue = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const airportCode = (airport) => airport?.airportCode || "--";
const airportName = (airport) => airport?.airportName || "Unknown airport";
const airportKey = (airport, index) => `${airport?.airportId || airportCode(airport)}-${index}`;

const progressValue = (value, max) => {
  const top = numberValue(max, 1);
  return top <= 0 ? 0 : Math.min(100, Math.round((numberValue(value) / top) * 100));
};

const mergeAirportRows = (...lists) => {
  const rows = new Map();

  lists.flat().forEach((item) => {
    if (!item) return;
    const key = item.airportId || airportCode(item) || airportName(item);
    const existing = rows.get(key) || {};
    rows.set(key, { ...existing, ...item });
  });

  return Array.from(rows.values()).sort(
    (a, b) =>
      numberValue(b.totalRevenue) - numberValue(a.totalRevenue) ||
      numberValue(b.totalBookings) - numberValue(a.totalBookings)
  );
};

const AirportPerformancePage = () => {
  const dispatch = useDispatch();
  const { superAdminAirportPerformance, superAdminAirportPerformanceLoading } = useSelector(
    (store) => store.booking
  );

  const refresh = () => dispatch(getAirportPerformanceForSuperAdmin());

  useEffect(() => {
    refresh();
  }, [dispatch]);

  const topAirportsByBookings = useMemo(
    () => asArray(superAdminAirportPerformance?.topAirportsByBookings),
    [superAdminAirportPerformance]
  );
  const topAirportsByRevenue = useMemo(
    () => asArray(superAdminAirportPerformance?.topAirportsByRevenue),
    [superAdminAirportPerformance]
  );
  const topDepartureAirports = useMemo(
    () => asArray(superAdminAirportPerformance?.topDepartureAirports),
    [superAdminAirportPerformance]
  );
  const topArrivalAirports = useMemo(
    () => asArray(superAdminAirportPerformance?.topArrivalAirports),
    [superAdminAirportPerformance]
  );

  const rows = useMemo(
    () =>
      mergeAirportRows(
        topAirportsByRevenue,
        topAirportsByBookings,
        topDepartureAirports,
        topArrivalAirports
      ),
    [topAirportsByRevenue, topAirportsByBookings, topDepartureAirports, topArrivalAirports]
  );

  const hasData = rows.length > 0;
  const totalAirports =
    numberValue(superAdminAirportPerformance?.totalAirports) ||
    new Set(rows.map((airport) => airport.airportId || airportCode(airport))).size;
  const totalBookings =
    numberValue(superAdminAirportPerformance?.totalBookings) ||
    topAirportsByBookings.reduce((sum, airport) => sum + numberValue(airport.totalBookings), 0);
  const totalRevenue =
    numberValue(superAdminAirportPerformance?.totalRevenue) ||
    topAirportsByRevenue.reduce((sum, airport) => sum + numberValue(airport.totalRevenue), 0);
  const totalFlights =
    numberValue(superAdminAirportPerformance?.totalFlights) ||
    rows.reduce((sum, airport) => sum + numberValue(airport.totalFlights), 0);
  const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
  const maxBookings = Math.max(...rows.map((airport) => numberValue(airport.totalBookings)), 1);
  const maxRevenue = Math.max(...rows.map((airport) => numberValue(airport.totalRevenue)), 1);
  const maxFlights = Math.max(...rows.map((airport) => numberValue(airport.totalFlights)), 1);
  const demandLeader = topAirportsByBookings[0];
  const revenueLeader = topAirportsByRevenue[0];

  if (superAdminAirportPerformanceLoading) {
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
    <div className="w-max min-w-[1240px] max-w-none space-y-6 p-6">
      <section className="overflow-hidden rounded-lg border bg-card">
        <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <MapPin className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  Airport Performance
                </h1>
                <Badge variant="outline">Network Analytics</Badge>
              </div>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Track demand, revenue, and hub activity across the airport network from confirmed bookings.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {demandLeader && (
              <div className="hidden rounded-md border bg-muted/25 px-3 py-2 text-sm xl:block">
                <span className="text-muted-foreground">Demand leader</span>
                <span className="ml-2 font-semibold text-foreground">
                  {airportCode(demandLeader)}
                </span>
              </div>
            )}
            <Button variant="outline" onClick={refresh} disabled={superAdminAirportPerformanceLoading}>
              <RefreshCw
                className={cn("mr-2 h-4 w-4", superAdminAirportPerformanceLoading && "animate-spin")}
              />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 border-t bg-muted/20 md:grid-cols-2 xl:grid-cols-4">
          <MetricBlock
            label="Tracked Airports"
            value={formatNumber(totalAirports)}
            detail="Airports touched by bookings"
            icon={Globe2}
          />
          <MetricBlock
            label="Booking Touchpoints"
            value={formatNumber(totalBookings)}
            detail="Departure and arrival demand"
            icon={Users}
          />
          <MetricBlock
            label="Network Revenue"
            value={formatCurrency(totalRevenue)}
            detail="USD confirmed booking value"
            icon={BadgeDollarSign}
          />
          <MetricBlock
            label="Average Value"
            value={formatCurrency(averageBookingValue)}
            detail="Revenue per airport touchpoint"
            icon={Gauge}
          />
        </div>
      </section>

      {!hasData ? (
        <EmptyState
          title="No airport analytics yet"
          description="Confirmed bookings with flight airport data are required before FlightHub can rank airport performance."
        />
      ) : (
        <>
          <section className="grid grid-cols-[minmax(0,1.25fr)_minmax(390px,0.75fr)] gap-5">
            <AirportDemandBoard rows={topAirportsByBookings.slice(0, 7)} maxBookings={maxBookings} />
            <AirportRevenuePanel
              rows={topAirportsByRevenue.slice(0, 6)}
              maxRevenue={maxRevenue}
              revenueLeader={revenueLeader}
            />
          </section>

          <section className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-5">
            <HubPanel
              title="Departure Hubs"
              description="Airports generating outbound demand"
              icon={ArrowUpFromLine}
              rows={topDepartureAirports.slice(0, 6)}
              maxBookings={maxBookings}
              tone="departure"
            />
            <HubPanel
              title="Arrival Hubs"
              description="Airports receiving inbound demand"
              icon={ArrowDownToLine}
              rows={topArrivalAirports.slice(0, 6)}
              maxBookings={maxBookings}
              tone="arrival"
            />
          </section>

          <AirportRankingTable
            rows={rows}
            maxRevenue={maxRevenue}
            maxBookings={maxBookings}
            maxFlights={maxFlights}
          />
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
  <div className="rounded-lg border bg-card p-10 text-center">
    <Activity className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
    <h2 className="text-lg font-semibold text-foreground">{title}</h2>
    <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">{description}</p>
  </div>
);

const AirportDemandBoard = ({ rows, maxBookings }) => (
  <Card className="overflow-hidden rounded-lg">
    <CardContent className="p-0">
      <PanelHeader
        icon={Trophy}
        title="Demand Leaderboard"
        description="Airports ranked by confirmed booking touchpoints"
      />
      <div className="divide-y">
        {rows.map((airport, index) => (
          <div key={airportKey(airport, index)} className="grid grid-cols-[56px_minmax(0,1fr)_180px] items-center gap-4 p-4">
            <RankBadge index={index} />
            <AirportIdentity airport={airport} />
            <div className="min-w-0">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Bookings</span>
                <span className="font-semibold text-foreground">
                  {formatNumber(numberValue(airport.totalBookings))}
                </span>
              </div>
              <Progress value={progressValue(airport.totalBookings, maxBookings)} className="h-2" />
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const AirportRevenuePanel = ({ rows, maxRevenue, revenueLeader }) => (
  <Card className="overflow-hidden rounded-lg">
    <CardContent className="p-0">
      <PanelHeader
        icon={BadgeDollarSign}
        title="Revenue Concentration"
        description="Top airports by confirmed revenue"
      />
      {revenueLeader && (
        <div className="border-b bg-primary/5 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Revenue leader</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <AirportIdentity airport={revenueLeader} compact />
            <span className="text-xl font-semibold text-foreground">
              {formatCurrency(revenueLeader.totalRevenue)}
            </span>
          </div>
        </div>
      )}
      <div className="space-y-4 p-4">
        {rows.map((airport, index) => (
          <div key={airportKey(airport, index)} className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate font-medium text-foreground">
                {airportCode(airport)} · {airportName(airport)}
              </span>
              <span className="shrink-0 font-semibold text-foreground">
                {formatCurrency(airport.totalRevenue)}
              </span>
            </div>
            <Progress value={progressValue(airport.totalRevenue, maxRevenue)} className="h-2" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const HubPanel = ({ title, description, icon: Icon, rows, maxBookings, tone }) => (
  <Card className="overflow-hidden rounded-lg">
    <CardContent className="p-0">
      <PanelHeader icon={Icon} title={title} description={description} />
      <div className="divide-y">
        {rows.map((airport, index) => (
          <div key={airportKey(airport, index)} className="grid grid-cols-[minmax(0,1fr)_150px] items-center gap-4 p-4">
            <AirportIdentity airport={airport} compact badgeTone={tone} />
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Volume</span>
                <span className="font-semibold text-foreground">
                  {formatNumber(numberValue(airport.totalBookings))}
                </span>
              </div>
              <Progress value={progressValue(airport.totalBookings, maxBookings)} className="h-2" />
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const AirportRankingTable = ({ rows, maxRevenue, maxBookings, maxFlights }) => (
  <Card className="overflow-hidden rounded-lg">
    <CardContent className="p-0">
      <PanelHeader
        icon={Plane}
        title="Airport Performance Register"
        description="Operational and commercial airport metrics from confirmed bookings"
      />
      <div className="overflow-x-auto">
        <Table className="min-w-[1160px]">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[70px]">Rank</TableHead>
              <TableHead className="w-[300px]">Airport</TableHead>
              <TableHead className="w-[140px]">Hub Role</TableHead>
              <TableHead className="w-[170px]">Bookings</TableHead>
              <TableHead className="w-[190px]">Revenue</TableHead>
              <TableHead className="w-[150px]">Avg Value</TableHead>
              <TableHead className="w-[150px]">Flights</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((airport, index) => (
              <TableRow key={airportKey(airport, index)}>
                <TableCell>
                  <RankBadge index={index} compact />
                </TableCell>
                <TableCell>
                  <AirportIdentity airport={airport} compact />
                </TableCell>
                <TableCell>
                  <AirportRoleBadge type={airport.performanceType} />
                </TableCell>
                <TableCell>
                  <MetricWithProgress
                    value={formatNumber(numberValue(airport.totalBookings))}
                    progress={progressValue(airport.totalBookings, maxBookings)}
                  />
                </TableCell>
                <TableCell>
                  <MetricWithProgress
                    value={formatCurrency(airport.totalRevenue)}
                    progress={progressValue(airport.totalRevenue, maxRevenue)}
                  />
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  {formatCurrency(airport.averageRevenuePerBooking)}
                </TableCell>
                <TableCell>
                  <MetricWithProgress
                    value={formatNumber(numberValue(airport.totalFlights))}
                    progress={progressValue(airport.totalFlights, maxFlights)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>
);

const PanelHeader = ({ icon: Icon, title, description }) => (
  <div className="border-b p-4">
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  </div>
);

const AirportIdentity = ({ airport, compact = false, badgeTone }) => (
  <div className="flex min-w-0 items-center gap-3">
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-semibold text-primary">
      {airportCode(airport)}
    </div>
    <div className="min-w-0">
      <div className="flex min-w-0 items-center gap-2">
        <p className={cn("truncate font-semibold text-foreground", compact ? "text-sm" : "text-base")}>
          {airportName(airport)}
        </p>
        {badgeTone && <AirportRoleBadge type={badgeTone} compact />}
      </div>
      <p className="truncate text-sm text-muted-foreground">
        {airport?.city || "Unknown city"}, {airport?.country || "Unknown country"}
      </p>
    </div>
  </div>
);

const RankBadge = ({ index, compact = false }) => {
  const topRank = index < 3;
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-md font-semibold",
        compact ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm",
        topRank ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      )}
    >
      {topRank ? <Trophy className="h-4 w-4" /> : index + 1}
    </div>
  );
};

const AirportRoleBadge = ({ type, compact = false }) => {
  const normalized = type || "both";
  const labels = {
    departure: "Departure",
    arrival: "Arrival",
    both: "Two-way hub",
  };
  const classes = {
    departure: "border-blue-500/25 bg-blue-500/10 text-blue-600 dark:text-blue-300",
    arrival: "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    both: "border-primary/25 bg-primary/10 text-primary",
  };

  return (
    <Badge variant="outline" className={cn("whitespace-nowrap", classes[normalized], compact && "text-[11px]")}>
      {labels[normalized] || labels.both}
    </Badge>
  );
};

const MetricWithProgress = ({ value, progress }) => (
  <div className="min-w-0">
    <p className="mb-2 truncate font-medium text-foreground">{value}</p>
    <Progress value={progress} className="h-2" />
  </div>
);

export default AirportPerformancePage;
