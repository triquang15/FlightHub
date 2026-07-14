import * as React from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { useDispatch, useSelector } from "react-redux"
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Check,
  ChevronRight,
  CreditCard,
  Globe2,
  Headphones,
  Luggage,
  Plane,
  Route,
  ShieldCheck,
  Sparkles,
  Star,
  TicketPercent,
} from "lucide-react"
import FlightSearchBar from "@/pages/traveler/Home/FlightSearchBar"
import { Button } from "@/components/ui/button"
import { buildTravelerSearchParams } from "@/utils/travelerSearchParams"
import { cn } from "@/lib/utils"
import api from "@/utils/api"
import { listAllAirports } from "@/Redux/airport/airportThunk"

const quickStats = [
  { label: "Search modes", value: "3", detail: "One-way, round-trip, multi-city" },
  { label: "Checkout", value: "Secure", detail: "Stripe and PayPal ready" },
  { label: "Trip tools", value: "Live", detail: "Seats, baggage, e-ticket" },
]

const deals = [
  {
    eyebrow: "Member fare",
    title: "Save more when signed in",
    description: "Access account-aware booking, saved travelers, and faster trip management.",
    code: "MEMBER15",
    accent: "from-violet-500 to-fuchsia-400",
  },
  {
    eyebrow: "Weekend escape",
    title: "Short-haul trips made easy",
    description: "Use flexible dates and clear fare cards to compare quick getaways.",
    code: "WEEKEND",
    accent: "from-sky-500 to-cyan-400",
  },
  {
    eyebrow: "First booking",
    title: "Start with a clean checkout",
    description: "Review fare, seats, bags, payment, and ticket details before paying.",
    code: "HELLO25",
    accent: "from-emerald-500 to-teal-400",
  },
]

const formatCouponDiscount = (coupon) => {
  const value = Number(coupon?.discountValue ?? 0)
  if (!Number.isFinite(value) || value <= 0) return "Live offer"
  if (coupon?.discountType === "PERCENTAGE") return `${value}% off`
  const amount = formatMoney(value)
  return amount ? `${amount} off` : "Live offer"
}

const formatCouponValidity = (value) => {
  if (!value) return "Eligible fares"
  return `Valid until ${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value))}`
}

const createDealCard = (coupon, index = 0) => {
  if (!coupon) return deals[index % deals.length]
  const accents = ["from-violet-500 to-fuchsia-400", "from-sky-500 to-cyan-400", "from-emerald-500 to-teal-400"]
  return {
    eyebrow: "Active promo",
    title: formatCouponDiscount(coupon),
    description: coupon.description || "Use this code during checkout on eligible FlightHub fares.",
    code: coupon.code || "OFFER",
    accent: accents[index % accents.length],
    helper: formatCouponValidity(coupon.validUntil),
  }
}

const fallbackDestinations = [
  {
    city: "Singapore",
    country: "Singapore",
    tag: "Food and culture",
    price: "$89",
    routeLabel: "SGN -> SIN",
    image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80",
  },
  {
    city: "Tokyo",
    country: "Japan",
    tag: "City adventure",
    price: "$219",
    routeLabel: "SGN -> NRT",
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80",
  },
  {
    city: "Paris",
    country: "France",
    tag: "Romantic escape",
    price: "$429",
    routeLabel: "SGN -> CDG",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80",
  },
  {
    city: "Dubai",
    country: "United Arab Emirates",
    tag: "Sun and luxury",
    price: "$189",
    routeLabel: "SGN -> DXB",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
  },
]

const routeVisuals = [
  {
    match: ["SIN", "Singapore"],
    tag: "Food and culture",
    image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80",
  },
  {
    match: ["HAN", "Hanoi", "Noi Bai"],
    tag: "Capital connection",
    image: "https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=1200&q=80",
  },
  {
    match: ["HKG", "Hong Kong"],
    tag: "Skyline escape",
    image: "https://images.unsplash.com/photo-1536599018102-9f803c140fc1?auto=format&fit=crop&w=1200&q=80",
  },
  {
    match: ["KUL", "Kuala Lumpur"],
    tag: "City break",
    image: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=1200&q=80",
  },
  {
    match: ["NRT", "HND", "Tokyo"],
    tag: "City adventure",
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80",
  },
  {
    match: ["DXB", "Dubai"],
    tag: "Sun and luxury",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
  },
]

