import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Coffee,
  DollarSign,
  Edit,
  MapPin,
  Plane,
  Settings,
  UtensilsCrossed,
  Users,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { getCabinClassesByAircraft } from "@/Redux/cabinClass/cabinClassThunk";
import { getFlightCabinAncillariesByFlightAndCabinClass } from "@/Redux/flightCabinAncillary/flightCabinAncillaryThunk";
import { fetchFlightMealsByFlightId } from "@/Redux/flightMeal/flightMealThunk";
import { getFlightFares } from "@/Redux/fare/fareThunk";
import { getFlightById } from "@/Redux/flight/flightThunk";
import { clearCurrentFlight } from "@/Redux/flight/flightSlice";
import FlightMealCard from "../FlightMeals/FlightMealCard";

const statusClass = {
  SCHEDULED: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300",
  CANCELLED: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300",
};

const asList = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.content)) return value.content;
  return [];
};

const formatDateTime = (value) => {
  if (!value) return "Not configured";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not configured"
    : new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date);
};

const airportCode = (airport) => airport?.iataCode || "---";
const airportCity = (airport) => airport?.city?.name || airport?.name || "Airport unavailable";

const getScheduleReadiness = (flight) => {
  const blockers = [];
  const departureId = flight?.departureAirport?.id;
  const arrivalId = flight?.arrivalAirport?.id;

  if (flight?.status === "CANCELLED") blockers.push("Cancelled definition");
  if (!flight?.aircraft?.id) blockers.push("Missing aircraft assignment");
  if (!departureId || !arrivalId) blockers.push("Missing route airports");
  if (departureId && arrivalId && String(departureId) === String(arrivalId)) blockers.push("Departure and arrival must differ");

  return {
    ready: blockers.length === 0,
    blockers,
  };
};

const DefinitionItem = ({ label, value }) => (
  <div>
    <dt className="text-xs text-muted-foreground">{label}</dt>
    <dd className="mt-1 text-sm font-medium">{value || "Not configured"}</dd>
  </div>
);

const CommercialItem = ({ icon: Icon, title, description, value, action, actionLabel }) => (
  <Card>
    <CardContent className="flex h-full flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="font-medium">{title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <Badge variant="outline" className="ml-auto shrink-0">{value}</Badge>
      </div>
      <Button variant="outline" size="sm" className="mt-auto w-full" onClick={action}>
        {actionLabel} <ArrowRight />
      </Button>
    </CardContent>
  </Card>
);

const FlightDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [selectedCabinId, setSelectedCabinId] = useState("");

  const { flight, loading, error } = useSelector((state) => state.flight);
  const cabinPayload = useSelector((state) => state.cabinClass.cabinClasses);
  const farePayload = useSelector((state) => state.fare.flightFares);
  const mealPayload = useSelector((state) => state.flightMeal.flightMeals);
  const ancillaryPayload = useSelector((state) => state.flightCabinAncillary.cabinAncillaries);

  const cabins = useMemo(() => asList(cabinPayload), [cabinPayload]);
  const fares = useMemo(() => asList(farePayload), [farePayload]);
  const meals = useMemo(() => asList(mealPayload), [mealPayload]);
  const ancillaries = useMemo(() => asList(ancillaryPayload), [ancillaryPayload]);
  const flightMatchesRoute = String(flight?.id) === String(id);
  const selectedCabinIsAvailable = cabins.some((cabin) => String(cabin.id) === selectedCabinId);
  const activeCabinId = selectedCabinIsAvailable
    ? selectedCabinId
    : (cabins[0]?.id ? String(cabins[0].id) : "");

  useEffect(() => {
    if (id) {
      dispatch(getFlightById(id));
      dispatch(fetchFlightMealsByFlightId(id));
    }

    return () => {
      dispatch(clearCurrentFlight());
    };
  }, [dispatch, id]);

  useEffect(() => {
    if (flightMatchesRoute && flight?.aircraft?.id) {
      dispatch(getCabinClassesByAircraft(flight.aircraft.id));
    }
  }, [dispatch, flight?.aircraft?.id, flightMatchesRoute]);

  useEffect(() => {
    if (!flightMatchesRoute || !activeCabinId) return;
    dispatch(getFlightFares({ flightId: id, cabinId: activeCabinId }));
    dispatch(getFlightCabinAncillariesByFlightAndCabinClass({ flightId: id, cabinClassId: activeCabinId }));
  }, [activeCabinId, dispatch, flightMatchesRoute, id]);

  if (loading && !flightMatchesRoute) {
    return <Card><CardContent className="py-14 text-center text-sm text-muted-foreground">Loading flight definition...</CardContent></Card>;
  }

  if (error && !flightMatchesRoute) {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!flightMatchesRoute) {
    return (
      <Card>
        <CardContent className="py-14 text-center">
          <Plane className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">Flight definition not found</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate("/airline/flights")}>Back to flights</Button>
        </CardContent>
      </Card>
    );
  }

  const cancelled = flight.status === "CANCELLED";
  const aircraftSeats = flight.aircraft?.seatingCapacity || flight.aircraft?.totalSeats || 0;
  const scheduleReadiness = getScheduleReadiness(flight);

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" onClick={() => navigate("/airline/flights")}>
        <ArrowLeft /> Back to flights
      </Button>

      <Card>
        <CardContent className="space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Plane className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold">{flight.flightNumber || `Flight ${id}`}</h2>
                  <Badge variant="outline" className={statusClass[flight.status] || ""}>{flight.status || "UNKNOWN"}</Badge>
                </div>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {flight.airline?.name || "Airline unavailable"} · {flight.aircraft?.code || flight.aircraft?.model || "Aircraft unavailable"}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" disabled={cancelled} onClick={() => navigate(`/airline/flights/${id}/edit`)}>
              <Edit /> Edit definition
            </Button>
          </div>

          <Separator />

          <div className="grid items-center gap-5 md:grid-cols-[1fr_auto_1fr]">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Origin</p>
              <p className="mt-1 text-2xl font-semibold">{airportCode(flight.departureAirport)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{airportCity(flight.departureAirport)}</p>
              <p className="mt-2 text-xs text-muted-foreground">Departure times are configured in schedules.</p>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground md:flex-col">
              <div className="h-px flex-1 bg-border md:h-8 md:w-px" />
              <Plane className="h-4 w-4 rotate-90 md:rotate-0" />
              <div className="h-px flex-1 bg-border md:h-8 md:w-px" />
            </div>
            <div className="md:text-right">
              <p className="text-xs font-medium text-muted-foreground">Destination</p>
              <p className="mt-1 text-2xl font-semibold">{airportCode(flight.arrivalAirport)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{airportCity(flight.arrivalAirport)}</p>
              <p className="mt-2 text-xs text-muted-foreground">Arrival times are configured in schedules.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Definition details</CardTitle>
            <CardDescription>Reference data used to generate schedules and dated flight instances.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5 sm:grid-cols-2">
              <DefinitionItem label="Flight number" value={flight.flightNumber} />
              <DefinitionItem label="Airline" value={`${flight.airline?.name || "Unavailable"} (${flight.airline?.iataCode || "--"})`} />
              <DefinitionItem label="Aircraft" value={[flight.aircraft?.code, flight.aircraft?.manufacturer, flight.aircraft?.model].filter(Boolean).join(" · ")} />
              <DefinitionItem label="Aircraft capacity" value={`${aircraftSeats.toLocaleString()} seats`} />
              <DefinitionItem label="Departure timezone" value={flight.departureAirport?.timeZone} />
              <DefinitionItem label="Arrival timezone" value={flight.arrivalAirport?.timeZone} />
              <DefinitionItem label="Created" value={formatDateTime(flight.createdAt)} />
              <DefinitionItem label="Last updated" value={formatDateTime(flight.updatedAt)} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Schedule readiness</CardTitle>
            <CardDescription>Flight definitions do not represent a specific travel date.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`rounded-md border p-4 ${scheduleReadiness.ready ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200" : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"}`}>
              <div className="flex items-start gap-3">
                {scheduleReadiness.ready ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
                <div>
                  <p className="text-sm font-semibold">{scheduleReadiness.ready ? "Ready for scheduling" : "Needs attention before scheduling"}</p>
                  <p className="mt-1 text-xs">
                    {scheduleReadiness.ready
                      ? "This route and aircraft pairing can be used to generate recurring schedules."
                      : scheduleReadiness.blockers.join(", ")}
                  </p>
                </div>
              </div>
            </div>
            <Button
              className="w-full justify-start"
              disabled={!scheduleReadiness.ready}
              onClick={() => navigate(`/airline/schedules/new?flightId=${id}`)}
            >
              <CalendarPlus /> Create schedule <ArrowRight className="ml-auto" />
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/airline/instances")}>
              <Settings /> Manage flight instances <ArrowRight className="ml-auto" />
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/airline/schedules")}>
              <CalendarDays /> Manage schedules <ArrowRight className="ml-auto" />
            </Button>
            {flight.aircraft?.id ? (
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate(`/airline/aircraft/${flight.aircraft.id}`)}>
                <Plane /> Review assigned aircraft <ArrowRight className="ml-auto" />
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Commercial configuration</CardTitle>
          <CardDescription>Review products attached to this flight definition and its aircraft cabins.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="w-full max-w-sm space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Cabin class for fares and ancillaries</label>
              <Select value={activeCabinId} onValueChange={setSelectedCabinId}>
                <SelectTrigger><SelectValue placeholder="Select cabin class" /></SelectTrigger>
                <SelectContent>
                  {cabins.map((cabin) => <SelectItem key={cabin.id} value={String(cabin.id)}>{cabin.name || `Cabin ${cabin.id}`}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">{cabins.length} cabin classes configured on the assigned aircraft</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <CommercialItem
              icon={DollarSign}
              title="Fares"
              description={activeCabinId ? "Fare products for the selected cabin." : "Select a cabin to inspect fare products."}
              value={activeCabinId ? fares.length : "Select cabin"}
              action={() => navigate(`/airline/fares/new?flightId=${id}&cabinClassId=${activeCabinId}`)}
              actionLabel="Create fare"
            />
            <CommercialItem
              icon={Coffee}
              title="Ancillaries"
              description={activeCabinId ? "Optional services for the selected cabin." : "Select a cabin to inspect ancillary services."}
              value={activeCabinId ? ancillaries.length : "Select cabin"}
              action={() => navigate("/airline/cabin-ancillaries/new")}
              actionLabel="Assign ancillary"
            />
            <CommercialItem
              icon={UtensilsCrossed}
              title="Meals"
              description="Meal products assigned directly to this flight."
              value={meals.length}
              action={() => navigate(`/airline/flights/${id}/meals/assign`)}
              actionLabel="Assign meals"
            />
          </div>

          {cabins.length === 0 ? (
            <Alert>
              <Users />
              <AlertDescription>
                The assigned aircraft has no cabin classes. Configure its cabins before creating fares or cabin-scoped ancillary products.
              </AlertDescription>
            </Alert>
          ) : null}

          {meals.length > 0 ? (
            <div className="space-y-3 border-t border-border pt-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Meals assigned to this flight</h3>
                  <p className="text-sm text-muted-foreground">
                    Review sellable meal price, availability, and catalog imagery.
                  </p>
                </div>
                <Button variant="outline" onClick={() => navigate(`/airline/flights/${id}/meals/assign`)}>
                  <UtensilsCrossed className="size-4" />
                  Add more meals
                </Button>
              </div>
              <div className="grid gap-3">
                {meals.map((meal) => (
                  <FlightMealCard key={meal.id} flightMeal={meal} />
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Route reference</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          {[["Departure airport", flight.departureAirport], ["Arrival airport", flight.arrivalAirport]].map(([label, airport]) => (
            <div key={label} className="rounded-md border p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {label}</div>
              <p className="mt-2 font-medium">{airport?.name || "Airport unavailable"}</p>
              <p className="mt-1 text-sm text-muted-foreground">{airportCode(airport)} · {airportCity(airport)}</p>
              <p className="mt-3 text-xs text-muted-foreground">Timezone: {airport?.timeZone || "Not configured"}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default FlightDetail;
