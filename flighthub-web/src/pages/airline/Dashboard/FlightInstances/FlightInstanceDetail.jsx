import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  LayoutGrid,
  Loader2,
  MapPin,
  Plane,
  Settings,
  Users,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  changeFlightInstanceStatus,
  getFlightInstanceById,
} from "@/Redux/flightInstance/flightInstanceThunk";
import { clearflightInstance } from "@/Redux/flightInstance/flightInstanceSlice";
import { getFlightInstanceCabinsByFlightInstance } from "@/Redux/flightInstanceCabin/flightInstanceCabinThunk";
import FlightLifecycleControl from "@/components/flight-ops/FlightLifecycleControl";
import EmptyCabin from "./EmptyCabin";
import FlightInstanceCabinCard from "./FlightInstanceCabinCard";

const statusConfig = {
  SCHEDULED: {
    label: "Scheduled",
    className: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300",
    dotClassName: "bg-blue-500",
    icon: Clock,
  },
  BOARDING: {
    label: "Boarding",
    className: "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300",
    dotClassName: "bg-cyan-500",
    icon: Users,
  },
  DEPARTED: {
    label: "Departed",
    className: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300",
    dotClassName: "bg-violet-500",
    icon: Plane,
  },
  ARRIVED: {
    label: "Arrived",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
    dotClassName: "bg-emerald-500",
    icon: CheckCircle,
  },
  CANCELLED: {
    label: "Cancelled",
    className: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300",
    dotClassName: "bg-red-500",
    icon: Settings,
  },
};

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

