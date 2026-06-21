import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle,
  Edit,
  Eye,
  Globe,
  Info,
  Loader2,
  MapPin,
  Plane,
  RotateCcw,
  Timer,
  Users,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { clearCurrentFlightSchedule } from "@/Redux/flightSchedule/flightScheduleSlice";
import { getFlightScheduleById } from "@/Redux/flightSchedule/flightScheduleThunk";
import { daysOfWeek } from "./daysOfWeek";

const recurrenceConfig = {
  DAILY: {
    label: "Daily",
    className: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300",
  },
  WEEKLY: {
    label: "Weekly",
    className: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300",
  },
  CUSTOM: {
    label: "Custom",
    className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
  },
};

const instanceStatusConfig = {
  SCHEDULED: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300",
  BOARDING: "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300",
  DEPARTED: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300",
  ARRIVED: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
  CANCELLED: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300",
};

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.content)) return value.content;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.content)) return value.data.content;
  return [];
};

const airportCode = (airport) => airport?.iataCode || airport?.code || "N/A";

const airportCity = (airport) =>
  airport?.city?.name || airport?.cityName || airport?.address?.cityName || "City unavailable";

const airportCountry = (airport) =>
  airport?.city?.countryName || airport?.countryName || airport?.address?.countryName || "Country unavailable";

const airportDisplayName = (airport) =>
  airport?.detailedName || airport?.name || "Airport unavailable";

const formatTime = (time) => {
  if (!time) return "TBD";
  const [hours = "0", minutes = "00"] = String(time).split(":");
  const hour24 = Number(hours);
  if (!Number.isFinite(hour24)) return time;
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
  const ampm = hour24 >= 12 ? "PM" : "AM";
  return `${hour12}:${minutes} ${ampm}`;
};

