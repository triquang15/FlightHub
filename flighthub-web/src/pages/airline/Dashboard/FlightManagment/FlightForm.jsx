import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, ArrowRight, Loader2, MapPin, Plane, Save } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { listAircraftOptions } from "@/Redux/aircraft/aircraftThunks";
import { listAllAirports } from "@/Redux/airport/airportThunk";
import { createFlight, getFlightById, updateFlight } from "@/Redux/flight/flightThunk";

const EMPTY_FORM = {
  flightNumber: "",
  aircraftId: "",
  departureAirportId: "",
  arrivalAirportId: "",
};

const toForm = (flight) => ({
  flightNumber: flight?.flightNumber || "",
  aircraftId: flight?.aircraft?.id ? String(flight.aircraft.id) : "",
  departureAirportId: flight?.departureAirport?.id ? String(flight.departureAirport.id) : "",
  arrivalAirportId: flight?.arrivalAirport?.id ? String(flight.arrivalAirport.id) : "",
});

const validate = (form) => {
  const errors = {};
  const number = form.flightNumber.trim().toUpperCase();

  if (!number) errors.flightNumber = "Flight number is required.";
  else if (number.length > 10) errors.flightNumber = "Flight number must be at most 10 characters.";
  if (!form.aircraftId) errors.aircraftId = "Select an aircraft.";
  if (!form.departureAirportId) errors.departureAirportId = "Select a departure airport.";
  if (!form.arrivalAirportId) errors.arrivalAirportId = "Select an arrival airport.";
  if (form.departureAirportId && form.departureAirportId === form.arrivalAirportId) {
    errors.arrivalAirportId = "Arrival airport must differ from departure.";
  }

  return errors;
};

function FieldError({ message }) {
  return message ? <p className="text-xs text-destructive">{message}</p> : null;
}