const formatDateTime = (value) => {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDuration = (departure, arrival) => {
  if (!departure || !arrival) return "Duration unavailable";
  const minutes = Math.round((new Date(arrival) - new Date(departure)) / 60000);
  if (!Number.isFinite(minutes) || minutes < 0) return "Duration unavailable";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

const getAvailableSeats = (instance) =>
  instance?.availableSeats ?? instance?.totalAvailableSeats ?? 0;

const getBookedSeats = (instance) =>
  Math.max(0, (instance?.totalSeats || 0) - getAvailableSeats(instance));

const getLoadFactor = (instance) => {
  if (!instance?.totalSeats) return 0;
  return Math.round((getBookedSeats(instance) / instance.totalSeats) * 100);
};

const loadFactorColor = (loadFactor) =>
  loadFactor >= 90
    ? "bg-red-500"
    : loadFactor >= 70
      ? "bg-amber-500"
      : "bg-emerald-500";

const InfoItem = ({ label, value }) => (
  <div className="rounded-md border bg-muted/20 p-4">
    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {label}
    </div>
    <div className="mt-1 break-words font-semibold text-foreground">{value || "N/A"}</div>
  </div>
);

const StatCard = ({ icon: Icon, label, value, helper, iconClassName }) => (
  <Card className="border-border/70 shadow-sm">
    <CardContent className="flex items-center justify-between gap-4 p-5">
      <div className="min-w-0">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl font-semibold">{value}</div>
        {helper && <div className="mt-1 text-xs text-muted-foreground">{helper}</div>}
      </div>
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary", iconClassName)}>
        <Icon className="h-5 w-5" />
      </div>
    </CardContent>
  </Card>
);

const FlightInstanceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("overview");

  const { flightInstance, loading, updateLoading, error } = useSelector(
    (store) => store.flightInstance,
  );
  const { cabins, loading: cabinsLoading } = useSelector(
    (store) => store.flightInstanceCabin,
  );

  useEffect(() => {
    if (id) dispatch(getFlightInstanceById(id));
    return () => {
      dispatch(clearflightInstance());
    };
  }, [dispatch, id]);

  const isCurrentInstance = String(flightInstance?.id || "") === String(id || "");
  const instance = isCurrentInstance ? flightInstance : null;

  useEffect(() => {
    if (instance?.id) {
      dispatch(
        getFlightInstanceCabinsByFlightInstance({
          flightInstanceId: instance.id,
        }),
      );
    }
  }, [dispatch, instance?.id]);

  const status = statusConfig[instance?.status] || statusConfig.SCHEDULED;
  const StatusIcon = status.icon;
  const bookedSeats = getBookedSeats(instance);
  const availableSeats = getAvailableSeats(instance);
  const loadFactor = getLoadFactor(instance);
  const cabinList = useMemo(() => asArray(cabins), [cabins]);
  const cabinSummary = useMemo(() => {
    const totalCabins = cabinList.length;
    const totalCabinSeats = cabinList.reduce(
      (sum, cabin) => sum + (cabin.totalSeats || 0),
      0,
    );
    const totalCabinBooked = cabinList.reduce(
      (sum, cabin) => sum + (cabin.bookedSeats || 0),
      0,
    );
    return { totalCabins, totalCabinSeats, totalCabinBooked };
  }, [cabinList]);

  const handleStatusTransition = async (nextStatus) => {
    if (!instance?.id) return;
    try {
      await dispatch(
        changeFlightInstanceStatus({ id: instance.id, status: nextStatus }),
      ).unwrap();
      toast.success(`Flight instance moved to ${nextStatus}`);
    } catch (error) {
      toast.error(error || "Unable to update lifecycle status");
    }
  };

  if (loading && !instance) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading flight instance...
        </div>
      </div>
    );
  }

  if (!instance) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <Card className="max-w-md border-border/70 text-center shadow-sm">
          <CardContent className="space-y-4 p-8">
            {error ? (
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
            ) : (
              <Plane className="mx-auto h-12 w-12 text-muted-foreground" />
            )}
            <div>
              <h2 className="text-xl font-semibold">Flight instance not found</h2>
              <p className="text-sm text-muted-foreground">
                {error || "The selected dated flight may have been deleted or is unavailable."}
              </p>
            </div>
            <Button onClick={() => navigate("/airline/instances")}>
              Back to instances
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-5 lg:space-y-6">
      <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between sm:p-5">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
          <Button
            variant="outline"
            onClick={() => navigate("/airline/instances")}
            className="h-10 w-fit shrink-0 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="truncate text-2xl font-semibold tracking-normal sm:text-3xl">
                {instance.flightNumber || `Instance #${instance.id}`}
              </h1>
              <Badge variant="outline" className={cn("gap-2", status.className)}>
                <span className={cn("h-2 w-2 rounded-full", status.dotClassName)} />
                {status.label}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              {airportCode(instance.departureAirport)} to{" "}
              {airportCode(instance.arrivalAirport)} •{" "}
              {formatDuration(
                instance.departureDateTime,
                instance.arrivalDateTime,
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <FlightLifecycleControl
            status={instance.status}
            disabled={updateLoading}
            onTransition={handleStatusTransition}
          />
          <Button onClick={() => navigate(`/airline/instances/${id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Instance
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-border/70 shadow-sm">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr]">
            <div className="space-y-3 p-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Departure
              </div>
              <div className="text-4xl font-bold">
                {airportCode(instance.departureAirport)}
              </div>
              <div>
                <div className="font-semibold">
                  {airportName(instance.departureAirport)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {instance.departureAirport?.city?.name || "City unavailable"}
                </div>
              </div>
              <div className="rounded-md bg-muted/50 p-3 text-sm">
                {formatDateTime(instance.departureDateTime)}
              </div>
            </div>

            <div className="flex items-center justify-center border-y bg-muted/20 p-6 lg:border-x lg:border-y-0">
              <div className="text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Plane className="h-6 w-6" />
                </div>
                <div className="text-sm font-semibold">
                  {formatDuration(
                    instance.departureDateTime,
                    instance.arrivalDateTime,
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {instance.aircraftCode ||
                    instance.aircraftModal ||
                    "Aircraft TBD"}
                </div>
              </div>
            </div>

            <div className="space-y-3 p-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Arrival
              </div>
              <div className="text-4xl font-bold">
                {airportCode(instance.arrivalAirport)}
              </div>
              <div>
                <div className="font-semibold">
                  {airportName(instance.arrivalAirport)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {instance.arrivalAirport?.city?.name || "City unavailable"}
                </div>
              </div>
              <div className="rounded-md bg-muted/50 p-3 text-sm">
                {formatDateTime(instance.arrivalDateTime)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard icon={Users} label="Total seats" value={instance.totalSeats || 0} />
        <StatCard icon={CheckCircle} label="Booked" value={bookedSeats} iconClassName="bg-amber-500/10 text-amber-600" />
        <StatCard icon={Users} label="Available" value={availableSeats} iconClassName="bg-emerald-500/10 text-emerald-600" />
        <StatCard icon={StatusIcon} label="Load factor" value={`${loadFactor}%`} helper={`${bookedSeats}/${instance.totalSeats || 0} seats`} iconClassName="bg-sky-500/10 text-sky-600" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:w-fit">
          <TabsTrigger value="overview">
            <Calendar className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="cabins">
            <LayoutGrid className="mr-2 h-4 w-4" />
            Cabins
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Operational Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoItem label="Instance ID" value={instance.id} />
                <InfoItem label="Schedule ID" value={instance.scheduleId} />
                <InfoItem label="Airline" value={instance.airlineName} />
                <InfoItem
                  label="Aircraft"
                  value={instance.aircraftCode || instance.aircraftModal}
                />
                <InfoItem label="Terminal" value={instance.terminal || "TBD"} />
                <InfoItem label="Gate" value={instance.gate || "TBD"} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Seat Inventory</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Booked seats</span>
                  <span className="font-medium">
                    {bookedSeats}/{instance.totalSeats || 0}
                  </span>
                </div>
                <Progress value={loadFactor} className="h-2" />
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full", loadFactorColor(loadFactor))}
                    style={{ width: `${loadFactor}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <InfoItem label="Min advance booking" value={instance.minAdvanceBookingDays} />
                  <InfoItem label="Max advance booking" value={instance.maxAdvanceBookingDays} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cabins" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Cabin Inventory</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {cabinSummary.totalCabins} cabin
                  {cabinSummary.totalCabins === 1 ? "" : "s"} •{" "}
                  {cabinSummary.totalCabinBooked}/{cabinSummary.totalCabinSeats} seats booked
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate("/airline/aircraft")}>
                <Settings className="mr-2 h-4 w-4" />
                Configure Aircraft
              </Button>
            </CardHeader>
            <CardContent>
              {cabinsLoading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading cabins...
                </div>
              ) : !cabinList.length ? (
                <EmptyCabin />
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {cabinList.map((cabin) => {
                    const occupancyPercentage = cabin.totalSeats
                      ? Math.round(((cabin.bookedSeats || 0) / cabin.totalSeats) * 100)
                      : 0;
                    return (
                      <FlightInstanceCabinCard
                        key={cabin.id}
                        cabin={cabin}
                        occupancyPercentage={occupancyPercentage}
                      />
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FlightInstanceDetail;
