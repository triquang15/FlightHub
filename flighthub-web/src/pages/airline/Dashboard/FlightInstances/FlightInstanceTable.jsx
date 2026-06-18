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
  Users,
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
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  BOARDING: {
    label: "Boarding",
    className: "border-cyan-200 bg-cyan-50 text-cyan-700",
  },
  DEPARTED: {
    label: "Departed",
    className: "border-violet-200 bg-violet-50 text-violet-700",
  },
  ARRIVED: {
    label: "Arrived",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "border-red-200 bg-red-50 text-red-700",
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

  const activeCount = instances.filter((item) =>
    ["SCHEDULED", "BOARDING", "DEPARTED"].includes(item.status),
  ).length;
  const soldSeats = instances.reduce((sum, item) => sum + getBookedSeats(item), 0);
  const availableSeats = instances.reduce(
    (sum, item) => sum + getAvailableSeats(item),
    0,
  );

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
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
            Operations
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Flight Instances
          </h1>
          <p className="text-muted-foreground">
            Monitor dated departures, lifecycle state, and seat availability.
          </p>
        </div>
        <Button
          onClick={() => navigate("/airline/instances/new")}
          className="w-full gap-2 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Create Instance
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total results</p>
                <p className="text-2xl font-semibold">{totalElements}</p>
              </div>
              <Plane className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active on page</p>
                <p className="text-2xl font-semibold">{activeCount}</p>
              </div>
              <Clock className="h-8 w-8 text-cyan-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Seats on page</p>
                <p className="text-2xl font-semibold">
                  {soldSeats}/{soldSeats + availableSeats}
                </p>
              </div>
              <Users className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !dateFilter && "text-muted-foreground",
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateFilter ? format(dateFilter, "PPP") : "Operating date"}
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

            <Select
              value={departureAirportFilter}
              onValueChange={(value) => {
                setDepartureAirportFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger>
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

            <Select
              value={arrivalAirportFilter}
              onValueChange={(value) => {
                setArrivalAirportFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger>
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

            <Select
              value={flightFilter}
              onValueChange={(value) => {
                setFlightFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger>
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

          {hasActiveFilters && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                Clear filters
              </Button>
              <span className="text-sm text-muted-foreground">
                Showing {totalElements} matching result
                {totalElements === 1 ? "" : "s"}.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Instance Inventory</CardTitle>
          <div className="text-sm text-muted-foreground">
            {loading ? "Refreshing..." : `Showing ${pageStart}-${pageEnd}`}
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="overflow-hidden rounded-lg border">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead onClick={() => handleSort("id")} className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        Flight
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead onClick={() => handleSort("departureAirportId")} className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        Route
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead onClick={() => handleSort("departureDateTime")} className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        Departure
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead onClick={() => handleSort("arrivalDateTime")} className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        Arrival
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead onClick={() => handleSort("totalSeats")} className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        Load
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                        <TableRow key={instance.id} className="align-top">
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
                              <div>
                                <div className="font-medium">
                                  {airportCode(instance.departureAirport)} →{" "}
                                  {airportCode(instance.arrivalAirport)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {instance.departureAirport?.city?.name || "Origin unavailable"} →{" "}
                                  {instance.arrivalAirport?.city?.name || "Destination unavailable"}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="min-w-[160px]">
                            <div className="flex gap-2 text-sm">
                              <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                              {formatDateTime(instance.departureDateTime)}
                            </div>
                          </TableCell>
                          <TableCell className="min-w-[160px]">
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
                                  className={cn(
                                    "h-full",
                                    loadFactor >= 90
                                      ? "bg-red-500"
                                      : loadFactor >= 70
                                        ? "bg-amber-500"
                                        : "bg-emerald-500",
                                  )}
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
                              <Badge variant="outline" className={status.className}>
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
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="View instance"
                                onClick={() => navigate(`/airline/instances/${instance.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Edit instance"
                                onClick={() => navigate(`/airline/instances/${instance.id}/edit`)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Delete instance"
                                    disabled={!canDelete || deleteLoading}
                                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
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
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {pageStart} to {pageEnd} of {totalElements} results
              </div>
              <div className="flex flex-wrap items-center gap-2">
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
