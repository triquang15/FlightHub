import * as React from "react"
import {
  Armchair,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Download,
  Eye,
  Loader2,
  Plane,
  Ticket,
  Users,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"
import { generateTicketPDF } from "@/pages/traveler/Ticket/TicketPDF"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const formatDateTime = (value, options) => {
  if (!value) return "Not available"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Not available"
  return new Intl.DateTimeFormat("en-US", options).format(date)
}

const formatMoney = (amount) => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
}).format(amount || 0)

const statusStyles = {
  confirmed: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
  completed: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300",
  pending: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
  pending_payment: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
  cancelled: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300",
}

const TravellerBookingCard = ({ booking, navigate }) => {
  const [showDetails, setShowDetails] = React.useState(false)
  const [downloading, setDownloading] = React.useState(false)
  const status = booking.status?.toLowerCase() || "confirmed"
  const paymentStatus = booking.paymentStatus?.toLowerCase()
  const ticketAvailable = ["paid", "success", "completed"].includes(paymentStatus)

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

  return (
    <article className="overflow-hidden rounded-3xl border bg-card shadow-sm transition duration-300 hover:shadow-lg">
      <div className="flex flex-col gap-4 border-b px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Plane className="h-5 w-5" /></span>
          <div className="min-w-0">
            <p className="truncate font-semibold">{booking.flightName || "Flight"} <span className="text-muted-foreground">{booking.flightNumber && `· ${booking.flightNumber}`}</span></p>
            <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground"><Ticket className="h-3.5 w-3.5" />Booking reference <strong className="text-foreground">{booking.bookingReference || "N/A"}</strong></p>
          </div>
        </div>
        <Badge variant="outline" className={cn("w-fit capitalize", statusStyles[status] || statusStyles.confirmed)}>
          {status === "cancelled" ? <XCircle className="mr-1 h-3.5 w-3.5" /> : <CheckCircle2 className="mr-1 h-3.5 w-3.5" />}
          {status.replace("_", " ")}
        </Badge>
      </div>

      <div className="grid gap-6 px-5 py-6 sm:px-6 lg:grid-cols-[1.4fr_0.6fr] lg:items-center">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
          <div>
            <p className="text-2xl font-semibold sm:text-3xl">{formatDateTime(booking.departureTime, { hour: "2-digit", minute: "2-digit", hour12: false })}</p>
            <p className="mt-1 text-base font-semibold">{booking.departureAirport || "N/A"}</p>
            <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(booking.departureTime, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</p>
          </div>
          <div className="flex min-w-20 flex-col items-center text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{booking.flightDuration || "Direct"}</span>
            <div className="my-2 flex w-full items-center">
              <span className="h-2 w-2 rounded-full border-2 border-primary" />
              <span className="h-px flex-1 bg-border" />
              <Plane className="h-4 w-4 rotate-90 text-primary" />
              <span className="h-px flex-1 bg-border" />
              <span className="h-2 w-2 rounded-full border-2 border-primary" />
            </div>
            <span className="text-[10px] text-muted-foreground">Non-stop</span>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold sm:text-3xl">{formatDateTime(booking.arrivalTime, { hour: "2-digit", minute: "2-digit", hour12: false })}</p>
            <p className="mt-1 text-base font-semibold">{booking.arrivalAirport || "N/A"}</p>
            <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(booking.arrivalTime, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <div>
            <p className="text-xs text-muted-foreground">Travelers</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold"><Users className="h-4 w-4 text-primary" />{booking.totalPassengers || booking.passengers?.length || 0}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total paid</p>
            <p className="mt-1 text-sm font-semibold">{formatMoney(booking.totalAmount)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Payment</p>
            <p className={cn("mt-1 text-sm font-semibold capitalize", ticketAvailable ? "text-emerald-600" : "text-amber-600")}>{paymentStatus || "Not available"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Booked</p>
            <p className="mt-1 text-sm font-semibold">{formatDateTime(booking.bookingDate, { month: "short", day: "numeric", year: "numeric" })}</p>
          </div>
        </div>
      </div>

      {showDetails && (
        <div className="grid gap-4 border-t bg-muted/30 px-5 py-5 sm:grid-cols-3 sm:px-6">
          <div className="rounded-2xl border bg-background p-4">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"><Users className="h-4 w-4 text-primary" />Passengers</p>
            <div className="mt-3 space-y-2">
              {booking.passengers?.length ? booking.passengers.map((passenger, index) => (
                <p key={`${passenger.fullName}-${index}`} className="text-sm font-medium">{passenger.fullName || `${passenger.firstName || ""} ${passenger.lastName || ""}`.trim() || `Passenger ${index + 1}`}</p>
              )) : <p className="text-sm text-muted-foreground">Passenger details unavailable</p>}
            </div>
          </div>
          <div className="rounded-2xl border bg-background p-4">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"><Armchair className="h-4 w-4 text-primary" />Seats</p>
            <p className="mt-3 text-sm font-medium">{booking.seatInstances?.length ? booking.seatInstances.map((seat) => seat.seatNumber).join(", ") : "Not assigned"}</p>
            {booking.fareName && <p className="mt-2 text-xs text-muted-foreground">{booking.fareName}</p>}
          </div>
          <div className="rounded-2xl border bg-background p-4">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"><CreditCard className="h-4 w-4 text-primary" />Fare summary</p>
            <div className="mt-3 space-y-2 text-sm">
              {booking.fareBaseFare != null && <p className="flex justify-between text-muted-foreground"><span>Base fare</span><strong className="text-foreground">{formatMoney(booking.fareBaseFare)}</strong></p>}
              {booking.fareTaxesAndFees != null && <p className="flex justify-between text-muted-foreground"><span>Taxes & fees</span><strong className="text-foreground">{formatMoney(booking.fareTaxesAndFees)}</strong></p>}
              <p className="flex justify-between border-t pt-2 font-semibold"><span>Total</span><span>{formatMoney(booking.totalAmount)}</span></p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="flex items-center gap-2 text-xs text-muted-foreground"><CalendarDays className="h-4 w-4" />Keep your booking reference ready for support and check-in.</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowDetails((open) => !open)}>
            {showDetails ? "Hide details" : "More details"} {showDetails ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(`/booking-success/${booking.id}`)}><Eye className="mr-1.5 h-4 w-4" />View details</Button>
          {ticketAvailable && (
            <>
              <Button variant="outline" size="sm" onClick={handleDownloadTicket} disabled={downloading}>
                {downloading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Download className="mr-1.5 h-4 w-4" />}Download
              </Button>
              <Button size="sm" onClick={() => navigate(`/view-ticket/${booking.id}`)}><Ticket className="mr-1.5 h-4 w-4" />View ticket</Button>
            </>
          )}
        </div>
      </div>
    </article>
  )
}

export default TravellerBookingCard
