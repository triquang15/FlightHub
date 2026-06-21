import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowUpDown,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit,
  Eye,
  Loader2,
  MapPin,
  Plane,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  changeFlightInstanceStatus,
  deleteFlightInstance,
  getAllFlightInstances,
} from "@/Redux/flightInstance/flightInstanceThunk";
import { getFlightsByAirline } from "@/Redux/flight/flightThunk";
import { listAllAirports } from "@/Redux/airport/airportThunk";
import FlightLifecycleControl from "@/components/flight-ops/FlightLifecycleControl";

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.content)) return value.content;
  if (Array.isArray(value?.data)) return value.data;
  return [];
};

const normalizePage = (page) => {
  const payload = page?.data ?? page;
  const content = asArray(payload);

  return {
    content,
    totalPages: payload?.totalPages ?? (content.length ? 1 : 0),
    totalElements: payload?.totalElements ?? content.length,
  };
};

const statusConfig = {
  SCHEDULED: {
    label: "Scheduled",
    className: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300",
    dotClassName: "bg-blue-500",
  },
  BOARDING: {
    label: "Boarding",
    className: "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300",
    dotClassName: "bg-cyan-500",
  },
  DEPARTED: {
    label: "Departed",
    className: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300",
    dotClassName: "bg-violet-500",
  },
  ARRIVED: {
    label: "Arrived",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
    dotClassName: "bg-emerald-500",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300",
    dotClassName: "bg-red-500",
  },
};

const airportLabel = (airport) => {
  if (!airport) return "Airport unavailable";
  const code = airport.iataCode || airport.code || "N/A";
  const city = airport.city?.name || airport.cityName || airport.name || "";
  return `${code}${city ? ` - ${city}` : ""}`;
};

const airportCode = (airport) => airport?.iataCode || airport?.code || "N/A";

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

const getAvailableSeats = (instance) =>
  instance.availableSeats ?? instance.totalAvailableSeats ?? 0;

const getBookedSeats = (instance) =>
  Math.max(0, (instance.totalSeats || 0) - getAvailableSeats(instance));

const getLoadFactor = (instance) => {
  if (!instance.totalSeats) return 0;
  return Math.round((getBookedSeats(instance) / instance.totalSeats) * 100);
};

const loadFactorColor = (loadFactor) =>
  loadFactor >= 90
    ? "bg-red-500"
    : loadFactor >= 70
      ? "bg-amber-500"
      : "bg-emerald-500";

