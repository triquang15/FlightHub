import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Edit,
  Eye,
  MapPin,
  Plane,
  Plus,
  Search,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { deleteFlight } from "@/Redux/flight/flightThunk";

const normalize = (value) => String(value || "").trim().toLowerCase();

const statusClass = {
  SCHEDULED: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
  CANCELLED: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300",
};

const airportLabel = (airport) => airport?.iataCode || airport?.name || "---";
const airportCity = (airport) => airport?.city?.name || airport?.name || "Unknown";
const aircraftLabel = (aircraft) => (
  [aircraft?.code, aircraft?.manufacturer, aircraft?.model].filter(Boolean).join(" · ") || "Not assigned"
);

const StatusBadge = ({ status }) => (
  <Badge variant="outline" className={cn("gap-2", statusClass[status] || "")}>
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    {status || "UNKNOWN"}
  </Badge>
);

const FlightManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { flights: flightPayload = [], loading, error } = useSelector((state) => state.flight);
  const flights = useMemo(() => Array.isArray(flightPayload) ? flightPayload : [], [flightPayload]);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [flightToCancel, setFlightToCancel] = useState(null);

  const visibleFlights = useMemo(() => {
    const keyword = normalize(query);
    return flights.filter((flight) => {
      const matchesStatus = status === "ALL" || flight.status === status;
      const searchable = [
        flight.flightNumber,
        airportLabel(flight.departureAirport),
        airportCity(flight.departureAirport),
        airportLabel(flight.arrivalAirport),
        airportCity(flight.arrivalAirport),
        aircraftLabel(flight.aircraft),
      ].map(normalize).join(" ");
      return matchesStatus && (!keyword || searchable.includes(keyword));
    });
  }, [flights, query, status]);

  const scheduledCount = flights.filter((flight) => flight.status === "SCHEDULED").length;
  const cancelledCount = flights.filter((flight) => flight.status === "CANCELLED").length;
  const aircraftAssignedCount = flights.filter((flight) => flight.aircraft?.id).length;

  const cancelFlight = async () => {
    if (!flightToCancel) return;
    try {
      await dispatch(deleteFlight(flightToCancel.id)).unwrap();
      toast.success(`${flightToCancel.flightNumber || "Flight"} cancelled`);
      setFlightToCancel(null);
    } catch (cancelError) {
      toast.error(cancelError || "Unable to cancel flight");
    }
  };

  const renderActions = (flight, mobile = false) => {
    const cancelled = flight.status === "CANCELLED";
    const buttonClass = mobile ? "h-9 w-9" : "h-8 w-8";

    return (
      <TooltipProvider delayDuration={120}>
        <div className="flex items-center justify-end gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={mobile ? "outline" : "ghost"}
                size="icon"
                aria-label="View flight"
                onClick={() => navigate(`/airline/flights/${flight.id}`)}
                className={buttonClass}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>View</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={mobile ? "outline" : "ghost"}
                size="icon"
                aria-label="Edit flight"
                onClick={() => navigate(`/airline/flights/${flight.id}/edit`)}
                disabled={cancelled}
                className={buttonClass}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={mobile ? "outline" : "ghost"}
                size="icon"
                aria-label="Cancel flight"
                onClick={() => setFlightToCancel(flight)}
                disabled={cancelled}
                className={cn(buttonClass, "text-destructive hover:bg-destructive/10 hover:text-destructive")}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{cancelled ? "Cancelled" : "Cancel"}</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    );
  };

  return (
    <div className="min-w-0 max-w-full space-y-5 overflow-hidden lg:space-y-6">
      <div className="flex min-w-0 flex-col gap-4 rounded-lg border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Plane className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">
              Flight Definitions
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Manage reusable route and aircraft pairings. Dates and departure times belong to schedules and instances.
            </p>
          </div>
        </div>
        <Button onClick={() => navigate("/airline/flights/new")} className="shrink-0">
          <Plus className="h-4 w-4" />
          New Flight
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Definitions", value: flights.length, icon: Plane },
          { label: "Scheduled", value: scheduledCount, icon: Plane },
          { label: "Aircraft assigned", value: aircraftAssignedCount, icon: MapPin },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-0.5 text-lg font-semibold">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search flight number, route, city, or aircraft"
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="SCHEDULED">Scheduled</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {error ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading && flights.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Loading flight definitions...</CardContent></Card>
      ) : visibleFlights.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Plane className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">{flights.length === 0 ? "No flight definitions configured" : "No matching flights"}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {flights.length === 0 ? "Create the first reusable route and aircraft pairing." : "Adjust the search or status filter."}
            </p>
            {flights.length === 0 ? (
              <Button size="sm" className="mt-4" onClick={() => navigate("/airline/flights/new")}>
                <Plus className="h-4 w-4" />
                New Flight
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-lg border bg-card lg:block">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="min-w-32">Flight</TableHead>
                    <TableHead className="min-w-48">Route</TableHead>
                    <TableHead className="min-w-56">Aircraft</TableHead>
                    <TableHead className="min-w-36">Status</TableHead>
                    <TableHead className="sticky right-0 z-10 w-32 bg-muted/40 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleFlights.map((flight) => (
                    <TableRow key={flight.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="font-semibold">{flight.flightNumber || `Flight ${flight.id}`}</div>
                        <div className="text-xs text-muted-foreground">ID #{flight.id}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 font-medium">
                          {airportLabel(flight.departureAirport)}
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                          {airportLabel(flight.arrivalAirport)}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {airportCity(flight.departureAirport)} to {airportCity(flight.arrivalAirport)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="truncate font-medium">{aircraftLabel(flight.aircraft)}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {flight.aircraft?.seatingCapacity || flight.aircraft?.totalSeats || 0} seats
                        </div>
                      </TableCell>
                      <TableCell><StatusBadge status={flight.status} /></TableCell>
                      <TableCell className="sticky right-0 z-10 bg-card text-right shadow-[-10px_0_12px_-12px_rgba(15,23,42,0.45)]">
                        {renderActions(flight)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="space-y-3 lg:hidden">
            {visibleFlights.map((flight) => (
              <Card key={flight.id}>
                <CardContent className="space-y-4 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold">{flight.flightNumber || `Flight ${flight.id}`}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {airportLabel(flight.departureAirport)} to {airportLabel(flight.arrivalAirport)}
                      </div>
                    </div>
                    <StatusBadge status={flight.status} />
                  </div>
                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Route cities</p>
                      <p className="mt-1 font-medium">{airportCity(flight.departureAirport)} to {airportCity(flight.arrivalAirport)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Aircraft</p>
                      <p className="mt-1 font-medium">{aircraftLabel(flight.aircraft)}</p>
                    </div>
                  </div>
                  {renderActions(flight, true)}
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">Showing {visibleFlights.length} of {flights.length} flight definitions. {cancelledCount} cancelled.</p>
        </>
      )}

      <AlertDialog open={Boolean(flightToCancel)} onOpenChange={(open) => !open && setFlightToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia><AlertCircle className="text-destructive" /></AlertDialogMedia>
            <AlertDialogTitle>Cancel {flightToCancel?.flightNumber || "flight"}?</AlertDialogTitle>
            <AlertDialogDescription>
              This soft-cancels the flight definition and preserves operational history. Existing schedules and dated instances are managed separately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep scheduled</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={cancelFlight}>Cancel flight</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FlightManagement;
