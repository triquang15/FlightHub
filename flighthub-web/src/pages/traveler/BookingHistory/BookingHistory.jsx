import * as React from "react"
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Plane,
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
  const { bookings = [], loading, error } = useSelector((state) => state.booking)
  const [activeTab, setActiveTab] = React.useState("all")
  const [query, setQuery] = React.useState("")
  const [sortBy, setSortBy] = React.useState("departure-desc")

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

  return (
    <main className="min-h-screen bg-muted/30">
      <section className="border-b bg-background">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Your journeys</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">My bookings</h1>
              <p className="mt-3 max-w-xl text-muted-foreground">Review upcoming trips, access tickets, and keep track of your travel history.</p>
            </div>
            <Button onClick={() => navigate("/traveler")} className="h-11 w-fit rounded-full px-5">
              <Plane className="mr-2 h-4 w-4" />Book a new flight
            </Button>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { label: "Total bookings", value: bookings.length, icon: TicketCheck, tone: "text-primary bg-primary/10" },
              { label: "Upcoming journeys", value: upcomingCount, icon: CalendarClock, tone: "text-sky-600 bg-sky-500/10" },
              { label: "Paid bookings", value: paidCount, icon: CheckCircle2, tone: "text-emerald-600 bg-emerald-500/10" },
            ].map(({ label, value, icon: Icon, tone }) => (
              <div key={label} className="flex items-center gap-4 rounded-2xl border bg-card p-4">
                <span className={cn("rounded-xl p-2.5", tone)}><Icon className="h-5 w-5" /></span>
                <div><p className="text-2xl font-semibold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border bg-card p-3 shadow-sm sm:p-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex gap-1 overflow-x-auto rounded-xl bg-muted p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm",
                    activeTab === tab.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab.label}
                  <span className={cn("ml-2 rounded-full px-1.5 py-0.5 text-[10px]", activeTab === tab.id ? "bg-primary/10 text-primary" : "bg-background/70")}>
                    {categoryCounts[tab.id]}
                  </span>
                </button>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-[minmax(240px,1fr)_190px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search PNR, flight, route..." className="h-10 pl-9" />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
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
              {[...Array(3)].map((_, index) => <div key={index} className="h-56 animate-pulse rounded-3xl border bg-card" />)}
            </div>
          ) : error ? (
            <div className="rounded-3xl border bg-card px-6 py-16 text-center">
              <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
              <h2 className="mt-4 text-lg font-semibold">We could not load your bookings</h2>
              <p className="mt-2 text-sm text-muted-foreground">{error}</p>
              <Button onClick={() => dispatch(getBookingsByUser())} variant="outline" className="mt-6">Try again</Button>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="rounded-3xl border bg-card px-6 py-16 text-center">
              {activeTab === "cancelled" ? <XCircle className="mx-auto h-10 w-10 text-muted-foreground" /> : <Plane className="mx-auto h-10 w-10 text-muted-foreground" />}
              <h2 className="mt-4 text-lg font-semibold">{query ? "No matching bookings" : `No ${activeTab === "all" ? "" : `${activeTab} `}bookings yet`}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{query ? "Try another PNR, flight number, or route." : "When you book a flight, it will appear here."}</p>
              {!query && <Button onClick={() => navigate("/traveler")} className="mt-6">Search flights</Button>}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Showing {filteredBookings.length} {filteredBookings.length === 1 ? "booking" : "bookings"}</p>
              {filteredBookings.map((booking) => <TravellerBookingCard key={booking.id} booking={booking} navigate={navigate} />)}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

export default BookingHistory
