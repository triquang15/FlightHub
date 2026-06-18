import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Plane, Plus, Search, XCircle } from "lucide-react";
import { toast } from "sonner";

import FlightCard from "./FlightCard";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { deleteFlight } from "@/Redux/flight/flightThunk";

const normalize = (value) => String(value || "").trim().toLowerCase();

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
        flight.departureAirport?.iataCode,
        flight.departureAirport?.name,
        flight.arrivalAirport?.iataCode,
        flight.arrivalAirport?.name,
        flight.aircraft?.code,
        flight.aircraft?.model,
      ].map(normalize).join(" ");
      return matchesStatus && (!keyword || searchable.includes(keyword));
    });
  }, [flights, query, status]);

  const scheduledCount = flights.filter((flight) => flight.status === "SCHEDULED").length;
  const cancelledCount = flights.filter((flight) => flight.status === "CANCELLED").length;

  const cancelFlight = async () => {
    if (!flightToCancel) return;
    try {
      await dispatch(deleteFlight(flightToCancel.id)).unwrap();
      toast.success(`${flightToCancel.flightNumber || "Flight"} cancelled. Operational history was preserved.`);
      setFlightToCancel(null);
    } catch (cancelError) {
      toast.error(cancelError || "Unable to cancel flight");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Flight definitions</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage reusable routes and assigned aircraft. Dated operations are managed under Flight Instances.
          </p>
        </div>
        <Button size="sm" onClick={() => navigate("/airline/flights/new")}>
          <Plus /> Add flight
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Total definitions", value: flights.length, icon: Plane },
          { label: "Scheduled", value: scheduledCount, icon: Plane },
          { label: "Cancelled", value: cancelledCount, icon: XCircle },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3">
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
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search flight number, route, or aircraft"
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
              {flights.length === 0 ? "Create the first reusable flight definition for your airline." : "Adjust the search or status filter."}
            </p>
            {flights.length === 0 ? <Button size="sm" className="mt-4" onClick={() => navigate("/airline/flights/new")}><Plus /> Add flight</Button> : null}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Showing {visibleFlights.length} of {flights.length} flight definitions</p>
          {visibleFlights.map((flight) => (
            <FlightCard
              key={flight.id}
              flight={flight}
              onEdit={() => navigate(`/airline/flights/${flight.id}/edit`)}
              onCancel={() => setFlightToCancel(flight)}
              onView={() => navigate(`/airline/flights/${flight.id}`)}
            />
          ))}
        </div>
      )}

      <AlertDialog open={Boolean(flightToCancel)} onOpenChange={(open) => !open && setFlightToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia><AlertCircle className="text-destructive" /></AlertDialogMedia>
            <AlertDialogTitle>Cancel {flightToCancel?.flightNumber || "flight"}?</AlertDialogTitle>
            <AlertDialogDescription>
              This soft-cancels the flight definition and preserves its operational history. Existing dated instances are managed separately.
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
