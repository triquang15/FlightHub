import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Database,
  Plane,
  RefreshCw,
  Route,
  Search,
  Users,
} from "lucide-react";

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

const cabinOptions = ["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"];

const formatDate = (value) => {
  if (!value) return "";
  return String(value).slice(0, 10);
};

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
  const code = airport.iataCode ? `${airport.iataCode} - ` : "";
  return `${code}${airport.name || airport.city?.name || "Airport"}`;
};

const getAirportId = (airport) => airport?.id || airport?.airportId;
const getRouteKey = (instance) => {
  const fromId = getAirportId(instance.departureAirport);
  const toId = getAirportId(instance.arrivalAirport);
  const date = formatDate(instance.departureDateTime);
  if (!fromId || !toId || !date) return null;
  return `${fromId}-${toId}-${date}`;
};

const getFareAmount = (flight) =>
  flight?.fare?.totalPrice ?? flight?.fare?.currentPrice ?? flight?.fare?.baseFare;

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
          params: { page: 0, size: 250, sort: "departureDateTime,asc" },
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

  const routeSamples = useMemo(() => {
    const routeMap = new Map();

    inventory.forEach((instance) => {
      const key = getRouteKey(instance);
      if (!key) return;

      const existing = routeMap.get(key);
      const availableSeats = Number(instance.availableSeats || 0);
      if (existing) {
        existing.instances += 1;
        existing.availableSeats += availableSeats;
        existing.flightNumbers.push(instance.flightNumber || `Flight #${instance.flightId}`);
        return;
      }

      routeMap.set(key, {
        key,
        departureAirport: instance.departureAirport,
        arrivalAirport: instance.arrivalAirport,
        departureAirportId: getAirportId(instance.departureAirport),
        arrivalAirportId: getAirportId(instance.arrivalAirport),
        departureDate: formatDate(instance.departureDateTime),
        instances: 1,
        availableSeats,
        flightNumbers: [instance.flightNumber || `Flight #${instance.flightId}`],
      });
    });

    return [...routeMap.values()]
      .sort((left, right) => {
        const dateSort = left.departureDate.localeCompare(right.departureDate);
        if (dateSort !== 0) return dateSort;
        return right.availableSeats - left.availableSeats;
      })
      .slice(0, 24);
  }, [inventory]);

  const airportById = useMemo(() => {
    const airportMap = new Map();
    airports.forEach((airport) => airportMap.set(String(airport.id), airport));
    return airportMap;
  }, [airports]);

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

  const runSearch = async () => {
    if (!filters.departureAirportId || !filters.arrivalAirportId || !filters.departureDate) {
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
      setSearchResults(Array.isArray(payload.content) ? payload.content : []);
      setSearchMeta({ totalElements: payload.totalElements || 0 });
    } catch (error) {
      setSearchResults([]);
      setSearchMeta({ totalElements: 0 });
      setSearchError(getApiErrorMessage(error, "Unable to run flight search"));
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="min-w-0 max-w-full space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 lg:flex-row lg:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="outline" className="gap-1 rounded-md">
              <Database className="h-3.5 w-3.5" />
              Support data
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Search Data Inspector</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Review which routes and dates are searchable before testing traveler booking flows.
          </p>
        </div>
        <Button variant="outline" onClick={loadReferenceData} disabled={loadingInventory}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loadingInventory ? "animate-spin" : ""}`} />
          Refresh data
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Flight instances", value: inventoryStats.total, icon: Plane },
          { label: "Live operations", value: inventoryStats.live, icon: CheckCircle2 },
          { label: "Route/date samples", value: routeSamples.length, icon: Route },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {inventoryError && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <span>{inventoryError}</span>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="h-4 w-4 text-primary" />
              Run traveler search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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

            {searchError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {searchError}
              </div>
            )}

            <Button onClick={runSearch} disabled={searching} className="w-full">
              <Search className="mr-2 h-4 w-4" />
              {searching ? "Searching..." : "Validate search"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4 text-primary" />
              Known searchable route/date samples
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-[520px] space-y-3 overflow-y-auto">
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
                className="w-full rounded-lg border bg-card p-4 text-left transition hover:border-primary/50 hover:bg-primary/5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">
                      {sample.departureAirport?.iataCode || sample.departureAirportId} to{" "}
                      {sample.arrivalAirport?.iataCode || sample.arrivalAirportId}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {sample.departureDate} · {sample.instances} instance{sample.instances > 1 ? "s" : ""} ·{" "}
                      {sample.availableSeats} seats available
                    </p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {sample.flightNumbers.slice(0, 3).join(", ")}
                    </p>
                  </div>
                  <Badge variant="secondary" className="w-fit rounded-md">
                    Use sample
                  </Badge>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plane className="h-4 w-4 text-primary" />
            Search results
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {searchMeta.totalElements} matching flight{searchMeta.totalElements === 1 ? "" : "s"}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {!searching && !searchError && searchResults.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Run a search or select a sample to inspect bookable flights.
            </p>
          )}
          {searching && (
            <p className="py-8 text-center text-sm text-muted-foreground">Checking traveler search...</p>
          )}
          {searchResults.map((flight) => (
            <div key={flight.id} className="rounded-lg border p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-semibold">
                    {flight.airlineName || "Airline"} {flight.flightNumber || `#${flight.flightId}`} ·{" "}
                    {flight.departureAirport?.iataCode || "FROM"} to {flight.arrivalAirport?.iataCode || "TO"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatTime(flight.departureDateTime)} - {formatTime(flight.arrivalDateTime)} ·{" "}
                    {flight.availableSeats ?? 0} seats available
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="rounded-md">
                    <Users className="mr-1 h-3.5 w-3.5" />
                    {flight.fare?.cabinClass || filters.cabinClass}
                  </Badge>
                  <Badge className="rounded-md">
                    {formatMoney(getFareAmount(flight), flight.fare?.currency || "USD")}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default SearchDataInspector;