const FlightInstanceTable = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [dateFilter, setDateFilter] = useState(null);
  const [departureAirportFilter, setDepartureAirportFilter] = useState("all");
  const [arrivalAirportFilter, setArrivalAirportFilter] = useState("all");
  const [flightFilter, setFlightFilter] = useState("all");
  const [sortField, setSortField] = useState("departureDateTime");
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;
  const {
    paginatedFlightInstances,
    loading,
    error,
    updateLoading,
    deleteLoading,
  } = useSelector((store) => store.flightInstance);
  const { flights } = useSelector((store) => store.flight);
  const { airports } = useSelector((store) => store.airport);

  useEffect(() => {
    dispatch(
      listAllAirports({
        page: 0,
        size: 500,
        sortBy: "iataCode",
        sortDirection: "asc",
      }),
    );
    dispatch(getFlightsByAirline());
  }, [dispatch]);

  useEffect(() => {
    dispatch(
      getAllFlightInstances({
        page: currentPage - 1,
        size: itemsPerPage,
        onDate: dateFilter ? format(dateFilter, "yyyy-MM-dd") : undefined,
        departureAirportId:
          departureAirportFilter !== "all" ? departureAirportFilter : undefined,
        arrivalAirportId:
          arrivalAirportFilter !== "all" ? arrivalAirportFilter : undefined,
        flightId: flightFilter !== "all" ? flightFilter : undefined,
        sort: `${sortField},${sortDirection}`,
      }),
    );
  }, [
    dispatch,
    currentPage,
    dateFilter,
    departureAirportFilter,
    arrivalAirportFilter,
    flightFilter,
    sortField,
    sortDirection,
  ]);

  const pageData = useMemo(
    () => normalizePage(paginatedFlightInstances),
    [paginatedFlightInstances],
  );
  const instances = pageData.content;
  const totalPages = pageData.totalPages;
  const totalElements = pageData.totalElements;
  const airportOptions = asArray(airports);
  const flightOptions = asArray(flights);

  const hasActiveFilters =
    dateFilter ||
    departureAirportFilter !== "all" ||
    arrivalAirportFilter !== "all" ||
    flightFilter !== "all";

  const handleSort = (field) => {
    setCurrentPage(1);
    if (sortField === field) {
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
      return;
    }
    setSortField(field);
    setSortDirection("asc");
  };

  const clearFilters = () => {
    setDateFilter(null);
    setDepartureAirportFilter("all");
    setArrivalAirportFilter("all");
    setFlightFilter("all");
    setCurrentPage(1);
  };

  const handleDelete = async (instance) => {
    try {
      await dispatch(deleteFlightInstance(instance.id)).unwrap();
      toast.success(`${instance.flightNumber || "Flight instance"} deleted`);
    } catch (deleteError) {
      toast.error(deleteError || "Unable to delete flight instance");
    }
  };

  const handleStatusTransition = async (instance, status) => {
    try {
      await dispatch(changeFlightInstanceStatus({ id: instance.id, status })).unwrap();
      toast.success(`${instance.flightNumber || "Instance"} moved to ${status}`);
    } catch (transitionError) {
      toast.error(transitionError || "Unable to update lifecycle status");
    }
  };

  const pageStart = totalElements ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const pageEnd = Math.min(currentPage * itemsPerPage, totalElements);

  return (
    <div className="min-w-0 max-w-full space-y-5 overflow-hidden lg:space-y-6">
      <div className="flex min-w-0 flex-col gap-4 rounded-lg border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Plane className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">
              Flight Instances
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Manage dated flight operations, lifecycle state, and cabin inventory.
            </p>
          </div>
        </div>
        <Button
          onClick={() => navigate("/airline/instances/new")}
          className="h-10 w-full shrink-0 gap-2 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Create Instance
        </Button>
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="border-b pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <CardTitle className="text-base font-semibold">
                Search & filters
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Narrow inventory by operating date, route, or flight number.
              </p>
            </div>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="w-full gap-2 sm:w-auto"
              >
                <X className="h-4 w-4" />
                Clear filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Operating date
              </p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-10 w-full justify-start overflow-hidden text-left font-normal",
                      !dateFilter && "text-muted-foreground",
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {dateFilter ? format(dateFilter, "PPP") : "Any date"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateFilter}
                    onSelect={(date) => {
                      setDateFilter(date);
                      setCurrentPage(1);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Departure
              </p>
              <Select
                value={departureAirportFilter}
                onValueChange={(value) => {
                  setDepartureAirportFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-10 min-w-0">
                  <SelectValue placeholder="Departure airport" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departures</SelectItem>
                  {airportOptions.map((airport) => (
                    <SelectItem key={airport.id} value={String(airport.id)}>
                      {airportLabel(airport)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Arrival
              </p>
              <Select
                value={arrivalAirportFilter}
                onValueChange={(value) => {
                  setArrivalAirportFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-10 min-w-0">
                  <SelectValue placeholder="Arrival airport" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All arrivals</SelectItem>
                  {airportOptions.map((airport) => (
                    <SelectItem key={airport.id} value={String(airport.id)}>
                      {airportLabel(airport)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Flight
              </p>
              <Select
                value={flightFilter}
                onValueChange={(value) => {
                  setFlightFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-10 min-w-0">
                  <SelectValue placeholder="Flight number" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All flights</SelectItem>
                  {flightOptions.map((flight) => (
                    <SelectItem key={flight.id} value={String(flight.id)}>
                      {flight.flightNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 rounded-md border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              Showing {totalElements} matching result
              {totalElements === 1 ? "" : "s"}.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="flex flex-col gap-3 border-b sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="text-lg font-semibold">
              Instance Inventory
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Dated flight operations with lifecycle and capacity controls.
            </p>
          </div>
          <Badge variant="outline" className="w-fit shrink-0 rounded-md px-3 py-1">
            {loading ? "Refreshing..." : `${pageStart}-${pageEnd} of ${totalElements}`}
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
            <Table className="min-w-[1180px]">
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead
                    onClick={() => handleSort("id")}
                    className="w-[190px] cursor-pointer whitespace-nowrap"
                  >
                    <div className="flex items-center gap-2">
                      Flight
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort("departureAirportId")}
                    className="w-[230px] cursor-pointer whitespace-nowrap"
                  >
                    <div className="flex items-center gap-2">
                      Route
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort("departureDateTime")}
                    className="w-[190px] cursor-pointer whitespace-nowrap"
                  >
                    <div className="flex items-center gap-2">
                      Departure
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort("arrivalDateTime")}
                    className="w-[190px] cursor-pointer whitespace-nowrap"
                  >
                    <div className="flex items-center gap-2">
                      Arrival
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort("totalSeats")}
                    className="w-[150px] cursor-pointer whitespace-nowrap"
                  >
                    <div className="flex items-center gap-2">
                      Load
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="w-[210px]">Status</TableHead>
                  <TableHead className="sticky right-0 z-20 w-[128px] bg-muted/50 text-right shadow-[-12px_0_16px_-18px_hsl(var(--foreground))]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && instances.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading flight instances...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : instances.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center">
                      <div className="mx-auto max-w-md space-y-2">
                        <Plane className="mx-auto h-10 w-10 text-muted-foreground" />
                        <p className="font-medium">No flight instances found</p>
                        <p className="text-sm text-muted-foreground">
                          Try clearing filters or create a new dated instance.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  instances.map((instance) => {
                    const available = getAvailableSeats(instance);
                    const booked = getBookedSeats(instance);
                    const loadFactor = getLoadFactor(instance);
                    const status = statusConfig[instance.status] || statusConfig.SCHEDULED;
                    const canDelete =
                      instance.status === "SCHEDULED" && available === instance.totalSeats;

                    return (
                      <TableRow
                        key={instance.id}
                        className="align-top transition-colors hover:bg-muted/40"
                      >
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 font-semibold">
                              <Plane className="h-4 w-4 text-primary" />
                              {instance.flightNumber || `Instance #${instance.id}`}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Aircraft {instance.aircraftCode || instance.aircraftModal || "TBD"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-start gap-2">
                            <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                            <div className="min-w-0">
                              <div className="font-medium">
                                {airportCode(instance.departureAirport)} →{" "}
                                {airportCode(instance.arrivalAirport)}
                              </div>
                              <div className="truncate text-xs text-muted-foreground">
                                {instance.departureAirport?.city?.name || "Origin unavailable"} →{" "}
                                {instance.arrivalAirport?.city?.name || "Destination unavailable"}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 text-sm">
                            <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                            {formatDateTime(instance.departureDateTime)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 text-sm">
                            <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                            {formatDateTime(instance.arrivalDateTime)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">
                              {booked}/{instance.totalSeats || 0}
                            </div>
                            <div className="h-2 w-28 overflow-hidden rounded-full bg-muted">
                              <div
                                className={cn("h-full", loadFactorColor(loadFactor))}
                                style={{ width: `${loadFactor}%` }}
                              />
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {available} available
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <Badge variant="outline" className={cn("gap-2", status.className)}>
                              <span className={cn("h-2 w-2 rounded-full", status.dotClassName)} />
                              {status.label}
                            </Badge>
                            <FlightLifecycleControl
                              compact
                              status={instance.status}
                              disabled={updateLoading}
                              onTransition={(nextStatus) =>
                                handleStatusTransition(instance, nextStatus)
                              }
                            />
                          </div>
                        </TableCell>
                        <TableCell className="sticky right-0 z-10 bg-card text-right shadow-[-12px_0_16px_-18px_hsl(var(--foreground))]">
                          <TooltipProvider delayDuration={120}>
                            <div className="flex items-center justify-end gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="View instance"
                                    onClick={() => navigate(`/airline/instances/${instance.id}`)}
                                    className="h-8 w-8"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>View</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Edit instance"
                                    onClick={() => navigate(`/airline/instances/${instance.id}/edit`)}
                                    className="h-8 w-8"
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
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Delete instance"
                                        disabled={!canDelete || deleteLoading}
                                        className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                  </TooltipTrigger>
                                  <TooltipContent>Delete</TooltipContent>
                                </Tooltip>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete flight instance?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This permanently deletes{" "}
                                      <strong>{instance.flightNumber || `#${instance.id}`}</strong>{" "}
                                      on <strong>{formatDateTime(instance.departureDateTime)}</strong>.
                                      Only unbooked scheduled instances can be deleted.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(instance)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="divide-y md:hidden">
            {loading && instances.length === 0 ? (
              <div className="flex items-center justify-center gap-2 px-4 py-12 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading flight instances...
              </div>
            ) : instances.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <Plane className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-3 font-medium">No flight instances found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try clearing filters or create a new dated instance.
                </p>
              </div>
            ) : (
              instances.map((instance) => {
                const available = getAvailableSeats(instance);
                const booked = getBookedSeats(instance);
                const loadFactor = getLoadFactor(instance);
                const status = statusConfig[instance.status] || statusConfig.SCHEDULED;
                const canDelete =
                  instance.status === "SCHEDULED" && available === instance.totalSeats;

                return (
                  <div key={instance.id} className="space-y-4 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 font-semibold">
                          <Plane className="h-4 w-4 shrink-0 text-primary" />
                          <span className="truncate">
                            {instance.flightNumber || `Instance #${instance.id}`}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          Aircraft {instance.aircraftCode || instance.aircraftModal || "TBD"}
                        </p>
                      </div>
                      <Badge variant="outline" className={cn("shrink-0 gap-2", status.className)}>
                        <span className={cn("h-2 w-2 rounded-full", status.dotClassName)} />
                        {status.label}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div className="rounded-md bg-muted/40 p-3">
                        <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          Route
                        </div>
                        <div className="font-medium">
                          {airportCode(instance.departureAirport)} →{" "}
                          {airportCode(instance.arrivalAirport)}
                        </div>
                        <div className="mt-1 truncate text-xs text-muted-foreground">
                          {instance.departureAirport?.city?.name || "Origin unavailable"} →{" "}
                          {instance.arrivalAirport?.city?.name || "Destination unavailable"}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-md bg-muted/40 p-3">
                          <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            Departure
                          </div>
                          <div>{formatDateTime(instance.departureDateTime)}</div>
                        </div>
                        <div className="rounded-md bg-muted/40 p-3">
                          <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            Arrival
                          </div>
                          <div>{formatDateTime(instance.arrivalDateTime)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Load factor</span>
                        <span className="text-muted-foreground">
                          {booked}/{instance.totalSeats || 0} booked
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn("h-full", loadFactorColor(loadFactor))}
                          style={{ width: `${loadFactor}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {available} seats available
                      </div>
                    </div>

                    <FlightLifecycleControl
                      compact
                      status={instance.status}
                      disabled={updateLoading}
                      onTransition={(nextStatus) =>
                        handleStatusTransition(instance, nextStatus)
                      }
                    />

                    <TooltipProvider delayDuration={120}>
                      <div className="flex justify-end gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              aria-label="View instance"
                              onClick={() => navigate(`/airline/instances/${instance.id}`)}
                              className="h-9 w-9"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>View</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              aria-label="Edit instance"
                              onClick={() => navigate(`/airline/instances/${instance.id}/edit`)}
                              className="h-9 w-9"
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
                                  variant="outline"
                                  size="icon"
                                  aria-label="Delete instance"
                                  disabled={!canDelete || deleteLoading}
                                  className="h-9 w-9 text-red-600 hover:bg-red-50 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete flight instance?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This permanently deletes{" "}
                                <strong>{instance.flightNumber || `#${instance.id}`}</strong>{" "}
                                on <strong>{formatDateTime(instance.departureDateTime)}</strong>.
                                Only unbooked scheduled instances can be deleted.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(instance)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TooltipProvider>
                  </div>
                );
              })
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="text-sm text-muted-foreground">
                Showing {pageStart} to {pageEnd} of {totalElements} results
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
                  const offset =
                    totalPages <= 5
                      ? 1
                      : Math.min(Math.max(currentPage - 2, 1), totalPages - 4);
                  const pageNumber = offset + index;
                  return (
                    <Button
                      key={pageNumber}
                      variant={currentPage === pageNumber ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNumber)}
                      className="h-8 w-8 p-0"
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FlightInstanceTable;
