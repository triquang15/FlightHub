import * as React from "react"
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Plane,
  Plus,
  RefreshCw,
  Search,
  TicketCheck,
  XCircle,
} from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { getBookingsByUser } from "@/Redux/booking/bookingThunk"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import TravellerBookingCard from "./TravellerBookingCard"
import { BookingCardSkeleton } from "@/components/common/LoadingSystem"

const tabs = [
  { id: "all", label: "All bookings" },
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
  { id: "cancelled", label: "Cancelled" },
]

const getBookingCategory = (booking) => {
  if (booking.status?.toLowerCase() === "cancelled") return "cancelled"
  const departureTime = new Date(booking.departureTime).getTime()
  if (Number.isNaN(departureTime)) return "past"
  return departureTime >= Date.now() ? "upcoming" : "past"
}

const matchesSearch = (booking, query) => {
  if (!query) return true
  const searchable = [
    booking.bookingReference,
    booking.flightName,
    booking.flightNumber,
    booking.departureAirport,
    booking.arrivalAirport,
    booking.passengers?.map((passenger) => passenger.fullName).join(" "),
  ].filter(Boolean).join(" ").toLowerCase()

  return searchable.includes(query.toLowerCase())
}

const BookingHistory = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { bookings: rawBookings = [], loading, error } = useSelector((state) => state.booking)
  const [activeTab, setActiveTab] = React.useState("all")
  const [query, setQuery] = React.useState("")
  const [sortBy, setSortBy] = React.useState("departure-desc")

  const bookings = React.useMemo(() => (
    Array.isArray(rawBookings) ? rawBookings : []
  ), [rawBookings])

  React.useEffect(() => {
    dispatch(getBookingsByUser())
  }, [dispatch])

  const categoryCounts = React.useMemo(() => bookings.reduce((counts, booking) => {
    const category = getBookingCategory(booking)
    counts.all += 1
    counts[category] += 1
    return counts
  }, { all: 0, upcoming: 0, past: 0, cancelled: 0 }), [bookings])

  const filteredBookings = React.useMemo(() => {
    const results = bookings.filter((booking) => (
      (activeTab === "all" || getBookingCategory(booking) === activeTab) &&
      matchesSearch(booking, query)
    ))

    return results.sort((first, second) => {
      if (sortBy === "booked-desc") return new Date(second.bookingDate) - new Date(first.bookingDate)
      if (sortBy === "departure-asc") return new Date(first.departureTime) - new Date(second.departureTime)
      return new Date(second.departureTime) - new Date(first.departureTime)
    })
  }, [activeTab, bookings, query, sortBy])

  const paidCount = bookings.filter((booking) => ["paid", "success", "completed"].includes(booking.paymentStatus?.toLowerCase())).length
  const upcomingCount = categoryCounts.upcoming

  const reloadBookings = () => dispatch(getBookingsByUser())

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Traveler dashboard</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">My bookings</h1>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Manage active trips, review past bookings, download tickets, and keep payment status visible in one place.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={reloadBookings} variant="outline" className="h-11 rounded-xl px-4">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={() => navigate("/traveler")} className="h-11 rounded-xl px-5">
                <Plus className="mr-2 h-4 w-4" />
                New booking
              </Button>
            </div>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {[
              { label: "Total bookings", value: bookings.length, icon: TicketCheck, tone: "border-primary/20 bg-primary/10 text-primary" },
              { label: "Upcoming trips", value: upcomingCount, icon: CalendarClock, tone: "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-300" },
              { label: "Paid bookings", value: paidCount, icon: CheckCircle2, tone: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" },
            ].map(({ label, value, icon: Icon, tone }) => (
              <div key={label} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                <span className={cn("rounded-xl border p-2.5", tone)}><Icon className="h-5 w-5" /></span>
                <div>
                  <p className="text-2xl font-semibold">{value}</p>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 sm:p-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-slate-950">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm",
                    activeTab === tab.id ? "bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white" : "text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white",
                  )}
                >
                  {tab.label}
                  <span className={cn("ml-2 rounded-full px-1.5 py-0.5 text-[10px]", activeTab === tab.id ? "bg-primary/10 text-primary" : "bg-white/80 dark:bg-slate-800")}>
                    {categoryCounts[tab.id]}
                  </span>
                </button>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-[minmax(240px,1fr)_190px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search booking reference, flight, route..." className="h-10 rounded-xl pl-9" />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-10 w-full rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="departure-desc">Latest departure</SelectItem>
                  <SelectItem value="departure-asc">Earliest departure</SelectItem>
                  <SelectItem value="booked-desc">Recently booked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="grid gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <BookingCardSkeleton key={index} />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center dark:border-slate-800 dark:bg-slate-900">
              <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
              <h2 className="mt-4 text-lg font-semibold">We could not load your bookings</h2>
              <p className="mt-2 text-sm text-muted-foreground">{error}</p>
              <Button onClick={reloadBookings} variant="outline" className="mt-6 rounded-xl">Try again</Button>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center dark:border-slate-800 dark:bg-slate-900">
              {activeTab === "cancelled" ? <XCircle className="mx-auto h-10 w-10 text-muted-foreground" /> : <Plane className="mx-auto h-10 w-10 text-muted-foreground" />}
              <h2 className="mt-4 text-lg font-semibold">{query ? "No matching bookings" : `No ${activeTab === "all" ? "" : `${activeTab} `}bookings yet`}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{query ? "Try another PNR, flight number, or route." : "When you book a flight, it will appear here."}</p>
              {!query && <Button onClick={() => navigate("/traveler")} className="mt-6 rounded-xl">Search flights</Button>}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Showing {filteredBookings.length} {filteredBookings.length === 1 ? "booking" : "bookings"}</p>
              {filteredBookings.map((booking) => <TravellerBookingCard key={booking.id} booking={booking} navigate={navigate} />)}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

export default BookingHistory