const candidatePairs = [
  ["SGN", "SIN"],
  ["SIN", "SGN"],
  ["SGN", "HAN"],
  ["HAN", "SGN"],
  ["SGN", "HKG"],
  ["KUL", "SGN"],
]

const bookingSteps = [
  { icon: Route, title: "Search", description: "Pick a route, trip type, dates, cabin, and passenger count." },
  { icon: TicketPercent, title: "Compare", description: "Review flight cards, fare options, taxes, and included services." },
  { icon: Luggage, title: "Customize", description: "Choose seats, baggage, meals, protection, and traveler details." },
  { icon: CreditCard, title: "Pay", description: "Finish with a verified provider flow and retrieve your ticket." },
]

const benefits = [
  {
    icon: TicketPercent,
    title: "Transparent fares",
    description: "Fare, taxes, fees, and selected extras stay visible before checkout.",
  },
  {
    icon: CalendarClock,
    title: "Flexible journeys",
    description: "One-way, round-trip, and multi-city searches use the same clear flow.",
  },
  {
    icon: ShieldCheck,
    title: "Protected checkout",
    description: "Authentication, payment callbacks, and ticket confirmation are handled securely.",
  },
  {
    icon: Headphones,
    title: "Trip context",
    description: "Bookings, e-tickets, seat selections, and payment status remain easy to find.",
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
}

const getAirportId = (airport) => airport?.id || airport?.airportId
const getIata = (airport) => airport?.iataCode || airport?.iata || ""
const getAirportCity = (airport) =>
  airport?.city?.name || airport?.cityName || airport?.address?.cityName || airport?.address?.city || airport?.name || "City"
const getAirportCountry = (airport) =>
  airport?.country || airport?.countryName || airport?.city?.country || airport?.address?.country || ""
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

const formatDisplayDate = (value) => {
  if (!value) return "Next available"
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value))
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

const unwrapSearchContent = (payload) => {
  const data = payload?.data?.data ?? payload?.data ?? payload
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.content)) return data.content
  if (Array.isArray(data?.results)) return data.results
  return []
}

const getFareAmount = (flight) =>
  flight?.fare?.totalPrice ?? flight?.fare?.currentPrice ?? flight?.fare?.baseFare ?? flight?.lowestFare ?? flight?.price

const getRouteVisual = (airport) => {
  const haystack = [getIata(airport), getAirportCity(airport), airport?.name, getAirportCountry(airport)]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  return routeVisuals.find((visual) =>
    visual.match.some((token) => haystack.includes(token.toLowerCase())),
  ) || fallbackDestinations[0]
}

const buildAirportCandidates = (airports = []) => {
  const byIata = new Map(
    airports
      .filter((airport) => getAirportId(airport) && getIata(airport))
      .map((airport) => [getIata(airport).toUpperCase(), airport]),
  )

  const preferred = candidatePairs
    .map(([from, to]) => ({ from: byIata.get(from), to: byIata.get(to) }))
    .filter((route) => route.from && route.to && getAirportId(route.from) !== getAirportId(route.to))

  if (preferred.length >= 4) return preferred.slice(0, 6)

  const pool = airports.filter((airport) => getAirportId(airport)).slice(0, 8)
  const generated = []
  for (let index = 0; index < pool.length - 1 && generated.length < 6; index += 1) {
    generated.push({ from: pool[index], to: pool[index + 1] })
  }

  return [...preferred, ...generated]
    .filter((route, index, list) =>
      list.findIndex((item) => getAirportId(item.from) === getAirportId(route.from) && getAirportId(item.to) === getAirportId(route.to)) === index,
    )
    .slice(0, 6)
}

