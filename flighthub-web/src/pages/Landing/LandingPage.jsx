import * as React from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  Activity,
  ArrowRight,
  BarChart3,
  BellRing,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Gauge,
  LockKeyhole,
  Menu,
  Plane,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  TicketCheck,
  Users,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import api from "@/utils/api"

const navItems = [
  { label: "Booking", href: "#booking" },
  { label: "Workspaces", href: "#workspaces" },
  { label: "Analytics", href: "#analytics" },
  { label: "Security", href: "#security" },
]

const journeySteps = [
  { label: "Search", detail: "Route, date, cabin" },
  { label: "Compare", detail: "Fare, seats, extras" },
  { label: "Pay", detail: "Stripe or PayPal" },
  { label: "Ticket", detail: "Email and history" },
]

const experienceMetrics = [
  { label: "Trip modes", values: ["One-way", "Round-trip", "Multi-city"] },
  { label: "Payments", values: ["Stripe", "PayPal"] },
  { label: "Operations", values: ["Inventory", "Seats", "Notifications"] },
]

const bookingCards = [
  {
    icon: Search,
    title: "Search with confidence",
    description: "Routes, dates, cabin, passengers, and trip type stay visible before travelers reach results.",
  },
  {
    icon: TicketCheck,
    title: "Choose the right fare",
    description: "Fare family, taxes, baggage, meals, seats, and protection are compared before payment.",
  },
  {
    icon: CircleDollarSign,
    title: "Checkout to ticket",
    description: "Payment verification, booking history, ticket emails, and e-ticket screens complete the flow.",
  },
]

const fallbackPromotions = [
  {
    id: "member15",
    code: "MEMBER15",
    title: "Member fare",
    description: "Save more when signed in and manage the trip from your account.",
    discount: "15% off",
  },
  {
    id: "weekend",
    code: "WEEKEND",
    title: "Weekend escape",
    description: "Short-haul routes with clean fare comparison and seat selection.",
    discount: "Limited offer",
  },
  {
    id: "hello25",
    code: "HELLO25",
    title: "First booking",
    description: "Start with a cleaner checkout from fare to ticket confirmation.",
    discount: "$25 off",
  },
]

const workspaceCards = [
  {
    title: "Traveler",
    metric: "Book",
    detail: "Search, fare selection, seat hold, add-ons, payment, ticket, and booking history.",
    icon: TicketCheck,
  },
  {
    title: "Airline owner",
    metric: "Operate",
    detail: "Fleet, cabins, schedules, flight instances, fares, coupons, customer bookings, and insights.",
    icon: Plane,
  },
  {
    title: "System admin",
    metric: "Control",
    detail: "Users, airline registry, network data, analytics, notifications, integrations, and observability.",
    icon: ShieldCheck,
  },
]

const fallbackRoutes = [
  { fromCode: "SGN", toCode: "SIN", fromCity: "Ho Chi Minh City", toCity: "Singapore", price: "$128", departures: 2 },
  { fromCode: "SGN", toCode: "HAN", fromCity: "Ho Chi Minh City", toCity: "Hanoi", price: "$96", departures: 3 },
  { fromCode: "SIN", toCode: "SGN", fromCity: "Singapore", toCity: "Ho Chi Minh City", price: "$136", departures: 2 },
]

const preferredRoutePairs = [
  ["SGN", "SIN"],
  ["SIN", "SGN"],
  ["SGN", "HAN"],
  ["HAN", "SGN"],
  ["SGN", "HKG"],
  ["KUL", "SGN"],
]

const platformCards = [
  { icon: Users, title: "Identity", detail: "Role-aware access, OAuth profiles, avatar metadata, and secure logout." },
  { icon: BellRing, title: "Notifications", detail: "Booking events, security alerts, delivery logs, and DLQ visibility." },
  { icon: Activity, title: "Observability", detail: "Grafana, Prometheus, Loki, Kibana, Elasticsearch, and service health." },
  { icon: LockKeyhole, title: "Controls", detail: "Gateway routing, Redis rate limits, payment verification, and role guards." },
]

