import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  Clock,
  CreditCard,
  Copy,
  Download,
  FileText,
  Home,
  Loader2,
  Plane,
  RefreshCw,
  ShieldCheck,
  Ticket,
  UserRound,
} from "lucide-react"
import { toast } from "sonner"
import { getBookingById } from "@/Redux/booking/bookingThunk"
import { verifyPayment } from "@/Redux/payment/paymentThunk"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { generateTicketPDF } from "@/pages/traveler/Ticket/TicketPDF"

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

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
  const normalized = status?.toString().toUpperCase()
  if (["CONFIRMED", "COMPLETED", "SUCCESS", "PAID"].includes(normalized)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
  }
  if (["PENDING", "PENDING_PAYMENT", "PROCESSING"].includes(normalized)) {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
  }
  if (normalized === "CANCELLED") {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
  }
  return "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
}

const BookingSuccess = () => {
  const { bookingId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { booking, loading, error } = useSelector((state) => state.booking)
  const { loading: paymentLoading, error: paymentError } = useSelector((state) => state.payment)
  const [syncingConfirmation, setSyncingConfirmation] = useState(false)
  const [downloadingPDF, setDownloadingPDF] = useState(false)
  const [paymentCallbackError, setPaymentCallbackError] = useState(null)
  const hasProcessedPaymentRef = useRef(false)
  const hasShownStatusToastRef = useRef(false)

  const paymentStatusParam = searchParams.get("payment_status") || searchParams.get("redirect_status")
  const isPaymentCancelled = ["cancelled", "canceled", "cancel", "failed"].includes(
    paymentStatusParam?.toString().toLowerCase()
  )

  const refreshBookingUntilSettled = useCallback(async () => {
    if (!bookingId) return null

    let latest = null
    for (let attempt = 0; attempt < 8; attempt += 1) {
      latest = await dispatch(getBookingById(bookingId)).unwrap()
      if (["CONFIRMED", "CANCELLED"].includes(latest?.status)) return latest
      await wait(1500)
    }
    return latest
  }, [bookingId, dispatch])

  const processPayment = useCallback(async () => {
    if (hasProcessedPaymentRef.current) return

    if (isPaymentCancelled) {
      hasProcessedPaymentRef.current = true
      sessionStorage.removeItem("paymentDetails")
      setPaymentCallbackError("Payment was cancelled. Your booking is not confirmed yet.")
      toast.error("Payment cancelled. You can review the booking and try again.", {
        id: "payment-callback",
        duration: 5000,
      })
      await dispatch(getBookingById(bookingId))
      return
    }

    let storedPayment
    try {
      storedPayment = JSON.parse(sessionStorage.getItem("paymentDetails") || "null")
    } catch {
      storedPayment = null
    }

    const paymentId = Number(searchParams.get("paymentId") || storedPayment?.paymentId)
    const stripeSessionId = searchParams.get("session_id")
    const paypalOrderId = searchParams.get("token")

    if (!paymentId || (!stripeSessionId && !paypalOrderId)) return

    hasProcessedPaymentRef.current = true
    setSyncingConfirmation(true)
    try {
      await dispatch(verifyPayment({ paymentId, stripeSessionId, paypalOrderId })).unwrap()
      sessionStorage.removeItem("paymentDetails")
      const latest = await refreshBookingUntilSettled()
      toast.success(
        latest?.status === "CONFIRMED"
          ? "Payment verified. Your booking is confirmed."
          : "Payment verified. We are finalizing your ticket.",
        { id: "payment-callback", duration: 5000 },
      )
    } catch (verificationError) {
      console.error("Payment verification failed:", verificationError)
      setPaymentCallbackError(verificationError || "Payment verification failed. Please check your bookings.")
      toast.error(verificationError || "Payment verification failed. Please check your bookings.", {
        id: "payment-callback",
        duration: 6000,
      })
      await dispatch(getBookingById(bookingId))
    } finally {
      setSyncingConfirmation(false)
    }
  }, [bookingId, dispatch, isPaymentCancelled, refreshBookingUntilSettled, searchParams])

  useEffect(() => {
    queueMicrotask(() => {
      processPayment()
    })
  }, [processPayment])

  useEffect(() => {
    if (bookingId) dispatch(getBookingById(bookingId))
  }, [bookingId, dispatch])

  const handleDownloadTicket = async () => {
    if (!booking) return
    try {
      setDownloadingPDF(true)
      await generateTicketPDF(booking)
      toast.success("E-ticket downloaded")
    } catch (downloadError) {
      console.error("Error downloading ticket:", downloadError)
      toast.error("Could not download the e-ticket")
    } finally {
      setDownloadingPDF(false)
    }
  }

  const copyReference = async () => {
    if (!booking?.bookingReference) return
    try {
      await navigator.clipboard.writeText(booking.bookingReference)
      toast.success("Booking reference copied")
    } catch {
      toast.error("Could not copy booking reference")
    }
  }

  const passengers = useMemo(() => (
    Array.isArray(booking?.passengers) ? booking.passengers : []
  ), [booking])
  const seats = useMemo(() => (
    Array.isArray(booking?.seatInstances) ? booking.seatInstances : []
  ), [booking])
  const legs = useMemo(() => {
    const bookingLegs = Array.isArray(booking?.legs) ? booking.legs : []
    if (bookingLegs.length > 0) {
      return [...bookingLegs].sort((left, right) => (left.legOrder || 0) - (right.legOrder || 0))
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
    }]
  }, [booking])

  useEffect(() => {
    if (!booking || hasShownStatusToastRef.current || paymentStatusParam) return

    if (booking.status === "CONFIRMED") {
      hasShownStatusToastRef.current = true
      toast.success("Booking confirmed. Your e-ticket is ready.", { id: "booking-status" })
      return
    }

    if (booking.status === "CANCELLED") {
      hasShownStatusToastRef.current = true
      toast.error("This booking has been cancelled.", { id: "booking-status" })
    }
  }, [booking, paymentStatusParam])

  if (loading || paymentLoading || syncingConfirmation) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-950 dark:bg-slate-950 dark:text-white">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Loader2 className="h-7 w-7 animate-spin" />
          </span>
          <h1 className="mt-5 text-xl font-semibold">
            {paymentLoading || syncingConfirmation ? "Confirming payment" : "Loading booking"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {paymentLoading || syncingConfirmation
              ? "We are verifying the payment provider callback and finalizing your ticket."
              : "Retrieving the latest booking details."}
          </p>
        </div>
      </main>
    )
  }

  if (error || !booking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-950 dark:bg-slate-950 dark:text-white">
        <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle className="h-7 w-7" />
          </span>
          <h1 className="mt-5 text-2xl font-semibold">Booking details unavailable</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Payment may still be processing, or booking details are not ready yet.
          </p>
          {error && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300">
              {error}
            </div>
          )}
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Button onClick={() => dispatch(getBookingById(bookingId))} disabled={!bookingId} className="rounded-xl">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
            <Button onClick={() => navigate("/bookings")} variant="outline" className="rounded-xl">
              <FileText className="mr-2 h-4 w-4" />
              Bookings
            </Button>
            <Button onClick={() => navigate("/traveler")} variant="outline" className="rounded-xl">
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
          </div>
        </div>
      </main>
    )
  }

  const currency = booking.currency || "USD"
  const baseFare = booking.fareBaseFare || booking.fare?.baseFare || 0
  const taxes = booking.fareTaxesAndFees || 0
  const fees = booking.fareAirlineFees || booking.fare?.airlineFees || 0
  const total = booking.totalAmount || baseFare + taxes + fees
  const confirmed = booking.status === "CONFIRMED"
  const paid = ["SUCCESS", "COMPLETED", "PAID"].includes(booking.paymentStatus)
  const cancelled = booking.status === "CANCELLED" || Boolean(paymentCallbackError)
  const title = cancelled ? "Payment not completed" : confirmed ? "Booking confirmed" : paid ? "Payment verified" : "Booking pending"
  const subtitle = cancelled
    ? paymentCallbackError || "Payment was not completed. Your booking is not confirmed."
    : confirmed
    ? "Your itinerary is confirmed. Your tickets and trip details are ready."
    : paid
      ? "Payment is verified. Ticket confirmation may take a moment to settle."
      : "Your booking is waiting for payment confirmation."
  const heroTone = cancelled ? "rose" : confirmed ? "emerald" : "amber"

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <Button variant="ghost" onClick={() => navigate("/bookings")} className="-ml-3 mb-5 rounded-xl">
            <ArrowLeft className="mr-2 h-4 w-4" />
            My bookings
          </Button>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-stretch">
            <div className={cn(
              "rounded-2xl border p-6",
              heroTone === "emerald" && "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/70 dark:bg-emerald-950/20",
              heroTone === "amber" && "border-amber-200 bg-amber-50/70 dark:border-amber-900/70 dark:bg-amber-950/20",
              heroTone === "rose" && "border-rose-200 bg-rose-50/70 dark:border-rose-900/70 dark:bg-rose-950/20",
            )}>
              <div className="flex gap-4">
              <span className={cn(
                "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border bg-white shadow-sm dark:bg-slate-950",
                cancelled
                  ? "border-rose-200 text-rose-600 dark:border-rose-900 dark:text-rose-300"
                  : confirmed
                    ? "border-emerald-200 text-emerald-600 dark:border-emerald-900 dark:text-emerald-300"
                    : "border-amber-200 text-amber-600 dark:border-amber-900 dark:text-amber-300",
              )}>
                {cancelled ? <AlertCircle className="h-8 w-8" /> : confirmed ? <CheckCircle2 className="h-8 w-8" /> : <Clock className="h-8 w-8" />}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">FlightHub checkout</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">{subtitle}</p>
                {(paymentError || paymentCallbackError) && (
                  <p className={cn(
                    "mt-4 rounded-2xl border px-4 py-3 text-sm",
                    paymentCallbackError
                      ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
                      : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
                  )}>
                    {paymentCallbackError || `Payment verification warning: ${paymentError}`}
                  </p>
                )}
              </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <StatusMetric icon={CalendarCheck2} label="Trip" value={legs.length > 1 ? `${legs.length} legs` : "One way"} />
                <StatusMetric icon={UserRound} label="Travellers" value={`${passengers.length || 1} passenger(s)`} />
                <StatusMetric icon={CreditCard} label="Paid total" value={formatMoney(total, currency)} />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/80">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Booking reference</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="truncate font-mono text-2xl font-semibold">{booking.bookingReference || "N/A"}</p>
                <Button type="button" variant="outline" size="icon" onClick={copyReference} className="h-10 w-10 shrink-0 rounded-xl">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="outline" className={cn("capitalize", statusClass(booking.status))}>{booking.status || "Pending"}</Badge>
                <Badge variant="outline" className={cn("capitalize", statusClass(booking.paymentStatus))}>{booking.paymentStatus || "Payment pending"}</Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Trip itinerary</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {booking.airlineName || "Airline"} {legs.length > 1 ? `· ${legs.length} confirmed legs` : booking.flightNumber ? `· ${booking.flightNumber}` : ""}
                </p>
              </div>
              <Badge variant="outline" className="w-fit rounded-full border-primary/20 bg-primary/10 text-primary">
                <Plane className="mr-1.5 h-3.5 w-3.5" />
                Confirmed itinerary
              </Badge>
            </div>

            <div className="mt-5 space-y-3">
              {legs.map((leg, index) => (
                <ItineraryLegCard key={leg.id || index} leg={leg} index={index} formatDate={formatDate} />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center gap-2">
              <UserRound className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Passengers and seats</h2>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="grid grid-cols-[1.4fr_0.7fr_0.7fr] bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                <span>Passenger</span>
                <span>Type</span>
                <span>Seat</span>
              </div>
              {(passengers.length ? passengers : [{}]).map((passenger, index) => {
                const seat = seats[index]
                return (
                  <div key={`${passengerName(passenger, index)}-${index}`} className="grid grid-cols-[1.4fr_0.7fr_0.7fr] border-t border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
                    <span className="font-semibold">{passengerName(passenger, index)}</span>
                    <span className="text-slate-500 dark:text-slate-400">{passenger?.isAdult === false ? "Child" : "Adult"}</span>
                    <span className="font-semibold">{seat?.seatNumber || "Not assigned"}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Ticket className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-semibold">Ticket actions</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{passengers.length || 1} passenger(s)</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {!cancelled && (
                <>
                  <Button onClick={handleDownloadTicket} disabled={downloadingPDF || !confirmed} className="w-full rounded-xl">
                    {downloadingPDF ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Download e-ticket
                  </Button>
                  <Button onClick={() => navigate(`/view-ticket/${booking.id}`)} disabled={!confirmed} variant="outline" className="w-full rounded-xl">
                    <Ticket className="mr-2 h-4 w-4" />
                    View ticket
                  </Button>
                </>
              )}
              <Button onClick={() => navigate("/bookings")} variant="outline" className="w-full rounded-xl">
                <FileText className="mr-2 h-4 w-4" />
                All bookings
              </Button>
              {cancelled && (
                <Button onClick={() => navigate("/traveler")} className="w-full rounded-xl">
                  <Home className="mr-2 h-4 w-4" />
                  Search again
                </Button>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-semibold">Fare summary</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{booking.cabinClass || booking.fareName || "Economy"}</p>
              </div>
            </div>
            <div className="mt-5 space-y-3 text-sm">
              <SummaryRow label="Base fare" value={formatMoney(baseFare, currency)} />
              <SummaryRow label="Taxes and fees" value={formatMoney(taxes, currency)} />
              {fees > 0 && <SummaryRow label="Airline fees" value={formatMoney(fees, currency)} />}
              <SummaryRow label="Grand total" value={formatMoney(total, currency)} strong />
            </div>
          </div>
        </aside>
      </section>
    </main>
  )
}

const StatusMetric = ({ icon: Icon, label, value }) => (
  <div className="rounded-xl border border-white/70 bg-white/75 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950/50">
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
      <Icon className="h-4 w-4 text-primary" />
      {label}
    </div>
    <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">{value}</p>
  </div>
)

const ItineraryLegCard = ({ leg, index, formatDate }) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/50">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
          Leg {index + 1}
        </p>
        <p className="mt-1 text-sm font-semibold">{leg.flightNumber || "Flight details"}</p>
      </div>
      <Badge variant="outline" className="rounded-full border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {leg.flightDuration || "Direct"}
      </Badge>
    </div>
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
      <RoutePoint
        align="left"
        time={formatDate(leg.departureTime, { hour: "2-digit", minute: "2-digit", hour12: false })}
        airport={leg.departureAirport || "Departure airport"}
        date={formatDate(leg.departureTime, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
      />
      <div className="flex w-20 flex-col items-center text-center sm:w-36">
        <div className="flex w-full items-center">
          <span className="h-2 w-2 rounded-full border-2 border-primary bg-white dark:bg-slate-900" />
          <span className="h-px flex-1 bg-slate-300 dark:bg-slate-700" />
          <ArrowRight className="h-4 w-4 text-primary" />
          <span className="h-px flex-1 bg-slate-300 dark:bg-slate-700" />
          <span className="h-2 w-2 rounded-full border-2 border-primary bg-white dark:bg-slate-900" />
        </div>
      </div>
      <RoutePoint
        align="right"
        time={formatDate(leg.arrivalTime, { hour: "2-digit", minute: "2-digit", hour12: false })}
        airport={leg.arrivalAirport || "Arrival airport"}
        date={formatDate(leg.arrivalTime, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
      />
    </div>
  </div>
)

const RoutePoint = ({ time, airport, date, align }) => (
  <div className={cn("min-w-0", align === "right" && "text-right")}>
    <p className="text-3xl font-semibold tracking-tight sm:text-4xl">{time}</p>
    <p className="mt-3 truncate text-base font-semibold">{airport}</p>
    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{date}</p>
  </div>
)

const SummaryRow = ({ label, value, strong }) => (
  <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0 dark:border-slate-800">
    <span className="text-slate-500 dark:text-slate-400">{label}</span>
    <span className={cn("text-right", strong ? "text-lg font-semibold" : "font-medium")}>{value}</span>
  </div>
)

export default BookingSuccess