const createRouteCard = ({ from, to, date, flight, fallbackIndex = 0 }) => {
  const visual = getRouteVisual(to)
  const amount = formatMoney(getFareAmount(flight), flight?.fare?.currency || "USD")
  const fromCode = getIata(from) || "FROM"
  const toCode = getIata(to) || "TO"
  const heroImage = getAirportHeroImage(to) || getAirportHeroImage(from) || visual.image

  return {
    id: `${getAirportId(from) || fromCode}-${getAirportId(to) || toCode}-${date || fallbackIndex}`,
    from,
    to,
    fromCode,
    toCode,
    routeLabel: `${fromCode} -> ${toCode}`,
    city: getAirportCity(to),
    country: getAirportCountry(to) || getAirportCity(to),
    tag: flight ? "Live search result" : visual.tag,
    price: amount || "Live fares",
    date,
    dateLabel: formatDisplayDate(date),
    flights: flight ? 1 : null,
    image: heroImage,
    imageSource: getAirportHeroImage(to) ? "airport" : "fallback",
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

const HomePage = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { airports = [], loading: airportsLoading } = useSelector((state) => state.airport)
  const searchSectionRef = React.useRef(null)
  const [dynamicRoutes, setDynamicRoutes] = React.useState([])
  const [routesLoading, setRoutesLoading] = React.useState(false)
  const [dynamicDeals, setDynamicDeals] = React.useState(deals)

  const scrollToSearch = () => {
    searchSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  const handleSearch = (searchData) => {
    const searchParams = buildTravelerSearchParams(searchData)
    navigate(`/search?${searchParams.toString()}`)
  }

  React.useEffect(() => {
    if (!airports.length && !airportsLoading) {
      dispatch(listAllAirports({ page: 0, size: 100, sortBy: "name", sortDirection: "asc" }))
    }
  }, [airports.length, airportsLoading, dispatch])

  React.useEffect(() => {
    const candidates = buildAirportCandidates(airports)
    if (!candidates.length) return

    let cancelled = false
    const probeDates = [1, 2, 3, 7, 14].map(addDays)

    const loadDynamicRoutes = async () => {
      setRoutesLoading(true)
      const cards = []

      for (const [index, candidate] of candidates.slice(0, 4).entries()) {
        let matchedCard = null

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
            const [firstFlight] = unwrapSearchContent(response)
            if (firstFlight) {
              matchedCard = createRouteCard({ ...candidate, date, flight: firstFlight, fallbackIndex: index })
              break
            }
          } catch {
            break
          }
        }

        cards.push(matchedCard || createRouteCard({ ...candidate, date: probeDates[0], fallbackIndex: index }))
      }

      if (!cancelled) {
        setDynamicRoutes(cards)
        setRoutesLoading(false)
      }
    }

    loadDynamicRoutes()

    return () => {
      cancelled = true
    }
  }, [airports])

  React.useEffect(() => {
    let cancelled = false

    const loadDeals = async () => {
      try {
        const response = await api.get("/api/coupons/public/active", { params: { limit: 3 } })
        const coupons = unwrapSearchContent(response)
        if (!cancelled) {
          setDynamicDeals(coupons.length ? coupons.slice(0, 3).map(createDealCard) : deals)
        }
      } catch {
        if (!cancelled) setDynamicDeals(deals)
      }
    }

    loadDeals()

    return () => {
      cancelled = true
    }
  }, [])

  const routeCards = dynamicRoutes.length
    ? dynamicRoutes
    : fallbackDestinations.map((destination, index) => ({
        ...destination,
        id: `fallback-${destination.city}-${index}`,
        dateLabel: "Flexible",
        imageSource: "fallback",
        href: null,
      }))

  return (
    <main className="overflow-hidden bg-background text-foreground">
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-20">
          <img
            src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=2400&q=85"
            alt=""
            className="h-full w-full object-cover opacity-42 dark:opacity-34"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.98)_0%,rgba(255,255,255,0.9)_45%,rgba(255,255,255,0.42)_100%)] dark:bg-[linear-gradient(90deg,rgba(18,9,40,0.98)_0%,rgba(18,9,40,0.88)_48%,rgba(49,46,129,0.38)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_20%,rgba(103,61,229,0.18),transparent_28rem),linear-gradient(0deg,rgb(var(--background))_0%,transparent_44%)] dark:bg-[radial-gradient(circle_at_82%_20%,rgba(103,61,229,0.36),transparent_28rem),linear-gradient(0deg,rgb(var(--background))_0%,transparent_46%)]" />
        </div>

        <div className="pointer-events-none absolute inset-0 -z-10">
          <motion.div
            className="absolute left-[7%] top-[24%] hidden h-2 w-2 rounded-full bg-primary shadow-[0_0_30px_rgba(103,61,229,0.8)] sm:block"
            animate={{ x: ["0vw", "76vw"], y: [0, -72, -18], opacity: [0.25, 1, 0.25] }}
            transition={{ duration: 9.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute right-[12%] top-[19%] flex h-12 w-12 items-center justify-center rounded-full border bg-background/65 text-primary shadow-xl backdrop-blur-xl"
            animate={{ y: [0, -18, 0], rotate: [0, 6, 0] }}
            transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <Plane className="h-5 w-5" />
          </motion.div>
        </div>

        <div className="mx-auto grid min-h-[650px] max-w-7xl items-center gap-12 px-4 pb-32 pt-16 sm:px-6 sm:pb-40 sm:pt-20 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:pb-44">
          <motion.div
            className="max-w-3xl"
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-4 py-2 text-xs font-bold shadow-sm backdrop-blur-xl">
              <Sparkles className="h-4 w-4 text-primary" />
              Search smarter. Book cleaner. Travel with context.
            </motion.div>

            <motion.h1 variants={fadeUp} className="mt-7 max-w-3xl text-4xl font-semibold leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">
              Find the flight that fits the whole trip.
            </motion.h1>

            <motion.p variants={fadeUp} className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Compare routes, fares, seats, baggage, and payment options in a traveler flow designed for confidence from search to e-ticket.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button onClick={scrollToSearch} className="h-12 rounded-full px-6">
                Search flights <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button onClick={() => navigate("/bookings")} variant="outline" className="h-12 rounded-full bg-background/65 px-6 backdrop-blur-xl">
                My bookings
              </Button>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-8 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
              {["Clear fare breakdown", "Seat selection ready", "E-ticket after payment"].map((item) => (
                <span key={item} className="flex items-center gap-2 rounded-full border bg-background/55 px-3 py-2 backdrop-blur-xl">
                  <Check className="h-4 w-4 text-emerald-500" />
                  {item}
                </span>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            className="relative hidden lg:block"
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
          >
            <div className="absolute -left-6 top-8 rounded-2xl border bg-background/72 px-4 py-3 shadow-xl backdrop-blur-xl [animation:float-panel_6s_ease-in-out_infinite]">
              <div className="flex items-center gap-3">
                <BadgeCheck className="h-5 w-5 text-emerald-500" />
                <span className="text-sm font-semibold">Secure checkout</span>
              </div>
            </div>

            <div className="relative ml-auto max-w-xl overflow-hidden rounded-[2rem] border bg-background/70 p-3 shadow-2xl shadow-primary/10 backdrop-blur-2xl">
              <div className="rounded-[1.35rem] border bg-card/90 p-5 shadow-sm backdrop-blur-xl">
                <div className="flex items-center justify-between border-b pb-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Trip preview</p>
                    <h2 className="mt-2 text-2xl font-semibold">SGN to SIN</h2>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">Live fares</span>
                </div>

                <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <AirportPreview code="SGN" city="Ho Chi Minh City" label="From" />
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border bg-background text-primary shadow-sm">
                    <Plane className="h-4 w-4" />
                  </span>
                  <AirportPreview code="SIN" city="Singapore" label="To" align="right" />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  {quickStats.map((stat) => (
                    <div key={stat.label} className="rounded-2xl border bg-muted/35 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                      <p className="mt-2 text-lg font-semibold">{stat.value}</p>
                      <p className="mt-1 text-[11px] leading-4 text-muted-foreground">{stat.detail}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-2xl border bg-muted/35 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Checkout total</p>
                      <p className="mt-2 text-3xl font-semibold">$128.00</p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">1 traveler</span>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-primary/10">
                    <div className="h-full w-2/3 rounded-full bg-primary [animation:loading-bar_2.8s_ease-in-out_infinite]" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section ref={searchSectionRef} className="relative z-10 mx-auto -mt-24 max-w-7xl px-4 sm:-mt-28 sm:px-6 lg:-mt-32 lg:px-8">
        <FlightSearchBar onSearch={handleSearch} className="shadow-2xl shadow-primary/10" />
        <div className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-3 text-xs font-semibold text-muted-foreground sm:text-sm">
          {["No hidden booking fees", "Secure payment", "Flexible fare options", "24/7 trip context"].map((item) => (
            <span key={item} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-500" />
              {item}
            </span>
          ))}
        </div>
      </section>

      <section id="deals" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <SectionHeader
          eyebrow="Smart trip cards"
          title="Useful prompts before you book"
          description="These cards guide common traveler actions and are ready to connect with promotions or recommendation data later."
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {dynamicDeals.map((deal) => (
            <article key={deal.code} className="group relative overflow-hidden rounded-3xl border bg-card p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl">
              <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", deal.accent)} />
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{deal.eyebrow}</p>
              <h3 className="mt-5 text-2xl font-semibold tracking-tight">{deal.title}</h3>
              <p className="mt-3 min-h-12 text-sm leading-6 text-muted-foreground">{deal.description}</p>
              <div className="mt-7 flex items-center justify-between border-t pt-5">
                <div className="min-w-0">
                  <span className="rounded-full bg-muted px-3 py-1.5 font-mono text-xs font-semibold">{deal.code}</span>
                  {deal.helper && <p className="mt-2 text-xs font-medium text-muted-foreground">{deal.helper}</p>}
                </div>
                <TicketPercent className="h-5 w-5 text-muted-foreground transition group-hover:text-primary" />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="destinations" className="scroll-mt-24 bg-muted/50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Trending routes"
            title="Pick a direction, then refine the search"
            description="Built from live airport data and public flight search checks. Cards fall back gracefully when a route has no current fare."
          />

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {routesLoading && !dynamicRoutes.length
              ? Array.from({ length: 4 }).map((_, index) => <RouteCardSkeleton key={index} />)
              : routeCards.slice(0, 4).map((route, index) => (
                  <TrendingRouteCard
                    key={route.id || route.city}
                    route={route}
                    index={index}
                    onClick={() => route.href ? navigate(route.href) : scrollToSearch()}
                  />
                ))}
          </div>
        </div>
      </section>

      <section id="booking-flow" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <span className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary"><Globe2 className="h-7 w-7" /></span>
            <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">A complete booking path, not just a search box.</h2>
            <p className="mt-4 max-w-lg leading-7 text-muted-foreground">
              FlightHub keeps each step visible so travelers know what is required, what is optional, and what happens after payment.
            </p>
            <Button onClick={scrollToSearch} className="mt-7 h-11 rounded-full px-5">
              Find your flight <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {bookingSteps.map(({ icon: Icon, title, description }, index) => (
              <div key={title} className="rounded-3xl border bg-card p-6 transition hover:-translate-y-1 hover:shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary"><Icon className="h-5 w-5" /></div>
                  <span className="text-xs font-bold text-muted-foreground">0{index + 1}</span>
                </div>
                <h3 className="mt-5 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 sm:pb-28 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-3xl border bg-card p-6 transition hover:-translate-y-1 hover:shadow-xl">
              <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary"><Icon className="h-5 w-5" /></div>
              <h3 className="mt-5 font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 sm:pb-28 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] border bg-card px-6 py-14 shadow-xl sm:px-12 lg:flex lg:items-center lg:justify-between lg:px-16">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-emerald-400 to-sky-400" />
          <div className="relative max-w-2xl">
            <div className="flex items-center gap-1 text-amber-500" aria-label="Rated five stars">
              {Array.from({ length: 5 }).map((_, index) => <Star key={index} className="h-4 w-4 fill-current" />)}
            </div>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">Ready to choose your next route?</h2>
            <p className="mt-4 text-muted-foreground">Start with a clean search, then move through fare selection, seat choice, payment, and ticketing.</p>
          </div>
          <Button onClick={scrollToSearch} className="relative mt-8 h-12 rounded-full px-6 lg:mt-0">
            Start searching <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </section>
    </main>
  )
}

const SectionHeader = ({ eyebrow, title, description }) => (
  <div className="max-w-2xl">
    <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
    <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
    <p className="mt-3 leading-7 text-muted-foreground">{description}</p>
  </div>
)

const AirportPreview = ({ code, city, label, align = "left" }) => (
  <div className={cn("rounded-2xl border bg-muted/35 p-4", align === "right" && "text-right")}>
    <p className="text-xs font-medium text-muted-foreground">{label}</p>
    <p className="mt-2 text-3xl font-bold">{code}</p>
    <p className="truncate text-xs text-muted-foreground">{city}</p>
  </div>
)

const RouteCardSkeleton = () => (
  <div className="min-h-96 animate-pulse overflow-hidden rounded-3xl border bg-card">
    <div className="h-52 bg-muted" />
    <div className="space-y-4 p-5">
      <div className="h-4 w-24 rounded-full bg-muted" />
      <div className="h-7 w-36 rounded-lg bg-muted" />
      <div className="h-4 w-full rounded-full bg-muted" />
      <div className="h-10 w-full rounded-xl bg-muted" />
    </div>
  </div>
)

const TrendingRouteCard = ({ route, index, onClick }) => (
  <motion.button
    type="button"
    onClick={onClick}
    className="group relative min-h-96 overflow-hidden rounded-3xl text-left shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
    aria-label={`Search ${route.routeLabel || route.city}`}
    initial={{ opacity: 0, y: 18 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.42, delay: index * 0.06 }}
  >
    <img
      src={route.image}
      alt=""
      loading="lazy"
      className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/32 to-black/5" />

    <div className="absolute left-5 right-5 top-5">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
          {route.imageSource === "airport" ? "Airport image" : route.tag}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-bold text-emerald-100 backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 [animation:soft-pulse_1.8s_ease-in-out_infinite]" />
          {route.href ? "Search-ready" : "Explore"}
        </span>
      </div>
    </div>

    <div className="absolute inset-x-6 top-1/2 h-px bg-white/35">
      <motion.span
        className="absolute -top-2 left-0 flex h-5 w-5 items-center justify-center rounded-full bg-white text-primary shadow-lg"
        animate={{ x: ["0rem", "14rem"] }}
        transition={{ duration: 6 + index, repeat: Infinity, ease: "easeInOut" }}
      >
        <Plane className="h-3 w-3" />
      </motion.span>
    </div>

    <div className="absolute inset-x-0 bottom-0 p-5 text-white">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/65">{route.routeLabel}</p>
      <h3 className="mt-3 truncate text-2xl font-semibold">{route.city}</h3>
      <p className="mt-1 truncate text-sm text-white/70">{route.country}</p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white/12 p-3 backdrop-blur-md">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/55">From</p>
          <p className="mt-1 text-lg font-semibold">{route.price}</p>
        </div>
        <div className="rounded-2xl bg-white/12 p-3 backdrop-blur-md">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/55">Depart</p>
          <p className="mt-1 text-lg font-semibold">{route.dateLabel}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-slate-950 transition group-hover:translate-y-[-2px]">
        <span className="text-sm font-bold">{route.href ? "Search this route" : "Refine search"}</span>
        <ChevronRight className="h-4 w-4" />
      </div>
    </div>
  </motion.button>
)

export default HomePage
