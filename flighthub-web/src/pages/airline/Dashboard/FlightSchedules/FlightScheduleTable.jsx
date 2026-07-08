import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  Loader2,
  MapPin,
  Plane,
  Plus,
  RotateCcw,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  deleteFlightSchedule,
  getAllFlightSchedules,
} from "@/Redux/flightSchedule/flightScheduleThunk";
import { daysOfWeek } from "./daysOfWeek";

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.content)) return value.content;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.content)) return value.data.content;
  return [];
};

const airportCode = (airport) => airport?.iataCode || airport?.code || "N/A";

const airportName = (airport) =>
  airport?.name || airport?.city?.name || airport?.cityName || "Airport unavailable";

const formatTime = (time) => {
  if (!time) return "TBD";
  const [hours = "0", minutes = "00"] = String(time).split(":");
  const hour24 = Number(hours);
  if (!Number.isFinite(hour24)) return time;
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
  const ampm = hour24 >= 12 ? "PM" : "AM";
  return `${hour12}:${minutes} ${ampm}`;
};

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

const todayIso = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

const getWeeklyDepartures = (schedule) => {
  if (!schedule.isActive) return 0;
  if (schedule.recurrenceType === "DAILY") return 7;
  return schedule.operatingDays?.length || 0;
};

const getGenerationBlockers = (schedule) => {
  const blockers = [];
  const today = todayIso();

  if (!schedule.isActive) blockers.push("inactive");
  if (schedule.endDate && schedule.endDate < today) blockers.push("effective period ended");
  if (!schedule.startDate) blockers.push("missing start date");
  if (!schedule.endDate) blockers.push("missing end date");
  if (!schedule.departureTime || !schedule.arrivalTime) blockers.push("missing local times");
  if (!schedule.departureAirport || !schedule.arrivalAirport) blockers.push("missing route reference");
  if (getWeeklyDepartures(schedule) < 1) blockers.push("no operating days");

  return blockers;
};

const readinessClass = (blockers) =>
  blockers.length === 0
    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
    : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300";

const recurrenceBadgeClass = {
  DAILY: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300",
  WEEKLY: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300",
  CUSTOM: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
};

const getOperatingDayShorts = (operatingDays = []) =>
  operatingDays
    .map((day) => daysOfWeek.find((item) => item.id === day)?.short || day.slice(0, 3))
    .join(", ");