const securityItems = [
  "Gateway logout and token restore",
  "Redis rate limits and role guards",
  "Payment callbacks and verification",
  "Notification event logs and delivery tracking",
]

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const getPageItems = (payload) => {
  const data = payload?.data?.data ?? payload?.data ?? payload
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.content)) return data.content
  if (Array.isArray(data?.results)) return data.results
  return []
}

const getAirportId = (airport) => airport?.id || airport?.airportId
const getIata = (airport) => airport?.iataCode || airport?.iata || ""
const getAirportCity = (airport) =>
  airport?.city?.name || airport?.cityName || airport?.address?.cityName || airport?.address?.city || airport?.name || "City"
const getAirportHeroImage = (airport) =>
  airport?.heroImageUrl || airport?.imageUrl || airport?.destinationImageUrl || airport?.media?.heroImageUrl || null

const toIsoDate = (date) => {
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60 * 1000).toISOString().slice(0, 10)
}

const addDays = (days) => {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + days)
  return toIsoDate(date)
}

const formatMoney = (amount, currency = "USD") => {
  const value = Number(amount)
  if (!Number.isFinite(value) || value <= 0) return null
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

const getFareAmount = (flight) =>
  flight?.fare?.totalPrice ?? flight?.fare?.currentPrice ?? flight?.fare?.baseFare ?? flight?.lowestFare ?? flight?.price

const formatCouponDiscount = (coupon) => {
  const value = Number(coupon?.discountValue ?? 0)
  if (!Number.isFinite(value) || value <= 0) return "Special fare"
  if (coupon?.discountType === "PERCENTAGE") return `${value}% off`
  return formatMoney(value) ? `${formatMoney(value)} off` : "Special fare"
}

const formatCouponDate = (value) => {
  if (!value) return "Limited time"
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value))
}

const createPromotion = (coupon, index = 0) => {
  if (!coupon) return fallbackPromotions[index % fallbackPromotions.length]
  return {
    id: coupon.id || coupon.code || `coupon-${index}`,
    code: coupon.code || "OFFER",
    title: formatCouponDiscount(coupon),
    description: coupon.description || "Use this promo code during checkout on eligible fares.",
    discount: coupon.validUntil ? `Valid until ${formatCouponDate(coupon.validUntil)}` : "Active now",
  }
}

const buildRouteCandidates = (airports = []) => {
  const byIata = new Map(
    airports
      .filter((airport) => getAirportId(airport) && getIata(airport))
      .map((airport) => [getIata(airport).toUpperCase(), airport]),
  )

  const preferred = preferredRoutePairs
    .map(([from, to]) => ({ from: byIata.get(from), to: byIata.get(to) }))
    .filter((route) => route.from && route.to && getAirportId(route.from) !== getAirportId(route.to))

  if (preferred.length >= 4) return preferred.slice(0, 5)

  const pool = airports.filter((airport) => getAirportId(airport)).slice(0, 8)
  const generated = []
  for (let index = 0; index < pool.length - 1 && generated.length < 5; index += 1) {
    generated.push({ from: pool[index], to: pool[index + 1] })
  }

  return [...preferred, ...generated]
    .filter((route, index, list) =>
      list.findIndex((item) => getAirportId(item.from) === getAirportId(route.from) && getAirportId(item.to) === getAirportId(route.to)) === index,
    )
    .slice(0, 5)
}

