import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, CalendarDays, Clock, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { getFlightsByAirline } from "@/Redux/flight/flightThunk";
import { createFlightSchedule, getFlightScheduleById, updateFlightSchedule } from "@/Redux/flightSchedule/flightScheduleThunk";
import { ALL_OPERATING_DAYS } from "@/utils/flightOps";
import { daysOfWeek } from "./daysOfWeek";

const EMPTY_FORM = {
  flightId: "",
  departureTime: "",
  arrivalTime: "",
  recurrenceType: "DAILY",
  operatingDays: ALL_OPERATING_DAYS,
  startDate: "",
  endDate: "",
  isActive: true,
};

const toForm = (schedule) => ({
  flightId: schedule?.flightId ? String(schedule.flightId) : "",
  departureTime: schedule?.departureTime?.slice(0, 5) || "",
  arrivalTime: schedule?.arrivalTime?.slice(0, 5) || "",
  recurrenceType: schedule?.recurrenceType || "DAILY",
  operatingDays: schedule?.operatingDays?.length ? schedule.operatingDays : ALL_OPERATING_DAYS,
  startDate: schedule?.startDate || "",
  endDate: schedule?.endDate || "",
  isActive: schedule?.isActive !== false,
});

const localToday = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

const validate = (form, editing) => {
  const errors = {};
  const today = localToday();

  if (!form.flightId) errors.flightId = "Select a flight definition.";
  if (!form.departureTime) errors.departureTime = "Departure time is required.";
  if (!form.arrivalTime) errors.arrivalTime = "Arrival time is required.";
  if (!form.startDate) errors.startDate = "Start date is required.";
  else if (!editing && form.startDate < today) errors.startDate = "A new schedule cannot start in the past.";
  if (!form.endDate) errors.endDate = "End date is required.";
  else if (form.startDate && form.endDate < form.startDate) errors.endDate = "End date cannot be before start date.";
  if (!form.operatingDays.length) errors.operatingDays = "Select at least one operating day.";

  return errors;
};

const ErrorText = ({ message }) => message ? <p className="text-xs text-destructive">{message}</p> : null;

