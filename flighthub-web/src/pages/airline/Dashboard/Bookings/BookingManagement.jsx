import * as React from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { cancelBooking, getBookingsByAirline } from "@/Redux/booking/bookingThunk";
import { getAllFlightInstances } from "@/Redux/flightInstance/flightInstanceThunk";
import {
  AlertCircle,
  Banknote,
  CalendarClock,
  CheckCircle,
  Download,
  Eye,
  Loader2,
  Plane,
  RefreshCw,
  Search,
  SortAsc,
  Users,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";
import BookingDetails from "./BookingDetails";

const formatCurrency = (amount = 0, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const buildFilters = ({ searchQuery, statusFilter, flightInstanceId, sortDirection }) => ({
  search: searchQuery || undefined,
  status: statusFilter !== "all" ? statusFilter.toUpperCase() : undefined,
  flightInstanceId: flightInstanceId !== "all" ? flightInstanceId : undefined,
  sortDirection,
});

const statusTone = {
  CONFIRMED: {
    className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
    icon: CheckCircle,
  },
  PENDING: {
    className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
    icon: AlertCircle,
  },
  CANCELLED: {
    className: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300",
    icon: XCircle,
  },
  REFUNDED: {
    className: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300",
    icon: RefreshCw,
  },
};

const paymentTone = {
  SUCCESS: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
  PENDING: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
  FAILED: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300",
  REFUNDED: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300",
};

const BookingManagement = () => {
  const dispatch = useDispatch();
  const { bookings: apiBookings, loading, error } = useSelector((store) => store.booking);
  const { paginatedFlightInstances, loading: flightInstancesLoading } = useSelector(
    (store) => store.flightInstance,
  );

  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [flightInstanceId, setFlightInstanceId] = React.useState("all");
  const [sortDirection, setSortDirection] = React.useState("DESC");
  const [selectedBooking, setSelectedBooking] = React.useState(null);
  const [cancellingId, setCancellingId] = React.useState(null);

  const flightInstances = paginatedFlightInstances?.content || [];
  const bookings = Array.isArray(apiBookings) ? apiBookings : [];

  const filters = React.useMemo(
    () => buildFilters({ searchQuery, statusFilter, flightInstanceId, sortDirection }),
    [flightInstanceId, searchQuery, sortDirection, statusFilter],
  );

  React.useEffect(() => {
    dispatch(getAllFlightInstances());
  }, [dispatch]);

  React.useEffect(() => {
    dispatch(getBookingsByAirline(filters));
  }, [dispatch, filters]);

  const bookingStats = React.useMemo(() => ({
    total: bookings.length,
    confirmed: bookings.filter((booking) => booking.status === "CONFIRMED").length,
    pending: bookings.filter((booking) => booking.status === "PENDING").length,
    cancelled: bookings.filter((booking) => booking.status === "CANCELLED").length,
    totalRevenue: bookings.reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0),
  }), [bookings]);

  const refreshBookings = () => dispatch(getBookingsByAirline(filters));

  const getStatusBadge = (status) => {
    const key = String(status || "PENDING").toUpperCase();
    const tone = statusTone[key] || statusTone.PENDING;
    const Icon = tone.icon;

    return (
      <Badge variant="outline" className={cn("w-fit rounded-md", tone.className)}>
        <Icon className="mr-1 h-3 w-3" />
        {status || "PENDING"}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const key = String(status || "PENDING").toUpperCase();
    return (
      <Badge variant="outline" className={cn("w-fit rounded-md", paymentTone[key] || paymentTone.PENDING)}>
        {status || "PENDING"}
      </Badge>
    );
  };

  const handleCancelBooking = async (booking) => {
    if (!booking?.id) return;
    const confirmed = window.confirm(
      `Cancel booking ${booking.bookingReference || `#${booking.id}`}? This is only allowed while the booking is pending.`,
    );
    if (!confirmed) return;

    setCancellingId(booking.id);
    try {
      await dispatch(cancelBooking(booking.id)).unwrap();
      toast.success("Booking cancelled", {
        description: `${booking.bookingReference || "Booking"} was moved to cancelled.`,
      });
      refreshBookings();
    } catch (cancelError) {
      toast.error("Unable to cancel booking", { description: String(cancelError) });
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading customer bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          <AlertCircle className="mx-auto mb-4 h-8 w-8" />
          <p className="mb-4 text-sm font-medium">{error}</p>
          <Button onClick={refreshBookings}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Customer Bookings
            </h2>
            <p className="text-sm text-muted-foreground">
              Monitor passenger reservations, payment status, and upcoming departures.
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={refreshBookings}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="Total Bookings" value={bookingStats.total} icon={Users} tone="blue" />
        <StatCard label="Confirmed" value={bookingStats.confirmed} icon={CheckCircle} tone="emerald" />
        <StatCard label="Pending" value={bookingStats.pending} icon={CalendarClock} tone="amber" />
        <StatCard
          label="Gross Value"
          value={formatCurrency(bookingStats.totalRevenue, bookings[0]?.currency || "USD")}
          icon={Banknote}
          tone="violet"
        />
      </div>

      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-base">Bookings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:flex-wrap">
            <div className="relative min-w-[240px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by PNR, passenger, email..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={flightInstanceId} onValueChange={setFlightInstanceId}>
              <SelectTrigger className="w-full sm:w-64">
                <Plane className="mr-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <SelectValue placeholder="All Flights" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Flights</SelectItem>
                {flightInstancesLoading ? (
                  <SelectItem value="_loading" disabled>Loading...</SelectItem>
                ) : (
                  flightInstances.map((instance) => (
                    <SelectItem key={instance.id} value={String(instance.id)}>
                      {instance.flightNumber || instance.flight?.flightNumber || `#${instance.id}`} · {instance.departureAirport?.city?.name || "Origin"} - {instance.arrivalAirport?.city?.name || "Destination"}
                      {instance.departureDateTime
                        ? ` · ${new Date(instance.departureDateTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                        : ""}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <Select value={sortDirection} onValueChange={setSortDirection}>
              <SelectTrigger className="w-full sm:w-36">
                <SortAsc className="mr-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DESC">Latest first</SelectItem>
                <SelectItem value="ASC">Older first</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>

          {bookings.length === 0 ? (
            <div className="py-14 text-center">
              <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground">No bookings found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          ) : (
            <div className="max-w-full overflow-x-auto">
              <Table className="min-w-[1120px]">
                <TableHeader>
                  <TableRow className="bg-muted/60 hover:bg-muted/60">
                    <TableHead className="w-[150px]">Reference</TableHead>
                    <TableHead className="w-[170px]">Flight</TableHead>
                    <TableHead className="w-[160px]">Route</TableHead>
                    <TableHead className="w-[210px]">Passenger</TableHead>
                    <TableHead className="w-[160px]">Departure</TableHead>
                    <TableHead className="w-[130px]">Amount</TableHead>
                    <TableHead className="w-[130px]">Status</TableHead>
                    <TableHead className="w-[120px]">Payment</TableHead>
                    <TableHead className="w-[130px]">Booked</TableHead>
                    <TableHead className="w-[110px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id} className="hover:bg-muted/40">
                      <TableCell>
                        <span className="font-semibold text-primary">
                          {booking.bookingReference || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Plane className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0">
                            <div className="truncate font-medium text-foreground">
                              {booking.flightNumber || booking.flightName || "—"}
                            </div>
                            {booking.flightName && booking.flightNumber && (
                              <div className="truncate text-xs text-muted-foreground">
                                {booking.flightName}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">
                          {booking.departureAirport || "—"} → {booking.arrivalAirport || "—"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {booking.flightDuration || "Direct"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="truncate font-medium text-foreground">
                          {booking.passengers?.[0]?.fullName || "—"}
                        </div>
                        {booking.totalPassengers > 1 && (
                          <div className="text-xs text-muted-foreground">
                            +{booking.totalPassengers - 1} more
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">
                          {formatTime(booking.departureTime)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(booking.departureTime)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-foreground">
                          {formatCurrency(booking.totalAmount, booking.currency)}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(booking.status)}</TableCell>
                      <TableCell>{getPaymentStatusBadge(booking.paymentStatus)}</TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(booking.bookingDate)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedBooking(booking)}
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {booking.status === "PENDING" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={cancellingId === booking.id}
                              onClick={() => handleCancelBooking(booking)}
                              className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-300 dark:hover:bg-red-500/10"
                              title="Cancel pending booking"
                            >
                              {cancellingId === booking.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedBooking && (
        <BookingDetails
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          getStatusBadge={getStatusBadge}
          getPaymentStatusBadge={getPaymentStatusBadge}
        />
      )}
    </div>
  );
};

const toneClasses = {
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-300",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
};

const StatCard = ({ label, value, icon: Icon, tone }) => (
  <Card className="overflow-hidden">
    <CardContent className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="truncate text-2xl font-semibold text-foreground">{value}</p>
        </div>
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-md", toneClasses[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default BookingManagement;
