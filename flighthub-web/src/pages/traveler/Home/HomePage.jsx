import * as React from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Check,
  ChevronRight,
  Globe2,
  Headphones,
  ShieldCheck,
  Sparkles,
  Star,
  TicketPercent,
} from "lucide-react"
import FlightSearchBar from "@/pages/traveler/Home/FlightSearchBar"
import { Button } from "@/components/ui/button"
import { buildTravelerSearchParams } from "@/utils/travelerSearchParams"

// Placeholder content until the offers and destination APIs are available.
const deals = [
  {
    eyebrow: "Member fare",
    title: "Save up to 15% on your next escape",
    description: "Sign in before searching to unlock selected member-only fares.",
    code: "MEMBER15",
    accent: "from-violet-600 to-indigo-500",
  },
  {
    eyebrow: "Weekend deal",
    title: "Short-haul flights from $49",
    description: "Make the most of your weekend with flexible nearby getaways.",
    code: "WEEKEND",
    accent: "from-sky-600 to-cyan-500",
  },
  {
    eyebrow: "New traveler",
    title: "$25 off your first booking",
    description: "A little head start for your first journey with FlightHub.",
    code: "HELLO25",
    accent: "from-orange-500 to-rose-500",
  },
]

const destinations = [
  {
    city: "Singapore",
    country: "Singapore",
    tag: "Food & culture",
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
    tag: "Sun & luxury",
    price: "$189",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
  },
]

const benefits = [
  {
    icon: TicketPercent,
    title: "Fares worth flying for",
    description: "Compare clear, competitive fares without hidden surprises.",
  },
  {
    icon: CalendarClock,
    title: "Flexible by design",
    description: "Find travel options that work around your plans.",
  },
  {
    icon: ShieldCheck,
    title: "Secure from search to seat",
    description: "Your booking and payment details stay protected.",
  },
  {
    icon: Headphones,
    title: "Support when it matters",
    description: "Get friendly help throughout your entire journey.",
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
    <main className="overflow-hidden bg-background">
      <section className="relative isolate bg-slate-950 pb-32 pt-16 text-white sm:pb-40 sm:pt-24 lg:pb-44 lg:pt-28">
        <div className="absolute inset-0 -z-20">
          <img
            src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=2200&q=85"
            alt=""
            className="h-full w-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-indigo-950/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
        </div>

        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_0.72fr] lg:items-end lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-md">
              <Sparkles className="h-4 w-4 text-amber-300" />
              Smarter journeys start here
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
              The world is closer than you think.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              Compare flights, discover flexible fares, and book your next trip with confidence.
            </p>
          </div>

          <div className="hidden justify-self-end rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-md lg:block">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-400/15 p-3">
                <BadgeCheck className="h-6 w-6 text-emerald-300" />
              </div>
              <div>
                <p className="font-semibold">Book with confidence</p>
                <p className="mt-1 text-sm text-slate-300">Secure checkout and clear fare details</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section ref={searchSectionRef} className="relative z-10 mx-auto -mt-20 max-w-7xl px-4 sm:-mt-24 sm:px-6 lg:-mt-28 lg:px-8">
        <FlightSearchBar onSearch={handleSearch} />
        <div className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-3 text-xs font-medium text-muted-foreground sm:text-sm">
          {["No hidden booking fees", "Secure payment", "Flexible fare options", "24/7 assistance"].map((item) => (
            <span key={item} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-500" />
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Limited-time offers</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">A better trip for less</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">Placeholder offers ready to connect to the promotions service.</p>
          </div>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {deals.map((deal) => (
            <article key={deal.code} className="group relative overflow-hidden rounded-3xl border bg-card p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${deal.accent}`} />
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

      <section className="bg-muted/50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Trending now</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Go somewhere unforgettable</h2>
            <p className="mt-3 text-muted-foreground">Popular destinations based on placeholder editorial data.</p>
          </div>

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
                  <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-md">{destination.tag}</span>
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

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <span className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary"><Globe2 className="h-7 w-7" /></span>
            <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">Built around the way you travel</h2>
            <p className="mt-4 max-w-lg leading-7 text-muted-foreground">
              From comparing routes to managing your booking, every step is designed to feel clear, fast, and dependable.
            </p>
            <Button onClick={scrollToSearch} className="mt-7 h-11 rounded-full px-5">
              Find your flight <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {benefits.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-3xl border bg-card p-6">
                <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary"><Icon className="h-5 w-5" /></div>
                <h3 className="mt-5 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 sm:pb-28 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-14 text-white sm:px-12 lg:flex lg:items-center lg:justify-between lg:px-16">
          <div className="absolute -right-20 -top-32 h-80 w-80 rounded-full bg-primary/40 blur-3xl" />
          <div className="relative max-w-2xl">
            <div className="flex items-center gap-1 text-amber-300" aria-label="Rated five stars">
              {[...Array(5)].map((_, index) => <Star key={index} className="h-4 w-4 fill-current" />)}
            </div>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">Your next story starts with a flight.</h2>
            <p className="mt-4 text-slate-300">Search hundreds of routes and find the one that feels right.</p>
          </div>
          <Button onClick={scrollToSearch} className="relative mt-8 h-12 rounded-full bg-white px-6 text-slate-950 hover:bg-slate-100 lg:mt-0">
            Start searching <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </section>
    </main>
  )
}

export default HomePage
