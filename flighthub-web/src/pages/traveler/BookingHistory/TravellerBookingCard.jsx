import * as React from "react"
import {
  Armchair,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  Download,
  Eye,
  Loader2,
  Plane,
  ShieldCheck,
  Ticket,
  Users,
  WalletCards,
  XCircle,
} from "lucide-react"
import { useDispatch } from "react-redux"
import { toast } from "sonner"
import { cancelBooking } from "@/Redux/booking/bookingThunk"
import { generateTicketPDF } from "@/pages/traveler/Ticket/TicketPDF"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
} from "@/components/ui/alert-dialog"

const formatDateTime = (value, options) => {
  if (!value) return "Not available"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Not available"
  return new Intl.DateTimeFormat("en-US", options).format(date)
}

const formatMoney = (amount, currency = "USD") => new Intl.NumberFormat("en-US", {
  style: "currency",
  currency,
  maximumFractionDigits: 2,
}).format(Number(amount) || 0)

const getBookingLegs = (booking) => {
  const legs = Array.isArray(booking?.legs) ? booking.legs : []
  if (legs.length > 0) {
    return [...legs].sort((left, right) => (left.legOrder || 0) - (right.legOrder || 0))
  }

  if (!booking) return []
  return [{
    id: "primary",
    legOrder: 1,
    flightNumber: booking.flightNumber,
    departureAirport: booking.departureAirport,
    arrivalAirport: booking.arrivalAirport,
    departureTime: booking.departureTime,
    arrivalTime: booking.arrivalTime,
    flightDuration: booking.flightDuration,
    cabinClass: booking.cabinClass,
  }]
}

const routeName = (leg) => `${leg?.departureAirport || "Departure"} to ${leg?.arrivalAirport || "Arrival"}`

const statusStyles = {
  confirmed: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
  completed: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300",
  pending: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
  pending_payment: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
  cancelled: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300",
}

