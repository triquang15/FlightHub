import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  LayoutGrid,
  Loader2,
  MapPin,
  Plane,
  Plus,
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
import { getFlightInstanceCabinsByFlightInstance } from "@/Redux/flightInstanceCabin/flightInstanceCabinThunk";
import FlightLifecycleControl from "@/components/flight-ops/FlightLifecycleControl";
import EmptyCabin from "./EmptyCabin";
import FlightInstanceCabinCard from "./FlightInstanceCabinCard";

const statusConfig = {
  SCHEDULED: {
    label: "Scheduled",
    className: "border-blue-200 bg-blue-50 text-blue-700",
    icon: Clock,
  },
  BOARDING: {
    label: "Boarding",
    className: "border-cyan-200 bg-cyan-50 text-cyan-700",
    icon: Users,
  },
  DEPARTED: {
    label: "Departed",
    className: "border-violet-200 bg-violet-50 text-violet-700",
    icon: Plane,
  },
  ARRIVED: {
    label: "Arrived",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: CheckCircle,
  },
  CANCELLED: {
    label: "Cancelled",
    className: "border-red-200 bg-red-50 text-red-700",
    icon: Settings,
  },
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

const InfoItem = ({ label, value }) => (
  <div className="rounded-lg border bg-card p-4">
    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {label}
    </div>
    <div className="mt-1 font-semibold text-foreground">{value || "N/A"}</div>
  </div>
);

const FlightInstanceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("overview");

  const { flightInstance, loading, updateLoading } = useSelector(
    (store) => store.flightInstance,
  );
  const { cabins, loading: cabinsLoading } = useSelector(
    (store) => store.flightInstanceCabin,
  );

  useEffect(() => {
    if (id) dispatch(getFlightInstanceById(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (flightInstance?.id) {
      dispatch(
        getFlightInstanceCabinsByFlightInstance({
          flightInstanceId: flightInstance.id,
        }),
      );
    }
  }, [dispatch, flightInstance?.id]);

  const status = statusConfig[flightInstance?.status] || statusConfig.SCHEDULED;
  const StatusIcon = status.icon;
  const bookedSeats = getBookedSeats(flightInstance);
  const availableSeats = getAvailableSeats(flightInstance);
  const loadFactor = getLoadFactor(flightInstance);
  const cabinSummary = useMemo(() => {
    const totalCabins = cabins?.length || 0;
    const totalCabinSeats = cabins?.reduce(
      (sum, cabin) => sum + (cabin.totalSeats || 0),
      0,
    );
    const totalCabinBooked = cabins?.reduce(
      (sum, cabin) => sum + (cabin.bookedSeats || 0),
      0,
    );
    return { totalCabins, totalCabinSeats, totalCabinBooked };
  }, [cabins]);

  const handleStatusTransition = async (nextStatus) => {
    try {
      await dispatch(
        changeFlightInstanceStatus({ id: flightInstance.id, status: nextStatus }),
      ).unwrap();
      toast.success(`Flight instance moved to ${nextStatus}`);
    } catch (error) {
      toast.error(error || "Unable to update lifecycle status");
    }
  };

  if (loading && !flightInstance) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading flight instance...
        </div>
      </div>
    );
  }

  if (!flightInstance) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <Card className="max-w-md text-center">
          <CardContent className="space-y-4 p-8">
            <Plane className="mx-auto h-12 w-12 text-muted-foreground" />
            <div>
              <h2 className="text-xl font-semibold">Flight instance not found</h2>
              <p className="text-sm text-muted-foreground">
                The selected dated flight may have been deleted or is unavailable.
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
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Button
            variant="outline"
            onClick={() => navigate("/airline/instances")}
            className="w-fit"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {flightInstance.flightNumber || `Instance #${flightInstance.id}`}
              </h1>
              <Badge variant="outline" className={cn("gap-1", status.className)}>
                <StatusIcon className="h-3.5 w-3.5" />
                {status.label}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {airportCode(flightInstance.departureAirport)} to{" "}
              {airportCode(flightInstance.arrivalAirport)} •{" "}
              {formatDuration(
                flightInstance.departureDateTime,
                flightInstance.arrivalDateTime,
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <FlightLifecycleControl
            status={flightInstance.status}
            disabled={updateLoading}
            onTransition={handleStatusTransition}
          />
          <Button onClick={() => navigate(`/airline/instances/${id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Instance
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr]">
            <div className="space-y-3 p-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Departure
              </div>
              <div className="text-4xl font-bold">
                {airportCode(flightInstance.departureAirport)}
              </div>
              <div>
                <div className="font-semibold">
                  {airportName(flightInstance.departureAirport)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {flightInstance.departureAirport?.city?.name || "City unavailable"}
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                {formatDateTime(flightInstance.departureDateTime)}
              </div>
            </div>

            <div className="flex items-center justify-center border-y bg-muted/20 p-6 lg:border-x lg:border-y-0">
              <div className="text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Plane className="h-6 w-6" />
                </div>
                <div className="text-sm font-semibold">
                  {formatDuration(
                    flightInstance.departureDateTime,
                    flightInstance.arrivalDateTime,
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {flightInstance.aircraftCode ||
                    flightInstance.aircraftModal ||
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
                {airportCode(flightInstance.arrivalAirport)}
              </div>
              <div>
                <div className="font-semibold">
                  {airportName(flightInstance.arrivalAirport)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {flightInstance.arrivalAirport?.city?.name || "City unavailable"}
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                {formatDateTime(flightInstance.arrivalDateTime)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground">Total seats</div>
            <div className="text-2xl font-semibold">{flightInstance.totalSeats || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground">Booked</div>
            <div className="text-2xl font-semibold">{bookedSeats}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground">Available</div>
            <div className="text-2xl font-semibold">{availableSeats}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground">Load factor</div>
            <div className="text-2xl font-semibold">{loadFactor}%</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
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
                <InfoItem label="Instance ID" value={flightInstance.id} />
                <InfoItem label="Schedule ID" value={flightInstance.scheduleId} />
                <InfoItem label="Airline" value={flightInstance.airlineName} />
                <InfoItem
                  label="Aircraft"
                  value={flightInstance.aircraftCode || flightInstance.aircraftModal}
                />
                <InfoItem label="Terminal" value={flightInstance.terminal || "TBD"} />
                <InfoItem label="Gate" value={flightInstance.gate || "TBD"} />
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
                    {bookedSeats}/{flightInstance.totalSeats || 0}
                  </span>
                </div>
                <Progress value={loadFactor} className="h-2" />
                <div className="grid grid-cols-2 gap-3">
                  <InfoItem label="Min advance booking" value={flightInstance.minAdvanceBookingDays} />
                  <InfoItem label="Max advance booking" value={flightInstance.maxAdvanceBookingDays} />
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
              <Button
                onClick={() =>
                  navigate(`/airline/instances/${flightInstance.id}/cabins/new`)
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Cabin
              </Button>
            </CardHeader>
            <CardContent>
              {cabinsLoading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading cabins...
                </div>
              ) : !cabins?.length ? (
                <EmptyCabin />
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {cabins.map((cabin) => {
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