const FlightScheduleForm = () => {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { flights: flightPayload = [], loading: flightsLoading } = useSelector((state) => state.flight);
  const { currentFlightSchedule, loading: scheduleLoading } = useSelector((state) => state.flightSchedule);
  const flights = Array.isArray(flightPayload) ? flightPayload : [];
  const scheduleMatchesRoute = String(currentFlightSchedule?.id) === String(id);

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [hydratedScheduleId, setHydratedScheduleId] = useState(null);

  useEffect(() => {
    dispatch(getFlightsByAirline());
    if (editing) dispatch(getFlightScheduleById(id));
  }, [dispatch, editing, id]);

  if (editing && scheduleMatchesRoute && hydratedScheduleId !== currentFlightSchedule.id) {
    setHydratedScheduleId(currentFlightSchedule.id);
    setForm(toForm(currentFlightSchedule));
    setErrors({});
  }

  const selectedFlight = flights.find((flight) => String(flight.id) === form.flightId);
  const activeFlight = editing && scheduleMatchesRoute && !selectedFlight
    ? {
        id: currentFlightSchedule.flightId,
        flightNumber: currentFlightSchedule.flightNumber,
        departureAirport: currentFlightSchedule.departureAirport,
        arrivalAirport: currentFlightSchedule.arrivalAirport,
      }
    : selectedFlight;

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const setRecurrence = (value) => {
    setForm((current) => ({
      ...current,
      recurrenceType: value,
      operatingDays: value === "DAILY" ? ALL_OPERATING_DAYS : current.recurrenceType === "DAILY" ? [] : current.operatingDays,
    }));
    setErrors((current) => ({ ...current, operatingDays: undefined }));
  };

  const toggleDay = (day, checked) => {
    const operatingDays = checked
      ? [...new Set([...form.operatingDays, day])]
      : form.operatingDays.filter((item) => item !== day);
    setField("operatingDays", operatingDays);
  };

  const submit = async (event) => {
    event.preventDefault();
    const validationErrors = validate(form, editing);
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    const payload = {
      flightId: Number(form.flightId),
      departureTime: form.departureTime,
      arrivalTime: form.arrivalTime,
      recurrenceType: form.recurrenceType,
      operatingDays: form.recurrenceType === "DAILY" ? ALL_OPERATING_DAYS : form.operatingDays,
      startDate: form.startDate,
      endDate: form.endDate,
      isActive: form.isActive,
    };

    setSaving(true);
    try {
      if (editing) {
        await dispatch(updateFlightSchedule({ id, data: payload })).unwrap();
        toast.success("Flight schedule updated and instances synchronized");
        navigate(`/airline/schedules/${id}`);
      } else {
        await dispatch(createFlightSchedule(payload)).unwrap();
        toast.success("Flight schedule created and instances generated");
        navigate("/airline/schedules");
      }
    } catch (saveError) {
      toast.error(saveError || "Unable to save flight schedule");
    } finally {
      setSaving(false);
    }
  };

  if (editing && scheduleLoading && !scheduleMatchesRoute) {
    return <Card><CardContent className="py-14 text-center text-sm text-muted-foreground">Loading flight schedule...</CardContent></Card>;
  }

  if (editing && !scheduleLoading && !scheduleMatchesRoute) {
    return <Alert variant="destructive"><AlertCircle /><AlertDescription>Flight schedule could not be loaded.</AlertDescription></Alert>;
  }

  const localClockSuggestsOvernight = form.departureTime && form.arrivalTime && form.arrivalTime <= form.departureTime;
  const selectedDays = form.recurrenceType === "DAILY" ? ALL_OPERATING_DAYS : form.operatingDays;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <Button variant="ghost" size="sm" onClick={() => navigate(editing ? `/airline/schedules/${id}` : "/airline/schedules")}>
        <ArrowLeft /> {editing ? "Back to schedule" : "Back to schedules"}
      </Button>

      <form onSubmit={submit} className="space-y-5">
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"><CalendarDays className="h-4 w-4" /></div>
              <div>
                <CardTitle>{editing ? "Edit flight schedule" : "Create flight schedule"}</CardTitle>
                <CardDescription>Define recurring operating days and local airport times. Flight instances are generated idempotently.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Flight definition</Label>
              <Select value={form.flightId} onValueChange={(value) => setField("flightId", value)} disabled={editing}>
                <SelectTrigger className="w-full" aria-invalid={Boolean(errors.flightId)}>
                  <SelectValue placeholder={flightsLoading ? "Loading flights..." : "Select a scheduled flight definition"} />
                </SelectTrigger>
                <SelectContent>
                  {activeFlight && !flights.some((flight) => flight.id === activeFlight.id) ? (
                    <SelectItem value={String(activeFlight.id)}>{activeFlight.flightNumber}</SelectItem>
                  ) : null}
                  {flights.filter((flight) => flight.status !== "CANCELLED").map((flight) => (
                    <SelectItem key={flight.id} value={String(flight.id)}>
                      {flight.flightNumber} · {flight.departureAirport?.iataCode || "---"} to {flight.arrivalAirport?.iataCode || "---"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ErrorText message={errors.flightId} />
              {editing ? <p className="text-xs text-muted-foreground">Flight ownership and route cannot be changed after schedule creation.</p> : null}
            </div>

            {activeFlight ? (
              <div className="grid gap-4 rounded-md border bg-muted/20 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Departure airport</p>
                  <p className="mt-1 text-sm font-medium">{activeFlight.departureAirport?.iataCode || "---"} · {activeFlight.departureAirport?.name || "Unavailable"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{activeFlight.departureAirport?.timeZone || "Timezone unavailable"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Arrival airport</p>
                  <p className="mt-1 text-sm font-medium">{activeFlight.arrivalAirport?.iataCode || "---"} · {activeFlight.arrivalAirport?.name || "Unavailable"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{activeFlight.arrivalAirport?.timeZone || "Timezone unavailable"}</p>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Operating pattern</CardTitle>
              <CardDescription>Times are entered in each airport's local timezone.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="departureTime">Departure local time</Label>
                  <Input id="departureTime" type="time" value={form.departureTime} onChange={(event) => setField("departureTime", event.target.value)} aria-invalid={Boolean(errors.departureTime)} />
                  <ErrorText message={errors.departureTime} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="arrivalTime">Arrival local time</Label>
                  <Input id="arrivalTime" type="time" value={form.arrivalTime} onChange={(event) => setField("arrivalTime", event.target.value)} aria-invalid={Boolean(errors.arrivalTime)} />
                  <ErrorText message={errors.arrivalTime} />
                </div>
              </div>

              {localClockSuggestsOvernight ? (
                <Alert>
                  <Clock />
                  <AlertDescription>
                    Arrival local time is not later than departure local time. The backend will resolve the arrival date using both airport timezones and roll forward when required.
                  </AlertDescription>
                </Alert>
              ) : null}

              <Separator />

              <div className="space-y-2">
                <Label>Recurrence pattern</Label>
                <Select value={form.recurrenceType} onValueChange={setRecurrence}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">Daily</SelectItem>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                    <SelectItem value="CUSTOM">Custom days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Operating days</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {daysOfWeek.map((day) => {
                    const checked = selectedDays.includes(day.id);
                    return (
                      <label key={day.id} className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm ${checked ? "border-primary/40 bg-primary/5" : ""}`}>
                        <Checkbox checked={checked} disabled={form.recurrenceType === "DAILY"} onCheckedChange={(value) => toggleDay(day.id, value === true)} />
                        {day.short}
                      </label>
                    );
                  })}
                </div>
                <ErrorText message={errors.operatingDays} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Effective period</CardTitle>
              <CardDescription>Instances are generated for matching operating days in this range.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start date</Label>
                <Input id="startDate" type="date" value={form.startDate} onChange={(event) => setField("startDate", event.target.value)} aria-invalid={Boolean(errors.startDate)} />
                <ErrorText message={errors.startDate} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End date</Label>
                <Input id="endDate" type="date" value={form.endDate} min={form.startDate || undefined} onChange={(event) => setField("endDate", event.target.value)} aria-invalid={Boolean(errors.endDate)} />
                <ErrorText message={errors.endDate} />
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor="isActive">Active schedule</Label>
                  <p className="mt-1 text-xs text-muted-foreground">Active schedules generate missing flight instances when saved.</p>
                </div>
                <Switch id="isActive" checked={form.isActive} onCheckedChange={(value) => setField("isActive", value)} />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedDays.map((day) => <Badge key={day} variant="outline">{daysOfWeek.find((item) => item.id === day)?.short}</Badge>)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col-reverse gap-2 rounded-md border bg-muted/30 p-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => navigate(editing ? `/airline/schedules/${id}` : "/airline/schedules")} disabled={saving}>Cancel</Button>
          <Button type="submit" disabled={saving || flightsLoading}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />}
            {saving ? "Saving" : editing ? "Update schedule" : "Create schedule"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default FlightScheduleForm;
