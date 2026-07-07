import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clipboard,
  Clock,
  Plane,
  RefreshCw,
  Route,
  Search,
  Ticket,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import api from "@/utils/api";
import { getApiErrorMessage, unwrapApiData } from "@/utils/flightOps";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const statusClass = {
  SCHEDULED: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300",
  BOARDING: "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950/30 dark:text-cyan-300",
  DEPARTED: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/30 dark:text-violet-300",
  ARRIVED: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300",
  CANCELLED: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300",
};

const statusOptions = ["SCHEDULED", "BOARDING", "DEPARTED", "ARRIVED", "CANCELLED"];

const formatDate = (value) => (value ? String(value).slice(0, 10) : "");

const formatDateTime = (value) => {
  if (!value) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const shortAirport = (airport, fallback = "N/A") => airport?.iataCode || fallback;

const getAirportId = (airport) => airport?.id || airport?.airportId;

const numberValue = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getAvailableSeats = (instance) => numberValue(instance.availableSeats ?? instance.totalAvailableSeats);
const getTotalSeats = (instance) => numberValue(instance.totalSeats);

const buildTravelerSearchPath = (instance) => {
  const from = getAirportId(instance.departureAirport);
  const to = getAirportId(instance.arrivalAirport);
  const depart = formatDate(instance.departureDateTime);
  if (!from || !to || !depart) return "";

  const params = new URLSearchParams({
    from: String(from),
    to: String(to),
    depart,
    passengers: "1",
    cabinClass: "ECONOMY",
    trip: "oneway",
  });

  return `/search?${params.toString()}`;
};

const MetricCard = ({ icon: Icon, label, value, detail, tone = "primary" }) => {
  const tones = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    red: "bg-red-500/10 text-red-600 dark:text-red-300",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
  };

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-md", tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-semibold text-foreground">{value}</p>
          <p className="text-sm font-medium text-foreground">{label}</p>
          {detail && <p className="mt-1 truncate text-xs text-muted-foreground">{detail}</p>}
        </div>
      </CardContent>
    </Card>
  );
};

