import * as React from "react"
import { useNavigate } from "react-router-dom"
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
    accent: "bg-violet-600",
  },
  {
    eyebrow: "Weekend escape",
    title: "Short-haul trips made easy",
    description: "Use flexible dates and clear fare cards to compare quick getaways.",
    code: "WEEKEND",
    accent: "bg-sky-600",
  },
  {
    eyebrow: "First booking",
    title: "Start with a clean checkout",
    description: "Review fare, seats, bags, payment, and ticket details before paying.",
    code: "HELLO25",
    accent: "bg-emerald-600",
  },
]

const destinations = [
  {
    city: "Singapore",
    country: "Singapore",
    tag: "Food and culture",
    price: "$89",
    image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80",
  },
  {
    city: "Tokyo",
    country: "Japan",
    tag: "City adventure",
    price: "$219",
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80",
  },
  {
    city: "Paris",
    country: "France",
    tag: "Romantic escape",
    price: "$429",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80",
  },
  {
    city: "Dubai",
    country: "United Arab Emirates",
    tag: "Sun and luxury",
    price: "$189",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
  },
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

const HomePage = () => {
  const navigate = useNavigate()
  const searchSectionRef = React.useRef(null)

  const scrollToSearch = () => {
    searchSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  const handleSearch = (searchData) => {
    const searchParams = buildTravelerSearchParams(searchData)
    navigate(`/search?${searchParams.toString()}`)
  }

  return (
    <main className="overflow-hidden">
      <section className="relative isolate bg-slate-950 text-white">
        <div className="absolute inset-0 -z-20">
          <img
            src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=2400&q=85"
            alt=""
            className="h-full w-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.98),rgba(15,23,42,0.88),rgba(88,28,135,0.45))]" />
          <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(2,6,23,1),transparent_42%)]" />
        </div>

        <div className="mx-auto grid min-h-[610px] max-w-7xl items-center gap-12 px-4 pb-32 pt-16 sm:px-6 sm:pb-40 sm:pt-20 lg:grid-cols-[0.94fr_1.06fr] lg:px-8 lg:pb-44">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold text-white/90 backdrop-blur-md">
              <Sparkles className="h-4 w-4 text-amber-300" />
              Search smarter. Book cleaner. Travel with context.
            </div>
            <h1 className="mt-7 max-w-3xl text-4xl font-semibold leading-[1.04] sm:text-6xl lg:text-7xl">
              Find the flight that fits the whole trip.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Compare routes, fares, seats, baggage, and payment options in a traveler flow designed for confidence from search to e-ticket.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button onClick={scrollToSearch} className="h-12 rounded-full bg-white px-6 text-slate-950 hover:bg-slate-100">
                Search flights <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button onClick={() => navigate("/bookings")} variant="outline" className="h-12 rounded-full border-white/25 bg-white/5 px-6 text-white hover:bg-white/10 hover:text-white">
                My bookings
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-300">
              {["Clear fare breakdown", "Seat selection ready", "E-ticket after payment"].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-300" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute -left-6 top-8 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-md [animation:float-panel_6s_ease-in-out_infinite]">
              <div className="flex items-center gap-3">
                <BadgeCheck className="h-5 w-5 text-emerald-300" />
                <span className="text-sm font-semibold">Secure checkout</span>
              </div>
            </div>
            <div className="relative ml-auto max-w-xl overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 p-3 shadow-2xl backdrop-blur-xl [animation:panel-rise_700ms_ease-out_both]">
              <div className="rounded-[1.35rem] bg-white p-5 text-slate-950">
                <div className="flex items-center justify-between border-b pb-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600">Trip preview</p>
                    <h2 className="mt-2 text-2xl font-semibold">SGN to SIN</h2>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">Live fares</span>
                </div>

                <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <AirportPreview code="SGN" city="Ho Chi Minh City" label="From" />
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                    <Plane className="h-4 w-4" />
                  </span>
                  <AirportPreview code="SIN" city="Singapore" label="To" align="right" />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  {quickStats.map((stat) => (
                    <div key={stat.label} className="rounded-2xl border bg-slate-50 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{stat.label}</p>
                      <p className="mt-2 text-lg font-semibold">{stat.value}</p>
                      <p className="mt-1 text-[11px] leading-4 text-slate-500">{stat.detail}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-2xl bg-slate-950 p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Checkout total</p>
                      <p className="mt-2 text-3xl font-semibold">$128.00</p>
                    </div>
                    <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-violet-100">1 traveler</span>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-2/3 rounded-full bg-violet-400 [animation:loading-bar_2.8s_ease-in-out_infinite]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section ref={searchSectionRef} className="relative z-10 mx-auto -mt-24 max-w-7xl px-4 sm:-mt-28 sm:px-6 lg:-mt-32 lg:px-8">
        <FlightSearchBar onSearch={handleSearch} className="border-white/20 shadow-2xl shadow-slate-950/20" />
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
          {deals.map((deal) => (
            <article key={deal.code} className="group relative overflow-hidden rounded-3xl border bg-card p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl">
              <div className={cn("absolute inset-x-0 top-0 h-1", deal.accent)} />
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{deal.eyebrow}</p>
              <h3 className="mt-5 text-2xl font-semibold tracking-tight">{deal.title}</h3>
              <p className="mt-3 min-h-12 text-sm leading-6 text-muted-foreground">{deal.description}</p>
              <div className="mt-7 flex items-center justify-between border-t pt-5">
                <span className="rounded-full bg-muted px-3 py-1.5 font-mono text-xs font-semibold">{deal.code}</span>
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
            description="Destination cards are visual entry points. The search panel remains the source of truth for live data."
          />

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {destinations.map((destination) => (
              <button
                key={destination.city}
                type="button"
                onClick={scrollToSearch}
                className="group relative min-h-96 overflow-hidden rounded-3xl text-left shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
                aria-label={`Search flights to ${destination.city}`}
              >
                <img src={destination.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-md">{destination.tag}</span>
                  <h3 className="mt-3 text-2xl font-semibold">{destination.city}</h3>
                  <div className="mt-1 flex items-center justify-between text-sm text-white/75">
                    <span>{destination.country}</span>
                    <span>From <strong className="text-white">{destination.price}</strong></span>
                  </div>
                </div>
              </button>
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
              <div key={title} className="rounded-3xl border bg-card p-6">
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
            <div key={title} className="rounded-3xl border bg-card p-6">
              <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary"><Icon className="h-5 w-5" /></div>
              <h3 className="mt-5 font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 sm:pb-28 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-14 text-white sm:px-12 lg:flex lg:items-center lg:justify-between lg:px-16">
          <div className="relative max-w-2xl">
            <div className="flex items-center gap-1 text-amber-300" aria-label="Rated five stars">
              {Array.from({ length: 5 }).map((_, index) => <Star key={index} className="h-4 w-4 fill-current" />)}
            </div>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">Ready to choose your next route?</h2>
            <p className="mt-4 text-slate-300">Start with a clean search, then move through fare selection, seat choice, payment, and ticketing.</p>
          </div>
          <Button onClick={scrollToSearch} className="relative mt-8 h-12 rounded-full bg-white px-6 text-slate-950 hover:bg-slate-100 lg:mt-0">
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
  <div className={cn("rounded-2xl bg-slate-50 p-4", align === "right" && "text-right")}>
    <p className="text-xs font-medium text-slate-500">{label}</p>
    <p className="mt-2 text-3xl font-bold">{code}</p>
    <p className="text-xs text-slate-500">{city}</p>
  </div>
)

export default HomePage