const FlightForm = () => {
  const { flightId } = useParams();
  const editing = Boolean(flightId);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { flight, loading: flightLoading } = useSelector((state) => state.flight);
  const { airports = [], loading: airportsLoading, error: airportError } = useSelector((state) => state.airport);
  const { aircraftOptions = [] } = useSelector((state) => state.aircraft);

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [hydratedFlightId, setHydratedFlightId] = useState(null);
  const flightMatchesRoute = String(flight?.id) === String(flightId);

  const aircrafts = editing
    && flightMatchesRoute
    && flight?.aircraft
    && !aircraftOptions.some((item) => item.id === flight.aircraft.id)
    ? [flight.aircraft, ...aircraftOptions]
    : aircraftOptions;

  const selectedDeparture = airports.find((airport) => String(airport.id) === form.departureAirportId);
  const selectedArrival = airports.find((airport) => String(airport.id) === form.arrivalAirportId);
  const selectedAircraft = aircrafts.find((aircraft) => String(aircraft.id) === form.aircraftId);

  useEffect(() => {
    dispatch(listAircraftOptions());
    dispatch(listAllAirports({ page: 0, size: 500, sortBy: "iataCode", sortDirection: "asc" }));
    if (editing) dispatch(getFlightById(flightId));
  }, [dispatch, editing, flightId]);

  if (editing && flightMatchesRoute && hydratedFlightId !== flight.id) {
    setHydratedFlightId(flight.id);
    setForm(toForm(flight));
    setErrors({});
  }

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field] && field !== "departureAirportId") return current;
      const next = { ...current };
      delete next[field];
      if (field === "departureAirportId") delete next.arrivalAirportId;
      return next;
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    const payload = {
      flightNumber: form.flightNumber.trim().toUpperCase(),
      aircraftId: Number(form.aircraftId),
      departureAirportId: Number(form.departureAirportId),
      arrivalAirportId: Number(form.arrivalAirportId),
    };

    setSaving(true);
    try {
      if (editing) {
        await dispatch(updateFlight({ id: flightId, flightData: payload })).unwrap();
        toast.success("Flight definition updated");
        navigate(`/airline/flights/${flightId}`);
      } else {
        await dispatch(createFlight(payload)).unwrap();
        toast.success("Flight definition created");
        navigate("/airline/flights");
      }
    } catch (saveError) {
      toast.error(saveError || "Unable to save flight definition");
    } finally {
      setSaving(false);
    }
  };

  if (editing && flightLoading && !flightMatchesRoute) {
    return <Card><CardContent className="py-14 text-center text-sm text-muted-foreground">Loading flight definition...</CardContent></Card>;
  }

  if (editing && !flightLoading && !flightMatchesRoute) {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertDescription>Flight definition could not be loaded.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <Button variant="ghost" size="sm" onClick={() => navigate(editing ? `/airline/flights/${flightId}` : "/airline/flights")}>
        <ArrowLeft /> {editing ? "Back to flight" : "Back to flights"}
      </Button>

      <Card>
        <CardHeader className="border-b">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Plane className="h-4 w-4" />
            </div>
            <div>
              <CardTitle>{editing ? "Edit flight definition" : "Create flight definition"}</CardTitle>
              <CardDescription>
                Configure the reusable route and assigned aircraft. Schedules and travel dates are managed separately.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <form onSubmit={submit}>
          <CardContent className="space-y-7">
            {airportError ? (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription>{airportError}</AlertDescription>
              </Alert>
            ) : null}

            <section className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold">Definition identity</h3>
                <p className="mt-1 text-xs text-muted-foreground">Flight numbers must be unique across FlightHub.</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="flightNumber">Flight number</Label>
                  <Input
                    id="flightNumber"
                    value={form.flightNumber}
                    onChange={(event) => setField("flightNumber", event.target.value.toUpperCase())}
                    placeholder="e.g. VN210"
                    maxLength={10}
                    aria-invalid={Boolean(errors.flightNumber)}
                  />
                  <FieldError message={errors.flightNumber} />
                </div>

                <div className="space-y-2">
                  <Label>Assigned aircraft</Label>
                  <Select value={form.aircraftId} onValueChange={(value) => setField("aircraftId", value)}>
                    <SelectTrigger className="w-full" aria-invalid={Boolean(errors.aircraftId)}>
                      <SelectValue placeholder="Select an owned aircraft" />
                    </SelectTrigger>
                    <SelectContent>
                      {aircrafts.map((aircraft) => (
                        <SelectItem key={aircraft.id} value={String(aircraft.id)}>
                          {aircraft.code} · {aircraft.manufacturer} {aircraft.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError message={errors.aircraftId} />
                </div>
              </div>
            </section>

            <Separator />

            <section className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold">Route</h3>
                <p className="mt-1 text-xs text-muted-foreground">Departure and arrival airports must be different.</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Departure airport</Label>
                  <Select value={form.departureAirportId} onValueChange={(value) => setField("departureAirportId", value)}>
                    <SelectTrigger className="w-full" aria-invalid={Boolean(errors.departureAirportId)}>
                      <SelectValue placeholder={airportsLoading ? "Loading airports..." : "Select departure airport"} />
                    </SelectTrigger>
                    <SelectContent>
                      {airports.map((airport) => <SelectItem key={airport.id} value={String(airport.id)}>{airport.iataCode} · {airport.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FieldError message={errors.departureAirportId} />
                </div>

                <div className="space-y-2">
                  <Label>Arrival airport</Label>
                  <Select value={form.arrivalAirportId} onValueChange={(value) => setField("arrivalAirportId", value)}>
                    <SelectTrigger className="w-full" aria-invalid={Boolean(errors.arrivalAirportId)}>
                      <SelectValue placeholder={airportsLoading ? "Loading airports..." : "Select arrival airport"} />
                    </SelectTrigger>
                    <SelectContent>
                      {airports.map((airport) => (
                        <SelectItem key={airport.id} value={String(airport.id)} disabled={String(airport.id) === form.departureAirportId}>
                          {airport.iataCode} · {airport.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError message={errors.arrivalAirportId} />
                </div>
              </div>

              <div className="grid items-center gap-3 rounded-md border bg-muted/20 p-4 sm:grid-cols-[1fr_auto_1fr]">
                <div>
                  <p className="text-xs text-muted-foreground">Departure</p>
                  <p className="mt-1 font-medium">{selectedDeparture?.iataCode || "---"} · {selectedDeparture?.city?.name || "Select airport"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{selectedDeparture?.timeZone || "Timezone unavailable"}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div className="sm:text-right">
                  <p className="text-xs text-muted-foreground">Arrival</p>
                  <p className="mt-1 font-medium">{selectedArrival?.iataCode || "---"} · {selectedArrival?.city?.name || "Select airport"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{selectedArrival?.timeZone || "Timezone unavailable"}</p>
                </div>
              </div>
            </section>

            {selectedAircraft ? (
              <div className="flex items-start gap-3 rounded-md border p-4">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{selectedAircraft.code} · {selectedAircraft.manufacturer} {selectedAircraft.model}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {selectedAircraft.seatingCapacity || selectedAircraft.totalSeats || 0} seats. Aircraft ownership is validated by the backend.
                  </p>
                </div>
                {editing ? <Badge variant="outline" className="ml-auto">{flight.status}</Badge> : null}
              </div>
            ) : null}
          </CardContent>

          <div className="flex flex-col-reverse gap-2 border-t bg-muted/30 p-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => navigate(editing ? `/airline/flights/${flightId}` : "/airline/flights")} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || airportsLoading || aircrafts.length === 0}>
              {saving ? <Loader2 className="animate-spin" /> : <Save />}
              {saving ? "Saving" : editing ? "Update definition" : "Create definition"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default FlightForm;