const FlightInventory = () => {
  const [instances, setInstances] = useState([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [stats, setStats] = useState({ total: 0, live: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    query: "",
    status: "all",
    date: "",
  });

  const loadInventory = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [inventoryResponse, summaryResponse] = await Promise.all([
        api.get("/api/flight-instances/list", {
          params: { page: 0, size: 500, sort: "departureDateTime,asc" },
        }),
        api.get("/api/flight-instances/inventory-summary"),
      ]);
      const inventoryPage = unwrapApiData(inventoryResponse) || {};
      const summary = unwrapApiData(summaryResponse) || {};
      const content = Array.isArray(inventoryPage.content) ? inventoryPage.content : [];

      setInstances(content);
      setStats({
        total: summary.totalInstances || inventoryPage.totalElements || content.length,
        live: summary.liveOperations || content.filter((item) => item.status !== "CANCELLED").length,
        cancelled: summary.cancelledInstances || content.filter((item) => item.status === "CANCELLED").length,
      });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to load flight inventory"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timerId = window.setTimeout(loadInventory, 0);
    return () => window.clearTimeout(timerId);
  }, [loadInventory]);

  const filteredInstances = useMemo(() => {
    const keyword = filters.query.trim().toLowerCase();

    return instances.filter((instance) => {
      if (filters.status !== "all" && instance.status !== filters.status) return false;
      if (filters.date && formatDate(instance.departureDateTime) !== filters.date) return false;

      if (!keyword) return true;

      const haystack = [
        instance.id,
        instance.flightId,
        instance.flightNumber,
        instance.airlineName,
        instance.aircraftCode,
        instance.aircraftModal,
        shortAirport(instance.departureAirport),
        shortAirport(instance.arrivalAirport),
        instance.departureAirport?.name,
        instance.arrivalAirport?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(keyword);
    });
  }, [filters.date, filters.query, filters.status, instances]);

  const totalPages = Math.max(Math.ceil(filteredInstances.length / pageSize), 1);
  const safePage = Math.min(page, totalPages - 1);
  const visibleInstances = filteredInstances.slice(safePage * pageSize, safePage * pageSize + pageSize);
  const startItem = filteredInstances.length === 0 ? 0 : safePage * pageSize + 1;
  const endItem = Math.min((safePage + 1) * pageSize, filteredInstances.length);

  const routeCount = useMemo(() => {
    const routes = new Set(
      instances
        .map((instance) => `${getAirportId(instance.departureAirport)}-${getAirportId(instance.arrivalAirport)}`)
        .filter((key) => !key.includes("undefined")),
    );
    return routes.size;
  }, [instances]);

  const missingRefs = useMemo(
    () => instances.filter((instance) => !instance.airlineName || !instance.aircraftCode || !instance.departureAirport || !instance.arrivalAirport).length,
    [instances],
  );

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(0);
  };

  const resetFilters = () => {
    setFilters({ query: "", status: "all", date: "" });
    setPage(0);
  };

  const copyTravelerUrl = async (instance) => {
    const path = buildTravelerSearchPath(instance);
    if (!path) {
      toast.warning("This flight instance is missing route or departure date data.");
      return;
    }

    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      toast.success("Traveler search URL copied");
    } catch {
      toast.error("Unable to copy URL from this browser context");
    }
  };

  return (
    <div className="min-w-0 max-w-full space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 lg:flex-row lg:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="outline" className="gap-1 rounded-md">
              <Plane className="h-3.5 w-3.5" />
              Read-only oversight
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Flight Inventory</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            System-wide flight instance inventory for support, search validation, and operational review.
          </p>
        </div>
        <Button variant="outline" onClick={loadInventory} disabled={loading}>
          <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard icon={Plane} label="Total instances" value={stats.total} detail="System-wide records" />
        <MetricCard icon={Activity} label="Live operations" value={stats.live} detail="Not cancelled" tone="emerald" />
        <MetricCard icon={Route} label="Routes" value={routeCount} detail="Unique route pairs loaded" />
        <MetricCard icon={AlertTriangle} label="Missing refs" value={missingRefs} detail="Airline, aircraft, or airport" tone={missingRefs > 0 ? "amber" : "emerald"} />
      </div>

      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <CardTitle>Flight instances</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Showing {startItem}-{endItem} of {filteredInstances.length} loaded records
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_160px_160px_120px_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={filters.query}
                  onChange={(event) => updateFilter("query", event.target.value)}
                  placeholder="Search flight, route, airline..."
                  className="pl-9"
                />
              </div>

              <Select value={filters.status} onValueChange={(value) => updateFilter("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={filters.date}
                onChange={(event) => updateFilter("date", event.target.value)}
              />

              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setPage(0);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50, 100].map((size) => (
                    <SelectItem key={size} value={String(size)}>{size} rows</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={resetFilters}>
                Reset
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {error && (
            <div className="m-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Loading flight inventory...
            </div>
          )}

          {!loading && !error && visibleInstances.length === 0 && (
            <div className="py-20 text-center">
              <XCircle className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">No flight instances match the current filters.</p>
            </div>
          )}

          {!loading && visibleInstances.length > 0 && (
            <div className="w-full overflow-x-auto">
              <Table className="min-w-[1180px] table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[280px]">Flight</TableHead>
                    <TableHead className="w-[220px]">Route</TableHead>
                    <TableHead className="w-[260px]">Schedule</TableHead>
                    <TableHead className="w-[150px]">Seats</TableHead>
                    <TableHead className="w-[140px]">Status</TableHead>
                    <TableHead className="w-[130px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleInstances.map((instance) => {
                    const availableSeats = getAvailableSeats(instance);
                    const totalSeats = getTotalSeats(instance);
                    const travelerPath = buildTravelerSearchPath(instance);
                    const missingReference = !instance.airlineName || !instance.aircraftCode || !instance.departureAirport || !instance.arrivalAirport;

                    return (
                      <TableRow key={instance.id}>
                        <TableCell>
                          <div className="min-w-0">
                            <p className="truncate font-semibold">
                              {instance.flightNumber || `Flight #${instance.flightId}`}
                            </p>
                            <p className="mt-1 truncate text-xs text-muted-foreground">
                              {instance.airlineName || "Airline unavailable"} · {instance.aircraftCode || instance.aircraftModal || "Aircraft unavailable"}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Instance #{instance.id} · Flight #{instance.flightId || "N/A"}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="min-w-0">
                            <p className="font-semibold">
                              {shortAirport(instance.departureAirport)} → {shortAirport(instance.arrivalAirport)}
                            </p>
                            <p className="mt-1 truncate text-xs text-muted-foreground">
                              {instance.departureAirport?.name || "Origin missing"} to {instance.arrivalAirport?.name || "Destination missing"}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <p className="flex items-center gap-2">
                              <CalendarDays className="h-4 w-4 text-muted-foreground" />
                              {formatDateTime(instance.departureDateTime)}
                            </p>
                            <p className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              Arrives {formatDateTime(instance.arrivalDateTime)}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-semibold">{availableSeats}/{totalSeats || "N/A"}</p>
                            <p className="text-xs text-muted-foreground">available seats</p>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-2">
                            <Badge variant="outline" className={cn("rounded-md", statusClass[instance.status] || "bg-muted text-muted-foreground")}>
                              {instance.status || "UNKNOWN"}
                            </Badge>
                            {missingReference && (
                              <Badge variant="outline" className="rounded-md border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                                Missing ref
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => copyTravelerUrl(instance)}
                              disabled={!travelerPath}
                              title="Copy traveler search URL"
                              aria-label="Copy traveler search URL"
                            >
                              <Clipboard className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => toast.info("Use Search Data to validate fare, cabin, and booking readiness for this route.")}
                              title="Review in Search Data"
                              aria-label="Review in Search Data"
                            >
                              <Ticket className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {filteredInstances.length > 0 && (
            <div className="flex flex-col items-center justify-between gap-3 border-t p-4 sm:flex-row">
              <p className="text-sm text-muted-foreground">
                Page {safePage + 1} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setPage(0)} disabled={loading || safePage === 0}>
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setPage((current) => Math.max(current - 1, 0))} disabled={loading || safePage === 0}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setPage((current) => Math.min(current + 1, totalPages - 1))} disabled={loading || safePage >= totalPages - 1}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setPage(totalPages - 1)} disabled={loading || safePage >= totalPages - 1}>
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FlightInventory;