const MetricCard = ({ icon: Icon, label, value, helper, iconClassName }) => (
  <Card className="border-border/70 shadow-sm">
    <CardContent className="flex items-center justify-between gap-4 p-5">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
        {helper && <p className="mt-1 text-xs text-muted-foreground">{helper}</p>}
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

const StatusBadge = ({ isActive }) => (
  <Badge
    variant="outline"
    className={cn(
      "gap-2",
      isActive
        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
        : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
    )}
  >
    {isActive ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
    {isActive ? "Active" : "Inactive"}
  </Badge>
);

const RecurrenceBadge = ({ type, operatingDays }) => (
  <Badge
    variant="outline"
    className={cn("gap-2", recurrenceBadgeClass[type] || recurrenceBadgeClass.CUSTOM)}
  >
    <RotateCcw className="h-3.5 w-3.5" />
    {type || "CUSTOM"}
    {type === "WEEKLY" ? ` (${operatingDays?.length || 0}d)` : ""}
  </Badge>
);

const FlightScheduleTable = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { flightSchedules, loading, error, deleteLoading } = useSelector(
    (state) => state.flightSchedule || {},
  );

  useEffect(() => {
    dispatch(getAllFlightSchedules());
  }, [dispatch]);

  const schedules = useMemo(() => asArray(flightSchedules), [flightSchedules]);
  const activeCount = schedules.filter((schedule) => schedule.isActive).length;
  const generatingCount = schedules.filter((schedule) => getGenerationBlockers(schedule).length === 0).length;
  const weeklyDepartures = schedules.reduce((sum, schedule) => sum + getWeeklyDepartures(schedule), 0);

  const handleDeactivate = async (scheduleId) => {
    try {
      await dispatch(deleteFlightSchedule(scheduleId)).unwrap();
      await dispatch(getAllFlightSchedules()).unwrap();
      toast.success("Schedule deactivated");
    } catch (deleteError) {
      toast.error(deleteError || "Unable to deactivate schedule");
    }
  };

  const renderActions = (schedule, mobile = false) => (
    <TooltipProvider delayDuration={120}>
      <div className={cn("flex items-center gap-1", mobile ? "justify-end" : "justify-end")}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={mobile ? "outline" : "ghost"}
              size="icon"
              aria-label="View schedule"
              onClick={() => navigate(`/airline/schedules/${schedule.id}`)}
              className={mobile ? "h-9 w-9" : "h-8 w-8"}
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
              aria-label="Edit schedule"
              onClick={() => navigate(`/airline/schedules/${schedule.id}/edit`)}
              className={mobile ? "h-9 w-9" : "h-8 w-8"}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Edit</TooltipContent>
        </Tooltip>
        <AlertDialog>
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertDialogTrigger asChild>
                <Button
                  variant={mobile ? "outline" : "ghost"}
                  size="icon"
                  aria-label="Deactivate schedule"
                  disabled={deleteLoading}
                  className={cn(
                    mobile ? "h-9 w-9" : "h-8 w-8",
                    "text-red-600 hover:bg-red-50 hover:text-red-700",
                  )}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
            </TooltipTrigger>
            <TooltipContent>Deactivate</TooltipContent>
          </Tooltip>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Deactivate schedule?</AlertDialogTitle>
              <AlertDialogDescription>
                Existing flight instances and history will be preserved. The schedule
                will no longer generate new operations after deactivation.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDeactivate(schedule.id)}
                className="bg-red-600 hover:bg-red-700"
              >
                Deactivate
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );

  return (
    <div className="min-w-0 max-w-full space-y-5 overflow-hidden lg:space-y-6">
      <div className="flex min-w-0 flex-col gap-4 rounded-lg border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Calendar className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">
              Flight Schedules
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Manage recurring timetable templates and generated operations.
            </p>
          </div>
        </div>
        <Button
          onClick={() => navigate("/airline/schedules/new")}
          className="h-10 w-full shrink-0 gap-2 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Create Schedule
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard icon={Plane} label="Total schedules" value={schedules.length} />
        <MetricCard
          icon={CheckCircle}
          label="Active schedules"
          value={activeCount}
          helper={`${schedules.length - activeCount} inactive`}
          iconClassName="bg-emerald-500/10 text-emerald-600"
        />
        <MetricCard
          icon={Calendar}
          label="Generating"
          value={generatingCount}
          helper="Ready to create future instances"
          iconClassName="bg-violet-500/10 text-violet-600"
        />
        <MetricCard
          icon={Clock}
          label="Weekly departures"
          value={weeklyDepartures}
          helper="Estimated from active schedules"
          iconClassName="bg-sky-500/10 text-sky-600"
        />
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="flex flex-col gap-3 border-b sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="text-lg font-semibold">Schedule Inventory</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Review routes, timing, recurrence and lifecycle state.
            </p>
          </div>
          <Badge variant="outline" className="w-fit shrink-0 rounded-md px-3 py-1">
            {loading ? "Refreshing..." : `${schedules.length} schedule${schedules.length === 1 ? "" : "s"}`}
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <div className="m-4 flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:m-6">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="hidden max-w-full overflow-x-auto rounded-b-lg md:block">
            <Table className="min-w-[1140px]">
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-[170px]">Flight</TableHead>
                  <TableHead className="w-[260px]">Route</TableHead>
                  <TableHead className="w-[190px]">Timing</TableHead>
                  <TableHead className="w-[180px]">Recurrence</TableHead>
                  <TableHead className="w-[130px]">Status</TableHead>
                  <TableHead className="w-[170px]">Generation</TableHead>
                  <TableHead className="sticky right-0 z-20 w-[128px] bg-muted/50 text-right shadow-[-12px_0_16px_-18px_hsl(var(--foreground))]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && !schedules.length ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading schedules...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : !schedules.length ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center">
                      <div className="mx-auto max-w-md space-y-2">
                        <Calendar className="mx-auto h-10 w-10 text-muted-foreground" />
                        <p className="font-medium">No flight schedules found</p>
                        <p className="text-sm text-muted-foreground">
                          Create a recurring schedule to generate dated flight instances.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  schedules.map((schedule) => {
                    const blockers = getGenerationBlockers(schedule);
                    const ready = blockers.length === 0;

                    return (
                      <TableRow key={schedule.id} className="align-top hover:bg-muted/40">
                        <TableCell>
                          <div className="flex items-center gap-2 font-semibold">
                            <Plane className="h-4 w-4 text-primary" />
                            {schedule.flightNumber || `Schedule #${schedule.id}`}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            Flight ID #{schedule.flightId || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-start gap-2">
                            <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                            <div className="min-w-0">
                              <div className="font-medium">
                                {airportCode(schedule.departureAirport)} →{" "}
                                {airportCode(schedule.arrivalAirport)}
                              </div>
                              <div className="truncate text-xs text-muted-foreground">
                                {airportName(schedule.departureAirport)} →{" "}
                                {airportName(schedule.arrivalAirport)}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="text-sm font-medium">
                                {formatTime(schedule.departureTime)} - {formatTime(schedule.arrivalTime)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {getDuration(schedule.departureTime, schedule.arrivalTime)}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <RecurrenceBadge
                              type={schedule.recurrenceType}
                              operatingDays={schedule.operatingDays}
                            />
                            <div className="text-xs text-muted-foreground">
                              {getWeeklyDepartures(schedule)} departures/week
                            </div>
                            {schedule.recurrenceType === "WEEKLY" && schedule.operatingDays?.length ? (
                              <div className="text-xs text-muted-foreground">
                                {getOperatingDayShorts(schedule.operatingDays)}
                              </div>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge isActive={schedule.isActive} />
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge variant="outline" className={cn("gap-1.5 rounded-md", readinessClass(blockers))}>
                              {ready ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                              {ready ? "Ready" : "Blocked"}
                            </Badge>
                            <p className="line-clamp-2 text-xs text-muted-foreground">
                              {ready ? "Can generate future instances." : blockers.join(", ")}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="sticky right-0 z-10 bg-card text-right shadow-[-12px_0_16px_-18px_hsl(var(--foreground))]">
                          {renderActions(schedule)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="divide-y md:hidden">
            {loading && !schedules.length ? (
              <div className="flex items-center justify-center gap-2 px-4 py-12 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading schedules...
              </div>
            ) : !schedules.length ? (
              <div className="px-4 py-12 text-center">
                <Calendar className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-3 font-medium">No flight schedules found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create a recurring schedule to generate dated flight instances.
                </p>
              </div>
            ) : (
              schedules.map((schedule) => {
                const blockers = getGenerationBlockers(schedule);
                const ready = blockers.length === 0;

                return (
                <div key={schedule.id} className="space-y-4 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 font-semibold">
                        <Plane className="h-4 w-4 shrink-0 text-primary" />
                        <span className="truncate">
                          {schedule.flightNumber || `Schedule #${schedule.id}`}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {airportCode(schedule.departureAirport)} →{" "}
                        {airportCode(schedule.arrivalAirport)}
                      </p>
                    </div>
                    <StatusBadge isActive={schedule.isActive} />
                  </div>

                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div className="rounded-md bg-muted/40 p-3">
                      <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        Route
                      </div>
                      <div className="font-medium">
                        {airportName(schedule.departureAirport)} →{" "}
                        {airportName(schedule.arrivalAirport)}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-md bg-muted/40 p-3">
                        <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          Time
                        </div>
                        <div>
                          {formatTime(schedule.departureTime)} - {formatTime(schedule.arrivalTime)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {getDuration(schedule.departureTime, schedule.arrivalTime)}
                        </div>
                      </div>
                      <div className="rounded-md bg-muted/40 p-3">
                        <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          <RotateCcw className="h-3.5 w-3.5" />
                          Recurrence
                        </div>
                        <RecurrenceBadge
                          type={schedule.recurrenceType}
                          operatingDays={schedule.operatingDays}
                        />
                        {schedule.recurrenceType === "WEEKLY" && schedule.operatingDays?.length ? (
                          <div className="mt-1 text-xs text-muted-foreground">
                            {getOperatingDayShorts(schedule.operatingDays)}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className={cn(
                    "rounded-md border p-3 text-sm",
                    ready
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                      : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
                  )}>
                    <div className="flex items-center gap-2 font-medium">
                      {ready ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                      {ready ? "Ready to generate" : "Generation blocked"}
                    </div>
                    <p className="mt-1 text-xs">
                      {ready ? "This schedule can create future flight instances." : blockers.join(", ")}
                    </p>
                  </div>

                  {renderActions(schedule, true)}
                </div>
              );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FlightScheduleTable;
