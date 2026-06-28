import * as React from "react"
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Download,
  Home,
  Loader2,
  Plane,
  Printer,
  QrCode,
  ShieldCheck,
  Ticket as TicketIcon,
  UserRound,
} from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { getBookingById } from "@/Redux/booking/bookingThunk"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { generateTicketPDF } from "./TicketPDF"

const formatDate = (value, options) => {
  if (!value) return "--"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "--"
  return new Intl.DateTimeFormat("en-US", options).format(date)
}

const formatMoney = (amount, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0)

const passengerName = (passenger, index) =>
  passenger?.fullName ||
  `${passenger?.firstName || passenger?.givenName || ""} ${passenger?.lastName || passenger?.familyName || ""}`.trim() ||
  `Passenger ${index + 1}`

const statusClass = (status) => {
  const normalized = status?.toLowerCase()
  if (["confirmed", "completed", "paid", "success"].includes(normalized)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
  }
  if (["pending", "pending_payment"].includes(normalized)) {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
  }
  if (normalized === "cancelled") {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
  }
  return "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
}

const Ticket = () => {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const ticketRef = React.useRef(null)
  const [downloading, setDownloading] = React.useState(false)
  const { booking, loading, error } = useSelector((state) => state.booking)

  React.useEffect(() => {
    if (bookingId) dispatch(getBookingById(bookingId))
  }, [bookingId, dispatch])

  const handlePrint = () => {
    const content = ticketRef.current
    if (!content) return

    const printWindow = window.open("", "_blank", "width=900,height=1200")
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>FlightHub E-Ticket</title>
          <meta charset="utf-8" />
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page { size: A4 portrait; margin: 12mm; }
            body { margin: 0; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          </style>
        </head>
        <body>${content.outerHTML}</body>
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); window.close(); }, 350);
          };
        </script>
      </html>
    `)
    printWindow.document.close()
  }

  const handleDownload = async () => {
    try {
      setDownloading(true)
      await generateTicketPDF(booking)
      toast.success("E-ticket downloaded")
    } catch (downloadError) {
      console.error("Could not download ticket:", downloadError)
      toast.error("Could not download the e-ticket")
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Loader2 className="mx-auto h-9 w-9 animate-spin text-primary" />
          <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">Preparing your e-ticket...</p>
        </div>
      </main>
    )
  }

  if (error || !booking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle className="h-7 w-7" />
          </span>
          <h1 className="mt-5 text-xl font-semibold">Ticket not found</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{error || "We could not load this booking."}</p>
          <Button onClick={() => navigate("/bookings")} className="mt-6 w-full rounded-xl">
            <Home className="mr-2 h-4 w-4" />
            Back to bookings
          </Button>
        </div>
      </main>
    )
  }

  const currency = booking.currency || "USD"
  const passengers = Array.isArray(booking.passengers) ? booking.passengers : []
  const seats = Array.isArray(booking.seatInstances) ? booking.seatInstances : []
  const baseFare = booking.fareBaseFare || 0
  const taxes = booking.fareTaxesAndFees || 0
  const fees = booking.fareAirlineFees || 0
  const total = booking.totalAmount || baseFare + taxes + fees

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <Button variant="ghost" onClick={() => navigate("/bookings")} className="-ml-3 rounded-xl">
              <ArrowLeft className="mr-2 h-4 w-4" />
              My bookings
            </Button>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">E-ticket</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Booking reference {booking.bookingReference || "N/A"} · Keep this ticket and a valid ID ready at the airport.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handlePrint} className="rounded-xl">
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button onClick={handleDownload} disabled={downloading} className="rounded-xl">
              {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Download PDF
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
        <div
          ref={ticketRef}
          className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 print:rounded-none print:border-slate-300 print:shadow-none"
        >
          <div className="flex flex-col gap-5 border-b border-slate-200 p-6 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <Plane className="h-7 w-7" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">FlightHub itinerary receipt</p>
                <h2 className="mt-2 text-2xl font-semibold">{booking.airlineName || "FlightHub"}</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{booking.flightName || "Selected route"}</p>
              </div>
            </div>
            <Badge variant="outline" className={cn("w-fit capitalize", statusClass(booking.status))}>
              <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
              {booking.status || "Confirmed"}
            </Badge>
          </div>

          <div className="grid border-b border-slate-200 dark:border-slate-800 sm:grid-cols-4">
            {[
              ["Booking ref", booking.bookingReference || "N/A"],
              ["Flight", booking.flightNumber || "N/A"],
              ["Cabin", booking.cabinClass || booking.fareName || "Economy"],
              ["Issued", formatDate(booking.bookingDate, { month: "short", day: "numeric", year: "numeric" })],
            ].map(([label, value]) => (
              <div key={label} className="border-b border-slate-200 p-4 dark:border-slate-800 sm:border-b-0 sm:border-r last:sm:border-r-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</p>
                <p className="mt-2 truncate text-sm font-semibold">{value}</p>
              </div>
            ))}
          </div>

          <div className="p-6">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/50">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                <div className="min-w-0">
                  <p className="text-4xl font-semibold tracking-tight">
                    {formatDate(booking.departureTime, { hour: "2-digit", minute: "2-digit", hour12: false })}
                  </p>
                  <p className="mt-3 truncate text-base font-semibold">{booking.departureAirport || "Departure airport"}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {formatDate(booking.departureTime, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>

                <div className="flex w-24 flex-col items-center text-center sm:w-40">
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                    {booking.flightDuration || "Direct"}
                  </span>
                  <div className="my-3 flex w-full items-center">
                    <span className="h-2 w-2 rounded-full border-2 border-primary bg-white dark:bg-slate-900" />
                    <span className="h-px flex-1 bg-slate-300 dark:bg-slate-700" />
                    <ArrowRight className="h-4 w-4 text-primary" />
                    <span className="h-px flex-1 bg-slate-300 dark:bg-slate-700" />
                    <span className="h-2 w-2 rounded-full border-2 border-primary bg-white dark:bg-slate-900" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Non-stop</span>
                </div>

                <div className="min-w-0 text-right">
                  <p className="text-4xl font-semibold tracking-tight">
                    {formatDate(booking.arrivalTime, { hour: "2-digit", minute: "2-digit", hour12: false })}
                  </p>
                  <p className="mt-3 truncate text-base font-semibold">{booking.arrivalAirport || "Arrival airport"}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {formatDate(booking.arrivalTime, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-3 flex items-center gap-2">
                <UserRound className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Passengers</h3>
              </div>
              <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="grid grid-cols-[1.5fr_0.6fr_0.6fr_0.8fr] bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                  <span>Name</span>
                  <span>Type</span>
                  <span>Seat</span>
                  <span>Class</span>
                </div>
                {(passengers.length ? passengers : [{}]).map((passenger, index) => {
                  const seat = seats[index]
                  return (
                    <div key={`${passengerName(passenger, index)}-${index}`} className="grid grid-cols-[1.5fr_0.6fr_0.6fr_0.8fr] border-t border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
                      <span className="font-semibold">{passengerName(passenger, index)}</span>
                      <span className="text-slate-500 dark:text-slate-400">{passenger?.isAdult === false ? "Child" : "Adult"}</span>
                      <span className="font-semibold">{seat?.seatNumber || "--"}</span>
                      <span className="capitalize text-slate-500 dark:text-slate-400">{booking.cabinClass || booking.fareName || "Economy"}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <InfoBlock title="Baggage" rows={[
                ["Cabin", booking.cabinBaggageAllowance ? `${booking.cabinBaggageAllowance} kg` : "7 kg"],
                ["Check-in", booking.checkinBaggageAllowance ? `${booking.checkinBaggageAllowance} kg` : "15 kg"],
              ]} />
              <InfoBlock title="Contact" rows={[
                ["Email", booking.contactInfo?.email || "--"],
                ["Phone", booking.contactInfo?.phone || "--"],
              ]} />
              <InfoBlock title="Fare" rows={[
                ["Base", formatMoney(baseFare, currency)],
                ["Taxes", formatMoney(taxes, currency)],
                ...(fees > 0 ? [["Fees", formatMoney(fees, currency)]] : []),
                ["Total", formatMoney(total, currency)],
              ]} emphasisLast />
            </div>

            <div className="my-6 border-t border-dashed border-slate-300 dark:border-slate-700" />

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg font-semibold">{booking.departureAirport || "Departure"} to {booking.arrivalAirport || "Arrival"}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {formatDate(booking.departureTime, { month: "long", day: "numeric", year: "numeric" })} · {formatDate(booking.departureTime, { hour: "2-digit", minute: "2-digit", hour12: false })}
                </p>
                <p className="mt-2 font-mono text-sm font-semibold">{booking.bookingReference || "N/A"}</p>
              </div>
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-slate-300 bg-white text-slate-900 dark:border-slate-700">
                <QrCode className="h-16 w-16" />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 text-xs leading-5 text-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">
            This is a computer-generated e-ticket. Carry a valid photo ID, arrive at the airport at least 2 hours before departure, and keep your booking reference available for check-in and support.
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <TicketIcon className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-semibold">Ticket summary</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{passengers.length || 1} passenger(s)</p>
              </div>
            </div>
            <div className="mt-5 space-y-3 text-sm">
              <SummaryRow label="Status" value={booking.status || "Confirmed"} />
              <SummaryRow label="Payment" value={booking.paymentStatus || "Not available"} />
              <SummaryRow label="Fare" value={booking.fareName || booking.cabinClass || "Economy"} />
              <SummaryRow label="Total" value={formatMoney(total, currency)} strong />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="font-semibold">Before you fly</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-500 dark:text-slate-400">
              <li>Check visa and identity document requirements before travel.</li>
              <li>Boarding closes around 25 minutes before departure.</li>
              <li>Seat and gate information may change at airport check-in.</li>
            </ul>
          </div>
        </aside>
      </section>
    </main>
  )
}

const InfoBlock = ({ title, rows, emphasisLast = false }) => (
  <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{title}</p>
    <div className="mt-3 space-y-2 text-sm">
      {rows.map(([label, value], index) => {
        const last = emphasisLast && index === rows.length - 1
        return (
          <div key={`${title}-${label}`} className={cn("flex justify-between gap-4", last && "border-t border-slate-200 pt-2 dark:border-slate-800")}>
            <span className="text-slate-500 dark:text-slate-400">{label}</span>
            <span className={cn("text-right font-medium", last && "font-semibold text-slate-950 dark:text-white")}>{value}</span>
          </div>
        )
      })}
    </div>
  </div>
)

const SummaryRow = ({ label, value, strong }) => (
  <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0 dark:border-slate-800">
    <span className="text-slate-500 dark:text-slate-400">{label}</span>
    <span className={cn("text-right capitalize", strong ? "text-lg font-semibold text-slate-950 dark:text-white" : "font-medium")}>{value}</span>
  </div>
)

export default Ticket
