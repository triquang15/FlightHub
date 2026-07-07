import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clipboard,
  Database,
  Plane,
  RefreshCw,
  Route,
  Search,
  Ticket,
  Users,
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
import { cn } from "@/lib/utils";

const cabinOptions = ["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"];

const formatDate = (value) => (value ? String(value).slice(0, 10) : "");

const formatTime = (value) => {
  if (!value) return "--:--";
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const formatMoney = (amount, currency = "USD") => {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "No fare";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
};

const airportLabel = (airport) => {
  if (!airport) return "Unknown airport";
  const code = airport.iataCode ? `${airport.iataCode} · ` : "";
  const city = airport.city?.name ? `, ${airport.city.name}` : "";
  return `${code}${airport.name || "Airport"}${city}`;
};

const shortAirport = (airport, fallback) => airport?.iataCode || fallback || "N/A";
const getAirportId = (airport) => airport?.id || airport?.airportId;
const getFareAmount = (flight) =>
  flight?.fare?.totalPrice ?? flight?.fare?.currentPrice ?? flight?.fare?.baseFare;

const getFlightId = (flight) => flight?.flightId || flight?.flight?.id || flight?.id;
const getFlightInstanceId = (flight) => flight?.flightInstanceId || flight?.id;

const routeKeyOf = (instance) => {
  const fromId = getAirportId(instance.departureAirport);
  const toId = getAirportId(instance.arrivalAirport);
  const date = formatDate(instance.departureDateTime);
  if (!fromId || !toId || !date) return null;
  return `${fromId}-${toId}-${date}`;
};

const numberValue = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const buildTravelerUrl = ({ departureAirportId, arrivalAirportId, departureDate, passengers, cabinClass }) => {
  const params = new URLSearchParams({
    from: String(departureAirportId || ""),
    to: String(arrivalAirportId || ""),
    depart: departureDate || "",
    passengers: String(passengers || 1),
    cabinClass: cabinClass || "ECONOMY",
    trip: "oneway",
  });

  return `/search?${params.toString()}`;
};

const HealthBadge = ({ ok, children }) => (
  <Badge
    variant="outline"
    className={cn(
      "rounded-md",
      ok
        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
        : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300",
    )}
  >
    {ok ? <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> : <AlertCircle className="mr-1 h-3.5 w-3.5" />}
    {children}
  </Badge>
);

const MetricCard = ({ icon: Icon, label, value, detail }) => (
  <Card>
    <CardContent className="flex items-center gap-4 p-5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
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

const SearchDataInspector = () => {
  const [airports, setAirports] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [inventoryStats, setInventoryStats] = useState({ total: 0, live: 0, cancelled: 0 });
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [inventoryError, setInventoryError] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchMeta, setSearchMeta] = useState({ totalElements: 0 });
  const [filters, setFilters] = useState({
    departureAirportId: "",
    arrivalAirportId: "",
    departureDate: "",
    passengers: 1,
    cabinClass: "ECONOMY",
  });

  const loadReferenceData = useCallback(async () => {
    setLoadingInventory(true);
    setInventoryError("");

    try {
      const [airportsResponse, inventoryResponse, summaryResponse] = await Promise.all([
        api.get("/api/airports", {
          params: { page: 0, size: 200, sortBy: "iataCode", sortDirection: "asc" },
        }),
        api.get("/api/flight-instances/list", {
          params: { page: 0, size: 300, sort: "departureDateTime,asc" },
        }),
        api.get("/api/flight-instances/inventory-summary"),
      ]);

      const airportsPayload = unwrapApiData(airportsResponse) || {};
      const inventoryPayload = unwrapApiData(inventoryResponse) || {};
      const summaryPayload = unwrapApiData(summaryResponse) || {};

      setAirports(Array.isArray(airportsPayload.content) ? airportsPayload.content : []);
      setInventory(Array.isArray(inventoryPayload.content) ? inventoryPayload.content : []);
      setInventoryStats({
        total: summaryPayload.totalInstances || inventoryPayload.totalElements || 0,
        live: summaryPayload.liveOperations || 0,
        cancelled: summaryPayload.cancelledInstances || 0,
      });
    } catch (error) {
      setInventoryError(getApiErrorMessage(error, "Unable to load search reference data"));
    } finally {
      setLoadingInventory(false);
    }
  }, []);

  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  const airportById = useMemo(() => {
    const airportMap = new Map();
    airports.forEach((airport) => airportMap.set(String(airport.id), airport));
    return airportMap;
  }, [airports]);

  const routeSamples = useMemo(() => {
    const routeMap = new Map();

    inventory.forEach((instance) => {
      const key = routeKeyOf(instance);
      if (!key) return;

      const availableSeats = numberValue(instance.availableSeats);
      const flightNumber = instance.flightNumber || `Flight #${instance.flightId}`;
      const existing = routeMap.get(key);

      if (existing) {
        existing.instances += 1;
        existing.availableSeats += availableSeats;
        existing.flightNumbers.add(flightNumber);
        existing.firstDeparture = existing.firstDeparture < instance.departureDateTime
          ? existing.firstDeparture
          : instance.departureDateTime;
        return;
      }

      routeMap.set(key, {
        key,
        departureAirport: instance.departureAirport,
        arrivalAirport: instance.arrivalAirport,
        departureAirportId: getAirportId(instance.departureAirport),
        arrivalAirportId: getAirportId(instance.arrivalAirport),
        departureDate: formatDate(instance.departureDateTime),
        firstDeparture: instance.departureDateTime,
        instances: 1,
        availableSeats,
        flightNumbers: new Set([flightNumber]),
      });
    });

    return [...routeMap.values()]
      .map((sample) => ({ ...sample, flightNumbers: [...sample.flightNumbers] }))
      .sort((left, right) => {
        const dateSort = left.departureDate.localeCompare(right.departureDate);
        if (dateSort !== 0) return dateSort;
        return right.availableSeats - left.availableSeats;
      })
      .slice(0, 30);
  }, [inventory]);

  const selectedTravelerPath = useMemo(() => buildTravelerUrl(filters), [filters]);
  const canRunSearch = filters.departureAirportId && filters.arrivalAirportId && filters.departureDate;

  const applySample = (sample) => {
    setFilters({
      departureAirportId: String(sample.departureAirportId),
      arrivalAirportId: String(sample.arrivalAirportId),
      departureDate: sample.departureDate,
      passengers: 1,
      cabinClass: "ECONOMY",
    });
    setSearchError("");
  };

  const copyTravelerUrl = async () => {
    if (!canRunSearch) {
      toast.warning("Select a route and date before copying the traveler URL.");
      return;
    }

    const origin = window.location.origin || "http://localhost:5173";
    const url = `${origin}${selectedTravelerPath}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Traveler search URL copied");
    } catch {
      toast.error("Unable to copy URL from this browser context");
    }
  };

  const runSearch = async () => {
    if (!canRunSearch) {
      setSearchError("Select origin, destination, and date before running a search.");
      return;
    }

    setSearching(true);
    setSearchError("");

    try {
      const response = await api.get("/api/flights/search", {
        params: {
          departureAirportId: filters.departureAirportId,
          arrivalAirportId: filters.arrivalAirportId,
          departureDate: filters.departureDate,
          passengers: filters.passengers,
          cabinClass: filters.cabinClass,
          page: 0,
          size: 50,
          sortBy: "departure",
          sortOrder: "asc",
        },
      });
      const payload = unwrapApiData(response) || {};
      const content = Array.isArray(payload.content) ? payload.content : [];
      setSearchResults(content);
      setSearchMeta({ totalElements: payload.totalElements || content.length });
    } catch (error) {
      setSearchResults([]);
      setSearchMeta({ totalElements: 0 });
      setSearchError(getApiErrorMessage(error, "Unable to run flight search"));
    } finally {
      setSearching(false);
    }
  };

  const readiness = useMemo(() => {
    const bookable = searchResults.filter((flight) => numberValue(flight.availableSeats) >= Number(filters.passengers || 1));
    const withFare = searchResults.filter((flight) => Number.isFinite(Number(getFareAmount(flight))));
    const withCabin = searchResults.filter((flight) => flight.fare?.cabinClass || filters.cabinClass);

    return [
      {
        label: "Search returns flights",
        ok: searchResults.length > 0,
        detail: `${searchResults.length} result${searchResults.length === 1 ? "" : "s"}`,
      },
      {
        label: "Fare is attached",
        ok: withFare.length > 0,
        detail: `${withFare.length} priced result${withFare.length === 1 ? "" : "s"}`,
      },
      {
        label: "Seat inventory available",
        ok: bookable.length > 0,
        detail: `${bookable.length} result${bookable.length === 1 ? "" : "s"} can cover ${filters.passengers} passenger${filters.passengers === 1 ? "" : "s"}`,
      },
      {
        label: "Cabin is resolved",
        ok: withCabin.length > 0,
        detail: filters.cabinClass.replace("_", " "),
      },
    ];
  }, [filters.cabinClass, filters.passengers, searchResults]);

  return (
    <div className="min-w-0 max-w-full space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 lg:flex-row lg:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="outline" className="gap-1 rounded-md">
              <Database className="h-3.5 w-3.5" />
              Support inspector
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Search Data Inspector</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Read-only operational view for finding route/date/cabin data that can drive traveler booking tests.
          </p>
        </div>
        <Button variant="outline" onClick={loadReferenceData} disabled={loadingInventory}>
          <RefreshCw className={cn("mr-2 h-4 w-4", loadingInventory && "animate-spin")} />
          Refresh data
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard icon={Plane} label="Flight instances" value={inventoryStats.total} detail="Loaded from flight-ops" />
        <MetricCard icon={CheckCircle2} label="Live operations" value={inventoryStats.live} detail="Operational inventory" />
        <MetricCard icon={Route} label="Route/date samples" value={routeSamples.length} detail="Ready for quick testing" />
        <MetricCard icon={XCircle} label="Cancelled" value={inventoryStats.cancelled} detail="Excluded from booking tests" />
      </div>

      {inventoryError && (
        <div className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <span>{inventoryError}</span>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="h-4 w-4 text-primary" />
              Validate Traveler Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">From</label>
                <Select
                  value={filters.departureAirportId}
                  onValueChange={(value) => setFilters((current) => ({ ...current, departureAirportId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select origin" />
                  </SelectTrigger>
                  <SelectContent>
                    {airports.map((airport) => (
                      <SelectItem key={airport.id} value={String(airport.id)}>
                        {airportLabel(airport)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">To</label>
                <Select
                  value={filters.arrivalAirportId}
                  onValueChange={(value) => setFilters((current) => ({ ...current, arrivalAirportId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {airports.map((airport) => (
                      <SelectItem key={airport.id} value={String(airport.id)}>
                        {airportLabel(airport)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Departure date</label>
                <Input
                  type="date"
                  value={filters.departureDate}
                  onChange={(event) => setFilters((current) => ({ ...current, departureDate: event.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Cabin</label>
                <Select
                  value={filters.cabinClass}
                  onValueChange={(value) => setFilters((current) => ({ ...current, cabinClass: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cabinOptions.map((cabin) => (
                      <SelectItem key={cabin} value={cabin}>
                        {cabin.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Passengers</label>
                <Input
                  type="number"
                  min="1"
                  max="9"
                  value={filters.passengers}
                  onChange={(event) => setFilters((current) => ({ ...current, passengers: Number(event.target.value) || 1 }))}
                />
              </div>
            </div>

            <div className="rounded-md border bg-muted/30 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Traveler URL</p>
              <p className="mt-1 break-all text-sm text-foreground">{selectedTravelerPath}</p>
            </div>

            {searchError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {searchError}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <Button onClick={runSearch} disabled={searching || !canRunSearch}>
                <Search className="mr-2 h-4 w-4" />
                {searching ? "Searching..." : "Validate search"}
              </Button>
              <Button variant="outline" onClick={copyTravelerUrl} disabled={!canRunSearch}>
                <Clipboard className="mr-2 h-4 w-4" />
                Copy traveler URL
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4 text-primary" />
              Searchable Route/Date Samples
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-[560px] space-y-3 overflow-y-auto p-4">
            {loadingInventory && (
              <p className="py-8 text-center text-sm text-muted-foreground">Loading inventory...</p>
            )}
            {!loadingInventory && routeSamples.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">No route/date samples found.</p>
            )}
            {routeSamples.map((sample) => (
              <button
                key={sample.key}
                type="button"
                onClick={() => applySample(sample)}
                className="w-full rounded-md border bg-card p-4 text-left transition hover:border-primary/50 hover:bg-primary/5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {shortAirport(sample.departureAirport, sample.departureAirportId)} to{" "}
                      {shortAirport(sample.arrivalAirport, sample.arrivalAirportId)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {sample.departureDate} · first departure {formatTime(sample.firstDeparture)}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {sample.flightNumbers.slice(0, 4).join(", ")}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <HealthBadge ok={sample.instances > 0}>{sample.instances} instance{sample.instances > 1 ? "s" : ""}</HealthBadge>
                    <HealthBadge ok={sample.availableSeats > 0}>{sample.availableSeats} seats</HealthBadge>
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2 text-base">
              <Plane className="h-4 w-4 text-primary" />
              Search Results
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {searchMeta.totalElements} matching flight{searchMeta.totalElements === 1 ? "" : "s"}
            </p>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {!searching && !searchError && searchResults.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Run a search or select a sample to inspect bookable flights.
              </p>
            )}
            {searching && (
              <p className="py-8 text-center text-sm text-muted-foreground">Checking traveler search...</p>
            )}
            {searchResults.map((flight) => {
              const fareAmount = getFareAmount(flight);
              const hasFare = Number.isFinite(Number(fareAmount));
              const hasSeats = numberValue(flight.availableSeats) >= Number(filters.passengers || 1);

              return (
                <div key={getFlightInstanceId(flight)} className="rounded-md border p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold">
                        {flight.airlineName || flight.airline?.name || "Airline"} {flight.flightNumber || `#${getFlightId(flight)}`} ·{" "}
                        {shortAirport(flight.departureAirport, "FROM")} to {shortAirport(flight.arrivalAirport, "TO")}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatTime(flight.departureDateTime)} - {formatTime(flight.arrivalDateTime)} · instance #{getFlightInstanceId(flight)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Flight #{getFlightId(flight)} · {flight.aircraftName || flight.aircraftModel || "Aircraft pending"}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <HealthBadge ok={hasSeats}>{flight.availableSeats ?? 0} seats</HealthBadge>
                      <HealthBadge ok={hasFare}>{hasFare ? "Fare ready" : "Missing fare"}</HealthBadge>
                      <Badge variant="outline" className="rounded-md">
                        <Users className="mr-1 h-3.5 w-3.5" />
                        {flight.fare?.cabinClass || filters.cabinClass}
                      </Badge>
                      <Badge className="rounded-md">
                        {formatMoney(fareAmount, flight.fare?.currency || "USD")}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2 text-base">
              <Ticket className="h-4 w-4 text-primary" />
              Booking Readiness
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {readiness.map((item) => (
              <div key={item.label} className="flex items-start gap-3 rounded-md border p-3">
                <div
                  className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                    item.ok
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-300",
                  )}
                >
                  {item.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                </div>
              </div>
            ))}

            <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
              This inspector is read-only. Fix missing fare, cabin, or seat inventory in Airline Owner modules, then refresh this page.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SearchDataInspector;