const TravellerBookingCard = ({ booking, navigate }) => {
  const dispatch = useDispatch()
  const [showDetails, setShowDetails] = React.useState(false)
  const [downloading, setDownloading] = React.useState(false)
  const [cancelling, setCancelling] = React.useState(false)
  const status = booking.status?.toLowerCase() || "confirmed"
  const paymentStatus = booking.paymentStatus?.toLowerCase()
  const currency = booking.currency || "USD"
  const confirmedBooking = ["confirmed", "completed"].includes(status)
  const ticketAvailable = confirmedBooking && ["paid", "success", "completed"].includes(paymentStatus)
  const canCancel = status === "pending"
  const passengers = booking.totalPassengers || booking.passengers?.length || 0
  const legs = getBookingLegs(booking)
  const firstLeg = legs[0] || {}
  const lastLeg = legs[legs.length - 1] || firstLeg
  const routeLabel = legs.length > 1
    ? `${firstLeg.departureAirport || "Departure"} ⇄ ${firstLeg.arrivalAirport || lastLeg.arrivalAirport || "Arrival"}`
    : booking.flightName || routeName(firstLeg)
  const departureDate = formatDateTime(firstLeg.departureTime || booking.departureTime, { weekday: "short", month: "short", day: "numeric", year: "numeric" })

  const handleDownloadTicket = async () => {
    try {
      setDownloading(true)
      await generateTicketPDF(booking)
      toast.success("E-ticket downloaded")
    } catch (error) {
      console.error("Failed to download ticket:", error)
      toast.error("Could not download the e-ticket")
    } finally {
      setDownloading(false)
    }
  }

  const handleCancelBooking = async () => {
    try {
      setCancelling(true)
      await dispatch(cancelBooking(booking.id)).unwrap()
      toast.success("Booking cancelled. Any held seats were released.")
    } catch (error) {
      toast.error(error || "Could not cancel this booking")
    } finally {
      setCancelling(false)
    }
  }

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
            <Plane className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-lg font-semibold">{routeLabel}</p>
              {legs.length > 1 ? (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {legs.length} flights
                </span>
              ) : booking.flightNumber && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {booking.flightNumber}
                </span>
              )}
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Ticket className="h-3.5 w-3.5" />
              Reference
              <strong className="font-semibold text-slate-950 dark:text-white">{booking.bookingReference || "N/A"}</strong>
              <span className="hidden sm:inline">·</span>
              <span>{departureDate}</span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={cn("w-fit capitalize", statusStyles[status] || statusStyles.confirmed)}>
            {status === "cancelled" ? (
              <XCircle className="mr-1 h-3.5 w-3.5" />
            ) : status === "pending" ? (
              <Clock className="mr-1 h-3.5 w-3.5" />
            ) : (
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
            )}
            {status.replace("_", " ")}
          </Badge>
          <Badge variant="outline" className={cn(
            "w-fit capitalize",
            ticketAvailable
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
          )}>
            <WalletCards className="mr-1 h-3.5 w-3.5" />
            {paymentStatus || "payment pending"}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 px-5 py-6 sm:px-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-stretch">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
          <div className="space-y-3">
            {legs.map((leg, index) => {
              const departureTime = formatDateTime(leg.departureTime, { hour: "2-digit", minute: "2-digit", hour12: false })
              const arrivalTime = formatDateTime(leg.arrivalTime, { hour: "2-digit", minute: "2-digit", hour12: false })
              return (
                <div key={`${leg.id || leg.flightInstanceId || index}`} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      {legs.length > 1 ? (index === 0 ? "Outbound" : "Return") : "Flight"}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {leg.flightNumber || booking.flightNumber || "Flight"}
                    </span>
                  </div>
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
                    <div className="min-w-0">
                      <p className="text-3xl font-semibold tracking-tight">{departureTime}</p>
                      <p className="mt-2 truncate text-sm font-semibold">{leg.departureAirport || "Departure airport"}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {formatDateTime(leg.departureTime, { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    <div className="flex w-24 flex-col items-center text-center sm:w-40">
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                        {leg.flightDuration || "Direct"}
                      </span>
                      <div className="my-3 flex w-full items-center">
                        <span className="h-2 w-2 rounded-full border-2 border-primary bg-background" />
                        <span className="h-px flex-1 bg-slate-300 dark:bg-slate-700" />
                        <ArrowRight className="h-4 w-4 text-primary" />
                        <span className="h-px flex-1 bg-slate-300 dark:bg-slate-700" />
                        <span className="h-2 w-2 rounded-full border-2 border-primary bg-background" />
                      </div>
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Non-stop</span>
                    </div>
                    <div className="min-w-0 text-right">
                      <p className="text-3xl font-semibold tracking-tight">{arrivalTime}</p>
                      <p className="mt-2 truncate text-sm font-semibold">{leg.arrivalAirport || "Arrival airport"}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Arrival</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              <Users className="h-3.5 w-3.5 text-primary" />
              {passengers} {passengers === 1 ? "traveler" : "travelers"}
            </span>
            {booking.fareName && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                {booking.fareName}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              <CalendarDays className="h-3.5 w-3.5 text-primary" />
              Booked {formatDateTime(booking.bookingDate, { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Trip total</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">{formatMoney(booking.totalAmount, currency)}</p>
            </div>
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950/60">
              <p className="text-xs text-slate-500 dark:text-slate-400">Cabin</p>
              <p className="mt-1 font-semibold capitalize">{firstLeg.cabinClass || booking.cabinClass || "Economy"}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950/60">
              <p className="text-xs text-slate-500 dark:text-slate-400">Seats</p>
              <p className="mt-1 font-semibold">{booking.seatInstances?.length ? booking.seatInstances.map((seat) => seat.seatNumber).join(", ") : "Not assigned"}</p>
            </div>
          </div>
        </div>
      </div>

      {showDetails && (
        <div className="grid gap-4 border-t border-slate-200 bg-slate-50 px-5 py-5 dark:border-slate-800 dark:bg-slate-950/50 md:grid-cols-3 sm:px-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"><Users className="h-4 w-4 text-primary" />Passengers</p>
            <div className="mt-3 space-y-2">
              {booking.passengers?.length ? booking.passengers.map((passenger, index) => (
                <p key={`${passenger.fullName}-${index}`} className="text-sm font-medium">{passenger.fullName || `${passenger.firstName || ""} ${passenger.lastName || ""}`.trim() || `Passenger ${index + 1}`}</p>
              )) : <p className="text-sm text-muted-foreground">Passenger details unavailable</p>}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"><Armchair className="h-4 w-4 text-primary" />Seats</p>
            <p className="mt-3 text-sm font-medium">{booking.seatInstances?.length ? booking.seatInstances.map((seat) => seat.seatNumber).join(", ") : "Not assigned"}</p>
            {booking.fareName && <p className="mt-2 text-xs text-muted-foreground">{booking.fareName}</p>}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"><CreditCard className="h-4 w-4 text-primary" />Fare summary</p>
            <div className="mt-3 space-y-2 text-sm">
              {booking.fareBaseFare != null && <p className="flex justify-between text-muted-foreground"><span>Base fare</span><strong className="text-foreground">{formatMoney(booking.fareBaseFare, currency)}</strong></p>}
              {booking.fareTaxesAndFees != null && <p className="flex justify-between text-muted-foreground"><span>Taxes & fees</span><strong className="text-foreground">{formatMoney(booking.fareTaxesAndFees, currency)}</strong></p>}
              <p className="flex justify-between border-t pt-2 font-semibold"><span>Total</span><span>{formatMoney(booking.totalAmount, currency)}</span></p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <CalendarDays className="h-4 w-4" />
          Keep your booking reference ready for support and check-in.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowDetails((open) => !open)} className="rounded-xl">
            {showDetails ? "Hide details" : "More details"} {showDetails ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(`/booking-success/${booking.id}`)} className="rounded-xl"><Eye className="mr-1.5 h-4 w-4" />Details</Button>
          {canCancel && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={cancelling} className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40">
                  {cancelling ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <XCircle className="mr-1.5 h-4 w-4" />}
                  Cancel
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will cancel the pending payment and release any held seats for booking {booking.bookingReference || "this booking"}.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep booking</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancelBooking} className="bg-red-600 text-white hover:bg-red-700">
                    Cancel booking
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {ticketAvailable && (
            <>
              <Button variant="outline" size="sm" onClick={handleDownloadTicket} disabled={downloading} className="rounded-xl">
                {downloading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Download className="mr-1.5 h-4 w-4" />}Download
              </Button>
              <Button size="sm" onClick={() => navigate(`/view-ticket/${booking.id}`)} className="rounded-xl"><Ticket className="mr-1.5 h-4 w-4" />Ticket</Button>
            </>
          )}
        </div>
      </div>
    </article>
  )
}

export default TravellerBookingCard