const createLiveRoute = ({ from, to, date, flight, fallback }) => {
  const fromCode = getIata(from) || fallback?.fromCode || "FROM"
  const toCode = getIata(to) || fallback?.toCode || "TO"
  const price = formatMoney(getFareAmount(flight), flight?.fare?.currency || "USD") || fallback?.price || "Live fares"

  return {
    fromCode,
    toCode,
    fromCity: getAirportCity(from) || fallback?.fromCity || "Origin",
    toCity: getAirportCity(to) || fallback?.toCity || "Destination",
    price,
    date,
    departures: flight ? 1 : fallback?.departures || 0,
    image: getAirportHeroImage(to) || getAirportHeroImage(from) || null,
    href: getAirportId(from) && getAirportId(to) && date
      ? `/search?${new URLSearchParams({
          from: String(getAirportId(from)),
          to: String(getAirportId(to)),
          depart: date,
          passengers: "1",
          cabinClass: "ECONOMY",
          trip: "oneway",
        }).toString()}`
      : null,
  }
}

const LandingPage = () => {
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [liveRoutes, setLiveRoutes] = React.useState(fallbackRoutes)
  const [isLiveLoading, setIsLiveLoading] = React.useState(true)
  const [promotions, setPromotions] = React.useState(fallbackPromotions)

  React.useEffect(() => {
    let cancelled = false

    const loadLiveRoutes = async () => {
      setIsLiveLoading(true)

      try {
        const airportsResponse = await api.get("/api/airports", {
          params: { page: 0, size: 100, sortBy: "iataCode", sortDirection: "asc" },
        })
        const airports = getPageItems(airportsResponse)
        const candidates = buildRouteCandidates(airports)
        const probeDates = [1, 2, 3, 7, 14].map(addDays)
        const routes = []

        for (const [index, candidate] of candidates.entries()) {
          let matchedRoute = null

          for (const date of probeDates) {
            try {
              const response = await api.get("/api/flights/search", {
                params: {
                  departureAirportId: getAirportId(candidate.from),
                  arrivalAirportId: getAirportId(candidate.to),
                  departureDate: date,
                  passengers: 1,
                  cabinClass: "ECONOMY",
                  page: 0,
                  size: 1,
                  sortBy: "departure",
                  sortOrder: "asc",
                },
              })
              const [firstFlight] = getPageItems(response)
              if (firstFlight) {
                matchedRoute = createLiveRoute({ ...candidate, date, flight: firstFlight, fallback: fallbackRoutes[index] })
                break
              }
            } catch {
              break
            }
          }

          routes.push(matchedRoute || createLiveRoute({ ...candidate, date: probeDates[0], fallback: fallbackRoutes[index] }))
        }

        if (!cancelled) {
          setLiveRoutes(routes.length ? routes : fallbackRoutes)
        }
      } catch {
        if (!cancelled) setLiveRoutes(fallbackRoutes)
      } finally {
        if (!cancelled) setIsLiveLoading(false)
      }
    }

    loadLiveRoutes()

    return () => {
      cancelled = true
    }
  }, [])

  React.useEffect(() => {
    let cancelled = false

    const loadPromotions = async () => {
      try {
        const response = await api.get("/api/coupons/public/active", { params: { limit: 3 } })
        const coupons = getPageItems(response)
        if (!cancelled) {
          setPromotions(coupons.length ? coupons.slice(0, 3).map(createPromotion) : fallbackPromotions)
        }
      } catch {
        if (!cancelled) setPromotions(fallbackPromotions)
      }
    }

    loadPromotions()

    return () => {
      cancelled = true
    }
  }, [])

  const heroRoute = liveRoutes[0] || fallbackRoutes[0]
  const hasSearchReadyRoute = liveRoutes.some((route) => Boolean(route.href))
  const analyticsRows = liveRoutes.slice(0, 3).map((route, index) => ({
    route: `${route.fromCode} -> ${route.toCode}`,
    bookings: route.departures ? `${route.departures}` : "Live",
    revenue: route.price,
    trend: route.href ? "Search-ready" : index === 0 && isLiveLoading ? "Loading" : "Fallback",
  }))
  const handleHeroRouteClick = () => {
    if (heroRoute.href) {
      navigate(heroRoute.href)
      return
    }
    navigate("/traveler")
  }
  const heroBackgroundImage = heroRoute.image || "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=2600&q=85"

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/70 bg-background/78 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-3" aria-label="FlightHub home">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
              <Plane className="h-5 w-5" />
            </span>
            <span className="truncate text-lg font-bold tracking-tight">FlightHub</span>
          </Link>

          <nav className="hidden items-center gap-1 rounded-full border bg-background/70 p-1 shadow-sm md:flex" aria-label="Landing navigation">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Button variant="ghost" onClick={() => navigate("/login")} className="rounded-full">
              Sign in
            </Button>
            <Button onClick={() => navigate("/traveler")} className="rounded-full px-5">
              Search flights <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {mobileOpen && (
          <div className="border-t bg-background/96 px-4 py-4 backdrop-blur-2xl md:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col gap-1" aria-label="Mobile landing navigation">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-2xl px-3 py-3 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  {item.label}
                </a>
              ))}
              <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-4">
                <Button variant="outline" onClick={() => navigate("/login")}>
                  Sign in
                </Button>
                <Button onClick={() => navigate("/traveler")}>Search</Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main>
        <section className="relative isolate min-h-screen overflow-hidden pt-16">
          <div className="absolute inset-0 -z-20">
            <img
              src={heroBackgroundImage}
              alt=""
              className="h-full w-full object-cover opacity-45 dark:opacity-38"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.97)_0%,rgba(248,250,252,0.9)_44%,rgba(224,242,254,0.5)_100%)] dark:bg-[linear-gradient(90deg,rgba(8,13,26,0.98)_0%,rgba(8,13,26,0.88)_48%,rgba(8,47,73,0.42)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(14,165,233,0.18),transparent_28rem),linear-gradient(0deg,rgb(var(--background))_0%,transparent_42%)] dark:bg-[radial-gradient(circle_at_82%_18%,rgba(56,189,248,0.3),transparent_28rem),linear-gradient(0deg,rgb(var(--background))_0%,transparent_44%)]" />
          </div>

          <div className="pointer-events-none absolute inset-0 -z-10">
            <motion.div
              className="absolute left-[8%] top-[28%] hidden h-2 w-2 rounded-full bg-primary/70 shadow-[0_0_28px_rgba(56,189,248,0.72)] sm:block"
              animate={{ x: ["0vw", "74vw"], y: [0, -70, -12], opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 9.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute right-[12%] top-[20%] flex h-12 w-12 items-center justify-center rounded-full border bg-background/65 text-primary shadow-xl backdrop-blur-xl dark:bg-background/40"
              animate={{ y: [0, -18, 0], rotate: [0, 6, 0] }}
              transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut" }}
            >
              <Plane className="h-5 w-5" />
            </motion.div>
          </div>

          <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[0.86fr_1.14fr] lg:px-8 lg:py-20">
            <motion.div className="max-w-3xl" initial="hidden" animate="visible" variants={stagger}>
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-4 py-2 text-xs font-bold text-foreground shadow-sm backdrop-blur-xl">
                <Sparkles className="h-4 w-4 text-primary" />
                Airline commerce, booking, and operations
              </motion.div>

              <motion.h1 variants={fadeUp} className="mt-7 text-5xl font-semibold leading-[0.98] tracking-tight text-foreground sm:text-7xl lg:text-8xl">
                FlightHub
              </motion.h1>

              <motion.p variants={fadeUp} className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                A modern flight platform where travelers book confidently, airlines operate inventory, and admins monitor the whole system from one polished workspace.
              </motion.p>

              <motion.div variants={fadeUp} className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button onClick={() => navigate("/traveler")} className="h-12 rounded-full px-6">
                  Search flights <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button onClick={() => navigate("/login")} variant="outline" className="h-12 rounded-full bg-background/65 px-6 backdrop-blur-xl">
                  Enter workspace
                </Button>
              </motion.div>

              <motion.div variants={fadeUp} className="mt-8 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                {["Traveler checkout", "Airline operations", "Super admin control"].map((item) => (
                  <span key={item} className="flex items-center gap-2 rounded-full border bg-background/55 px-3 py-2 backdrop-blur-xl">
                    <Check className="h-4 w-4 text-emerald-500" />
                    {item}
                  </span>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              className="relative mx-auto w-full max-w-2xl lg:max-w-none"
              initial={{ opacity: 0, y: 32, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.75, delay: 0.12, ease: "easeOut" }}
            >
              <FloatingBadge className="-left-5 top-16 hidden lg:flex" icon={Gauge} label={hasSearchReadyRoute ? "Live routes found" : "Search data ready"} />
              <FloatingBadge className="-right-3 bottom-24 hidden lg:flex" icon={Clock3} label={isLiveLoading ? "Checking inventory" : "Fare checks ready"} reverse />

              <div className="relative overflow-hidden rounded-[2.25rem] border bg-background/72 p-3 shadow-2xl shadow-primary/10 backdrop-blur-2xl dark:bg-background/58">
                <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/12 blur-3xl" />
                <div className="absolute -bottom-24 left-10 h-60 w-60 rounded-full bg-emerald-400/10 blur-3xl" />

                <div className="relative overflow-hidden rounded-[1.55rem] border bg-card/90 shadow-sm backdrop-blur-xl">
                  <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Flight operations view</p>
                      <h2 className="mt-2 text-2xl font-semibold">
                        {heroRoute.fromCode} to {heroRoute.toCode}
                      </h2>
                    </div>
                    <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 [animation:soft-pulse_1.8s_ease-in-out_infinite]" />
                      {isLiveLoading ? "Checking inventory" : hasSearchReadyRoute ? "Live inventory" : "Fallback preview"}
                    </span>
                  </div>

                  <div className="grid gap-4 p-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.95fr)]">
                    <div className="relative min-h-[360px] rounded-[1.5rem] border bg-muted/35 p-5">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(14,165,233,0.16),transparent_14rem)]" />
                      <div className="absolute inset-x-8 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-border to-transparent" />
                      <motion.div
                        className="absolute left-[20%] top-[48%] h-2 w-2 rounded-full bg-primary shadow-[0_0_30px_rgba(56,189,248,0.78)]"
                        animate={{ x: ["0%", "760%"], y: [0, -54, 0], opacity: [0.2, 1, 0.2] }}
                        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                      />

                      <div className="relative flex h-full flex-col justify-between gap-5">
                        <div className="flex items-start justify-between gap-4">
                          <FlightNode label="From" code={heroRoute.fromCode} city={heroRoute.fromCity} />
                          <div className="mt-8 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border bg-background text-primary shadow-lg">
                            <Plane className="h-4 w-4" />
                          </div>
                          <FlightNode label="To" code={heroRoute.toCode} city={heroRoute.toCity} align="right" />
                        </div>

                        <div className="grid gap-3">
                          {experienceMetrics.map((item) => (
                            <div key={item.label} className="rounded-2xl border bg-background/78 px-4 py-3">
                              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{item.label}</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {item.values.map((value) => (
                                  <span key={value} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                                    {value}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border bg-muted/35 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Checkout pipeline</p>
                          <p className="mt-1 text-sm text-muted-foreground">Clear from search to ticket</p>
                        </div>
                        <Route className="h-5 w-5 text-primary" />
                      </div>

                      <div className="mt-6 space-y-3">
                        {journeySteps.map((step, index) => (
                          <div key={step.label} className="group flex items-center gap-3 rounded-2xl border bg-background/78 p-3 transition hover:border-primary/35 hover:shadow-sm">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                              {index + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold">{step.label}</p>
                              <p className="truncate text-xs text-muted-foreground">{step.detail}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 rounded-2xl border bg-background/78 p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                              {heroRoute.href ? "Live fare from" : "Preview fare"}
                            </p>
                            <p className="mt-1 text-3xl font-semibold">{heroRoute.price}</p>
                          </div>
                          <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">1 traveler</span>
                        </div>
                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-primary/10">
                          <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-primary via-emerald-400 to-sky-400"
                            animate={{ x: ["-100%", "120%"] }}
                            transition={{ duration: 2.9, repeat: Infinity, ease: "easeInOut" }}
                          />
                        </div>
                        <Button onClick={handleHeroRouteClick} className="mt-4 w-full rounded-xl">
                          {heroRoute.href ? "Search this route" : "Open traveler search"}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="booking" className="scroll-mt-24 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Traveler booking"
              title="A cleaner path from route search to ticket."
              description="The traveler experience is focused on decisions that matter: route, fare, seats, extras, payment, and ticket status."
            />
            <div className="mt-12 grid gap-4 lg:grid-cols-3">
              {bookingCards.map(({ icon: Icon, title, description }, index) => (
                <motion.article
                  key={title}
                  className="group rounded-3xl border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:border-primary/45 hover:shadow-xl"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                >
                  <span className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-6 text-xl font-semibold">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
                </motion.article>
              ))}
            </div>
            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {promotions.map((promo, index) => (
                <motion.button
                  key={promo.id}
                  type="button"
                  onClick={() => navigate("/traveler")}
                  className="group rounded-3xl border bg-card p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-amber-400/60 hover:shadow-xl hover:shadow-amber-500/10"
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.4, delay: index * 0.06 }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-300">Active offer</p>
                      <h3 className="mt-3 text-xl font-semibold">{promo.title}</h3>
                    </div>
                    <span className="rounded-full bg-amber-500/10 px-3 py-1.5 font-mono text-xs font-bold text-amber-700 dark:text-amber-300">
                      {promo.code}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{promo.description}</p>
                  <div className="mt-5 flex items-center justify-between border-t pt-4">
                    <span className="text-xs font-semibold text-muted-foreground">{promo.discount}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-amber-500" />
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </section>

        <section id="workspaces" className="scroll-mt-24 bg-muted/45 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Workspaces"
              title="One platform, three focused experiences."
              description="Each role lands in a workspace shaped for its job instead of sharing a generic admin shell."
            />
            <div className="mt-12 grid gap-4 lg:grid-cols-3">
              {workspaceCards.map(({ icon: Icon, title, metric, detail }, index) => (
                <motion.article
                  key={title}
                  className="rounded-3xl border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                  initial={{ opacity: 0, scale: 0.96 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.42, delay: index * 0.06 }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="rounded-2xl bg-primary/10 p-3 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">{metric}</span>
                  </div>
                  <h3 className="mt-7 text-2xl font-semibold">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{detail}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section id="analytics" className="scroll-mt-24 py-20 sm:py-28">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
            <SectionHeader
              eyebrow="Analytics"
              title="Operational insight without leaving the product."
              description="Route, airport, airline, booking, revenue, and notification data are surfaced where admins already work."
            />

            <div className="rounded-[2rem] border bg-card p-4 shadow-sm">
              <div className="rounded-[1.35rem] border bg-muted/35 p-4">
                <div className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Live route signals</p>
                    <h3 className="mt-2 text-xl font-semibold">Search-ready corridors</h3>
                  </div>
                  <span className="inline-flex w-fit items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-xs font-bold text-muted-foreground">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Dynamic data
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {analyticsRows.map((row, index) => (
                    <div key={`${row.route}-${index}`} className="grid gap-3 rounded-2xl border bg-background p-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center">
                      <div className="min-w-0">
                        <p className="font-semibold">{row.route}</p>
                        <p className="text-xs text-muted-foreground">Public search availability signal</p>
                      </div>
                      <MetricPill label="Departures" value={row.bookings} />
                      <MetricPill label="Fare from" value={row.revenue} />
                      <span className={cn(
                        "w-fit rounded-full px-3 py-1 text-xs font-bold",
                        row.trend === "Search-ready"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                          : "bg-amber-500/10 text-amber-700 dark:text-amber-300",
                      )}>
                        {row.trend}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="security" className="scroll-mt-24 bg-muted/45 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
              <SectionHeader
                eyebrow="Security and readiness"
                title="Built around real production concerns."
                description="Secure access, provider-backed payments, notification delivery, rate limits, and observable service health sit behind the UI."
              />

              <div className="grid gap-4 sm:grid-cols-2">
                {platformCards.map(({ icon: Icon, title, detail }) => (
                  <article key={title} className="rounded-3xl border bg-card p-6 shadow-sm">
                    <span className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-6 text-lg font-semibold">{title}</h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{detail}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {securityItems.map((item) => (
                <div key={item} className="rounded-2xl border bg-card p-4 shadow-sm">
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                  <p className="mt-4 text-sm font-semibold leading-6">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-[2rem] border bg-card px-6 py-14 shadow-xl sm:px-12 lg:flex lg:items-center lg:justify-between lg:px-16">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-emerald-400 to-sky-400" />
              <div className="relative max-w-2xl">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Ready to move</p>
                <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Search as a traveler or enter your workspace.</h2>
                <p className="mt-4 leading-7 text-muted-foreground">
                  FlightHub keeps the public journey simple and the operational side rich enough for real business flows.
                </p>
              </div>
              <div className="relative mt-8 flex flex-col gap-3 sm:flex-row lg:mt-0">
                <Button onClick={() => navigate("/traveler")} className="h-11 rounded-full px-5">
                  Search flights
                </Button>
                <Button onClick={() => navigate("/login")} variant="outline" className="h-11 rounded-full px-5">
                  Sign in
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-muted/30">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <Link to="/" className="flex items-center gap-2 font-bold">
              <Plane className="h-4 w-4 text-primary" />
              FlightHub
            </Link>
            <p className="mt-2 text-xs text-muted-foreground">Booking, airline operations, and platform control.</p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-muted-foreground">
            <Link to="/traveler" className="hover:text-foreground">Search flights</Link>
            <Link to="/airline-onboarding" className="hover:text-foreground">Airline onboarding</Link>
            <Link to="/login" className="hover:text-foreground">Sign in</Link>
            <Link to="/register" className="hover:text-foreground">Create account</Link>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} FlightHub</p>
        </div>
      </footer>
    </div>
  )
}

const SectionHeader = ({ eyebrow, title, description }) => (
  <div className="max-w-3xl">
    <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
    <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">{title}</h2>
    <p className="mt-5 max-w-2xl leading-7 text-muted-foreground">{description}</p>
  </div>
)

const FlightNode = ({ code, city, label, align = "left" }) => (
  <div className={cn("min-w-0", align === "right" && "text-right")}>
    <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
    <p className="mt-2 truncate text-3xl font-semibold tracking-tight sm:text-4xl">{code}</p>
    <p
      className={cn(
        "mt-1.5 max-w-36 truncate text-sm leading-5 text-muted-foreground sm:max-w-44",
        align === "right" && "ml-auto",
      )}
      title={city}
    >
      {city}
    </p>
  </div>
)

const FloatingBadge = ({ icon: Icon, label, className, reverse = false }) => (
  <div
    className={cn(
      "absolute items-center gap-3 rounded-3xl border bg-background/76 px-4 py-3 text-sm font-semibold shadow-xl backdrop-blur-xl",
      reverse ? "[animation:float-panel_7s_ease-in-out_infinite_reverse]" : "[animation:float-panel_6s_ease-in-out_infinite]",
      className,
    )}
  >
    <Icon className="h-5 w-5 text-emerald-500" />
    <span>{label}</span>
  </div>
)

const MetricPill = ({ label, value }) => (
  <div className="rounded-2xl bg-muted/55 px-4 py-2">
    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
    <p className="mt-1 text-sm font-semibold">{value}</p>
  </div>
)

export default LandingPage