const formatDateTime = (value) => {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatTimeZone = (timeZone) => timeZone?.replace("_", " ") || "Local time";

const getDuration = (departureTime, arrivalTime) => {
  if (!departureTime || !arrivalTime) return "Duration unavailable";

  const [depHour, depMin] = String(departureTime).split(":").map(Number);
  const [arrHour, arrMin] = String(arrivalTime).split(":").map(Number);

  if (![depHour, depMin, arrHour, arrMin].every(Number.isFinite)) {
    return "Duration unavailable";
  }

  let diffMin = arrHour * 60 + arrMin - (depHour * 60 + depMin);
  if (diffMin < 0) diffMin += 24 * 60;

  const hours = Math.floor(diffMin / 60);
  const minutes = diffMin % 60;
  return `${hours}h ${minutes}m`;
};

const getBookedSeats = (instance) =>
  Math.max(0, (instance?.totalSeats || 0) - (instance?.availableSeats ?? instance?.totalAvailableSeats ?? 0));

const getOccupancyPercentage = (instance) => {
  const totalSeats = instance?.totalSeats || 0;
  if (!totalSeats) return 0;
  return Math.round((getBookedSeats(instance) / totalSeats) * 100);
};

const MetricCard = ({ icon: Icon, label, value, helper, iconClassName }) => (
  <Card className="border-border/70 shadow-sm">
    <CardContent className="flex items-center justify-between gap-4 p-5">
      <div className="min-w-0">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl font-semibold">{value}</div>
        {helper && <div className="mt-1 text-xs text-muted-foreground">{helper}</div>}
      </div>
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary",
          iconClassName,
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
    </CardContent>
  </Card>
);

const DefinitionItem = ({ label, value }) => (
  <div className="rounded-md border bg-muted/20 p-4">
    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {label}
    </div>
    <div className="mt-1 break-words font-semibold text-foreground">{value || "N/A"}</div>
  </div>
);

const FlightScheduleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("overview");

  const { currentFlightSchedule, loading, error } = useSelector(
    (state) => state.flightSchedule || {},
  );

  useEffect(() => {
    if (id) dispatch(getFlightScheduleById(id));
    return () => {
      dispatch(clearCurrentFlightSchedule());
    };
  }, [dispatch, id]);

  const isCurrentSchedule = String(currentFlightSchedule?.id || "") === String(id || "");
  const schedule = isCurrentSchedule ? currentFlightSchedule : null;
  const instances = useMemo(() => asArray(schedule?.instances), [schedule?.instances]);
  const operatingDays = useMemo(() => asArray(schedule?.operatingDays), [schedule?.operatingDays]);
  const recurrence =
    recurrenceConfig[schedule?.recurrenceType] || recurrenceConfig.CUSTOM;
  const duration = getDuration(schedule?.departureTime, schedule?.arrivalTime);

  const activeInstances = instances.filter((item) =>
    ["SCHEDULED", "BOARDING", "DEPARTED"].includes(item.status),
  ).length;
  const weeklyFrequency =
    schedule?.recurrenceType === "DAILY" ? 7 : operatingDays.length || 0;
  const estimatedMonthlyFlights = weeklyFrequency ? Math.round(weeklyFrequency * 4.35) : 0;

  if (loading && !schedule) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading flight schedule...
        </div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <Card className="max-w-md border-border/70 text-center shadow-sm">
          <CardContent className="space-y-4 p-8">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
            <div>
              <h2 className="text-xl font-semibold">Flight schedule not found</h2>
              <p className="text-sm text-muted-foreground">
                {error || "The selected schedule may have been removed or is unavailable."}
              </p>
            </div>
            <Button onClick={() => navigate("/airline/schedules")}>
              Back to schedules
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-5 lg:space-y-6">
      <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 shadow-sm sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
          <Button
            variant="outline"
            onClick={() => navigate("/airline/schedules")}
            className="h-10 w-fit shrink-0 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="truncate text-2xl font-semibold tracking-normal sm:text-3xl">
                {schedule.flightNumber || `Schedule #${schedule.id}`}
              </h1>
              <Badge
                variant="outline"
                className={cn(
                  "gap-2",
                  schedule.isActive
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                    : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
                )}
              >
                {schedule.isActive ? (
                  <CheckCircle className="h-3.5 w-3.5" />
                ) : (
                  <XCircle className="h-3.5 w-3.5" />
                )}
                {schedule.isActive ? "Active" : "Inactive"}
              </Badge>
              <Badge variant="outline" className={cn("gap-2", recurrence.className)}>
                <RotateCcw className="h-3.5 w-3.5" />
                {recurrence.label}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              {airportCode(schedule.departureAirport)} to{" "}
              {airportCode(schedule.arrivalAirport)} • {duration}
            </p>
          </div>
        </div>

        <Button onClick={() => navigate(`/airline/schedules/${id}/edit`)} className="gap-2">
          <Edit className="h-4 w-4" />
          Edit Schedule
        </Button>
      </div>

      <Card className="overflow-hidden border-border/70 shadow-sm">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr]">
            <div className="space-y-3 p-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Departure
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <div className="text-4xl font-bold">
                  {airportCode(schedule.departureAirport)}
                </div>
                <div className="pb-1 text-lg font-semibold">
                  {formatTime(schedule.departureTime)}
                </div>
              </div>
              <div>
                <div className="font-semibold">{airportCity(schedule.departureAirport)}</div>
                <div className="text-sm text-muted-foreground">
                  {airportDisplayName(schedule.departureAirport)}
                </div>
              </div>
              <div className="rounded-md bg-muted/50 p-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  <span>{formatTimeZone(schedule.departureAirport?.timeZone)}</span>
                  <span>•</span>
                  <span>{airportCountry(schedule.departureAirport)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center border-y bg-muted/20 p-6 lg:border-x lg:border-y-0">
              <div className="text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Plane className="h-6 w-6" />
                </div>
                <div className="text-sm font-semibold">{duration}</div>
                <div className="text-xs text-muted-foreground">
                  Flight ID #{schedule.flightId || "N/A"}
                </div>
              </div>
            </div>

            <div className="space-y-3 p-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Arrival
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <div className="text-4xl font-bold">
                  {airportCode(schedule.arrivalAirport)}
                </div>
                <div className="pb-1 text-lg font-semibold">
                  {formatTime(schedule.arrivalTime)}
                </div>
              </div>
              <div>
                <div className="font-semibold">{airportCity(schedule.arrivalAirport)}</div>
                <div className="text-sm text-muted-foreground">
                  {airportDisplayName(schedule.arrivalAirport)}
                </div>
              </div>
              <div className="rounded-md bg-muted/50 p-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  <span>{formatTimeZone(schedule.arrivalAirport?.timeZone)}</span>
                  <span>•</span>
                  <span>{airportCountry(schedule.arrivalAirport)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard
          icon={CalendarDays}
          label="Weekly frequency"
          value={`${weeklyFrequency}x`}
          helper={schedule.recurrenceType || "Custom schedule"}
        />
        <MetricCard
          icon={Timer}
          label="Block time"
          value={duration}
          iconClassName="bg-sky-500/10 text-sky-600"
        />
        <MetricCard
          icon={Plane}
          label="Known instances"
          value={instances.length}
          helper={`${activeInstances} active`}
          iconClassName="bg-violet-500/10 text-violet-600"
        />
        <MetricCard
          icon={Users}
          label="Seats per instance"
          value={schedule.totalSeats || "TBD"}
          helper={schedule.availableSeats ? `${schedule.availableSeats} available` : "From aircraft inventory"}
          iconClassName="bg-emerald-500/10 text-emerald-600"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:w-fit">
          <TabsTrigger value="overview">
            <Info className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="instances">
            <CalendarDays className="mr-2 h-4 w-4" />
            Instances
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="border-border/70 shadow-sm lg:col-span-2">
              <CardHeader>
                <CardTitle>Schedule Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <DefinitionItem label="Schedule ID" value={schedule.id} />
                  <DefinitionItem label="Flight ID" value={schedule.flightId} />
                  <DefinitionItem label="Recurrence" value={recurrence.label} />
                  <DefinitionItem
                    label="Monthly estimate"
                    value={estimatedMonthlyFlights ? `${estimatedMonthlyFlights} departures` : "N/A"}
                  />
                </div>

                <div>
                  <div className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Operating Days
                  </div>
                  {schedule.recurrenceType === "DAILY" ? (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                      {daysOfWeek.map((day) => (
                        <div
                          key={day.id}
                          className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-sm font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                        >
                          {day.short}
                        </div>
                      ))}
                    </div>
                  ) : operatingDays.length ? (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                      {daysOfWeek.map((day) => {
                        const active = operatingDays.includes(day.id);
                        return (
                          <div
                            key={day.id}
                            className={cn(
                              "rounded-md border px-3 py-2 text-center text-sm font-medium",
                              active
                                ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300"
                                : "border-border bg-muted/30 text-muted-foreground",
                            )}
                          >
                            {day.short}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-md border bg-muted/20 p-4 text-sm text-muted-foreground">
                      No operating days configured.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle>Airport Operations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <DefinitionItem
                  label="Departure airport"
                  value={airportDisplayName(schedule.departureAirport)}
                />
                <DefinitionItem
                  label="Departure timezone"
                  value={formatTimeZone(schedule.departureAirport?.timeZone)}
                />
                <DefinitionItem
                  label="Arrival airport"
                  value={airportDisplayName(schedule.arrivalAirport)}
                />
                <DefinitionItem
                  label="Arrival timezone"
                  value={formatTimeZone(schedule.arrivalAirport?.timeZone)}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="instances" className="space-y-4">
          <Card className="border-border/70 shadow-sm">
            <CardHeader className="flex flex-col gap-3 border-b sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Flight Instances</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Generated dated operations linked to this recurring schedule.
                </p>
              </div>
              <Button onClick={() => navigate("/airline/instances/new")} className="gap-2">
                <CalendarDays className="h-4 w-4" />
                Create Instance
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="min-w-[860px]">
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead>Instance</TableHead>
                      <TableHead>Departure</TableHead>
                      <TableHead>Arrival</TableHead>
                      <TableHead>Load</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {instances.length ? (
                      instances.map((instance) => {
                        const occupancy = getOccupancyPercentage(instance);
                        const statusClass =
                          instanceStatusConfig[instance.status] || instanceStatusConfig.SCHEDULED;

                        return (
                          <TableRow key={instance.id} className="align-top hover:bg-muted/40">
                            <TableCell>
                              <div className="flex items-center gap-2 font-semibold">
                                <Plane className="h-4 w-4 text-primary" />
                                {instance.flightInstanceCode ||
                                  instance.flightNumber ||
                                  `Instance #${instance.id}`}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatDateTime(instance.departureDateTime)}
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatDateTime(instance.arrivalDateTime)}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="text-sm font-medium">
                                  {getBookedSeats(instance)}/{instance.totalSeats || 0}
                                </div>
                                <div className="h-2 w-28 overflow-hidden rounded-full bg-muted">
                                  <div
                                    className={cn(
                                      "h-full",
                                      occupancy >= 90
                                        ? "bg-red-500"
                                        : occupancy >= 70
                                          ? "bg-amber-500"
                                          : "bg-emerald-500",
                                    )}
                                    style={{ width: `${occupancy}%` }}
                                  />
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {occupancy}% full
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={statusClass}>
                                {instance.status || "SCHEDULED"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label="View instance"
                                  onClick={() => navigate(`/airline/instances/${instance.id}`)}
                                  className="h-8 w-8"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label="Edit instance"
                                  onClick={() => navigate(`/airline/instances/${instance.id}/edit`)}
                                  className="h-8 w-8"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="py-12 text-center">
                          <div className="mx-auto max-w-md space-y-2">
                            <CalendarDays className="mx-auto h-10 w-10 text-muted-foreground" />
                            <p className="font-medium">No instances linked to this schedule</p>
                            <p className="text-sm text-muted-foreground">
                              Save or update an active schedule to generate dated operations.
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FlightScheduleDetail;
