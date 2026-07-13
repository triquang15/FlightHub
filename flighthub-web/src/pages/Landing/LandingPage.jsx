import * as React from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  Activity,
  ArrowRight,
  BarChart3,
  BellRing,
  Check,
  CircleDollarSign,
  Clock3,
  Gauge,
  Menu,
  Plane,
  Radar,
  Route,
  Search,
  ShieldCheck,
  TicketCheck,
  Users,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Booking", href: "#booking" },
  { label: "Airlines", href: "#airlines" },
  { label: "Platform", href: "#platform" },
  { label: "Security", href: "#security" },
]

const heroStats = [
  { label: "Search modes", value: "3", detail: "One-way, round-trip, multi-city" },
  { label: "Payments", value: "2", detail: "Stripe and PayPal" },
  { label: "Ops views", value: "Live", detail: "Airline and platform dashboards" },
]

const bookingCards = [
  {
    icon: Search,
    title: "Search with context",
    description: "Routes, dates, travelers, cabins, and trip type stay readable before the user reaches results.",
  },
  {
    icon: TicketCheck,
    title: "Choose a fare",
    description: "Fare families, taxes, seats, baggage, meals, and protection are shown before payment.",
  },
  {
    icon: CircleDollarSign,
    title: "Checkout cleanly",
    description: "Provider callbacks, ticket status, booking history, and e-ticket views complete the journey.",
  },
]

const airlineCards = [
  { label: "Fleet", value: "Aircraft, cabin classes, seat maps" },
  { label: "Inventory", value: "Schedules, flight instances, seat availability" },
  { label: "Commerce", value: "Fares, coupons, baggage, meals, ancillaries" },
  { label: "Operations", value: "Bookings, customer operations, route insights" },
]

const platformCards = [
  { icon: Users, title: "Identity", metric: "Role aware", detail: "Traveler, airline owner, and system admin flows." },
  { icon: BarChart3, title: "Analytics", metric: "Dynamic", detail: "Routes, airports, airlines, revenue, bookings." },
  { icon: BellRing, title: "Notifications", metric: "Event ready", detail: "Delivery, event logs, and notification operations." },
  { icon: Activity, title: "Observability", metric: "Integrated", detail: "Grafana, Prometheus, Loki, Kibana, Elasticsearch." },
]

const securityItems = [
  "Gateway logout and token restore",
  "Redis rate limiting and role guards",
  "Payment verification and provider callbacks",
  "Notification DLQ and operational logs",
]

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

const LandingPage = () => {
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = React.useState(false)

  const closeMobile = () => setMobileOpen(false)

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-slate-950/72 text-white backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-3" aria-label="FlightHub home">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-primary shadow-lg shadow-primary/25">
              <Plane className="h-5 w-5" />
            </span>
            <span className="truncate text-lg font-bold tracking-tight">FlightHub</span>
          </Link>

          <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/8 p-1 md:flex" aria-label="Landing navigation">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-full px-4 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Button variant="ghost" onClick={() => navigate("/login")} className="rounded-full text-white hover:bg-white/10 hover:text-white">
              Sign in
            </Button>
            <Button onClick={() => navigate("/traveler")} className="rounded-full bg-white px-5 text-slate-950 hover:bg-slate-100">
              Search flights <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 hover:text-white md:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {mobileOpen && (
          <div className="border-t border-white/10 bg-slate-950 px-4 py-4 md:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col gap-1" aria-label="Mobile landing navigation">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={closeMobile}
                  className="rounded-2xl px-3 py-3 text-sm font-semibold text-white/72 hover:bg-white/10 hover:text-white"
                >
                  {item.label}
                </a>
              ))}
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-4">
                <Button variant="outline" onClick={() => navigate("/login")} className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white">
                  Sign in
                </Button>
                <Button onClick={() => navigate("/traveler")} className="bg-white text-slate-950 hover:bg-slate-100">
                  Search
                </Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main>
        <section className="relative isolate min-h-screen overflow-hidden bg-slate-950 pt-16 text-white">
          <div className="absolute inset-0 -z-20">
            <img
              src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=2600&q=85"
              alt=""
              className="h-full w-full object-cover opacity-34"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.99)_0%,rgba(15,23,42,0.9)_48%,rgba(76,29,149,0.55)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_20%,rgba(124,58,237,0.48),transparent_28%),linear-gradient(0deg,rgba(2,6,23,1),transparent_48%)]" />
          </div>

          <div className="pointer-events-none absolute inset-0 -z-10 opacity-40">
            <div className="absolute left-1/2 top-28 h-px w-[44rem] -translate-x-1/2 rotate-[-14deg] bg-gradient-to-r from-transparent via-white to-transparent" />
            <motion.div
              className="absolute left-[14%] top-[34%] flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md"
              animate={{ x: ["0vw", "62vw"], y: [0, -92, -12], rotate: [0, 12, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            >
              <Plane className="h-4 w-4 text-white" />
            </motion.div>
          </div>

          <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[0.94fr_1.06fr] lg:px-8 lg:py-20">
            <motion.div
              className="max-w-3xl"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              transition={{ duration: 0.65, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold text-white/90 backdrop-blur-xl">
                <Radar className="h-4 w-4 text-violet-200" />
                Booking platform for travelers, airlines, and system admins
              </div>
              <h1 className="mt-7 text-4xl font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
                One flight platform from search to operations.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                FlightHub brings traveler booking, airline inventory, pricing, payments, notifications, and observability into one production-style workspace.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button onClick={() => navigate("/traveler")} className="h-12 rounded-full bg-white px-6 text-slate-950 hover:bg-slate-100">
                  Search flights <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  onClick={() => navigate("/airline-onboarding")}
                  variant="outline"
                  className="h-12 rounded-full border-white/25 bg-white/5 px-6 text-white hover:bg-white/10 hover:text-white"
                >
                  Onboard airline
                </Button>
              </div>

              <div className="mt-8 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
                {["Real booking flow", "Operational dashboards", "Observable services"].map((item) => (
                  <span key={item} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-300" />
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="relative mx-auto w-full max-w-2xl lg:max-w-none"
              initial={{ opacity: 0, y: 32, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.75, delay: 0.12, ease: "easeOut" }}
            >
              <div className="absolute -left-5 top-12 hidden rounded-3xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-xl [animation:float-panel_6s_ease-in-out_infinite] lg:block">
                <div className="flex items-center gap-3">
                  <Gauge className="h-5 w-5 text-emerald-300" />
                  <span className="text-sm font-semibold">System healthy</span>
                </div>
              </div>

              <div className="absolute -right-3 bottom-16 hidden rounded-3xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-xl [animation:float-panel_7s_ease-in-out_infinite_reverse] lg:block">
                <div className="flex items-center gap-3">
                  <Clock3 className="h-5 w-5 text-violet-200" />
                  <span className="text-sm font-semibold">Live inventory</span>
                </div>
              </div>

              <div className="overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 p-3 shadow-2xl shadow-black/30 backdrop-blur-2xl">
                <div className="rounded-[1.35rem] border border-white/10 bg-slate-950/88 p-5">
                  <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-200">Journey control</p>
                      <h2 className="mt-2 text-2xl font-semibold">SGN to SIN</h2>
                    </div>
                    <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-200">
                      <span className="h-2 w-2 rounded-full bg-emerald-300 [animation:soft-pulse_1.8s_ease-in-out_infinite]" />
                      Ready to book
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                    <AirportPanel code="SGN" city="Ho Chi Minh City" label="Departure" />
                    <div className="hidden h-px bg-white/15 sm:block" />
                    <AirportPanel code="SIN" city="Singapore" label="Arrival" align="right" />
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {heroStats.map((item) => (
                      <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                        <p className="text-xs text-slate-400">{item.label}</p>
                        <p className="mt-2 text-2xl font-semibold">{item.value}</p>
                        <p className="mt-1 text-xs text-violet-200">{item.detail}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Booking pipeline</p>
                        <p className="mt-1 text-sm text-slate-300">Search, select, pay, ticket</p>
                      </div>
                      <Route className="h-5 w-5 text-violet-200" />
                    </div>
                    <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-violet-300 via-white to-emerald-300"
                        animate={{ x: ["-100%", "120%"] }}
                        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </div>
                    <div className="mt-4 grid grid-cols-4 gap-2 text-center text-[11px] font-bold text-slate-300">
                      {["Search", "Fare", "Pay", "Ticket"].map((step) => (
                        <span key={step} className="rounded-full bg-white/[0.06] px-2 py-2">{step}</span>
                      ))}
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
          </div>
        </section>

        <section id="airlines" className="scroll-mt-24 bg-muted/45 py-20 sm:py-28">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
            <SectionHeader
              eyebrow="Airline workspace"
              title="Run inventory, commerce, and customer operations together."
              description="Airline owners get a focused workspace for aircraft setup, flight operations, fare management, customer bookings, and route performance."
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {airlineCards.map((item, index) => (
                <motion.article
                  key={item.label}
                  className="rounded-3xl border bg-card p-5 shadow-sm"
                  initial={{ opacity: 0, scale: 0.96 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.42, delay: index * 0.06 }}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {index + 1}
                  </span>
                  <h3 className="mt-5 text-lg font-semibold">{item.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.value}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section id="platform" className="scroll-mt-24 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Platform control"
              title="Super admin tools without menu noise."
              description="The platform side is organized around identity, airline registry, network data, analytics, notifications, integrations, and observability."
            />
            <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {platformCards.map(({ icon: Icon, title, metric, detail }) => (
                <article key={title} className="rounded-3xl border bg-card p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-2xl bg-primary/10 p-3 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">{metric}</span>
                  </div>
                  <h3 className="mt-6 text-lg font-semibold">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="security" className="scroll-mt-24 bg-slate-950 py-20 text-white sm:py-28">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-200">Security and readiness</p>
              <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-5xl">Built around real production concerns.</h2>
              <p className="mt-5 max-w-2xl leading-7 text-slate-300">
                The system is shaped around secure access, role boundaries, payment verification, event delivery, and observable service health.
              </p>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                {securityItems.map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                    <ShieldCheck className="h-5 w-5 text-emerald-300" />
                    <p className="mt-4 text-sm font-semibold leading-6">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-[2rem] bg-primary px-6 py-14 text-primary-foreground shadow-2xl shadow-primary/20 sm:px-12 lg:flex lg:items-center lg:justify-between lg:px-16">
              <div className="absolute right-8 top-8 hidden h-20 w-20 rounded-3xl bg-white/10 [animation:float-panel_6s_ease-in-out_infinite] sm:block" />
              <div className="relative max-w-2xl">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary-foreground/75">Ready to move</p>
                <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Start with a search or enter your workspace.</h2>
                <p className="mt-4 leading-7 text-primary-foreground/80">
                  Keep the first screen focused: travelers book, airlines operate, admins control the platform.
                </p>
              </div>
              <div className="relative mt-8 flex flex-col gap-3 sm:flex-row lg:mt-0">
                <Button onClick={() => navigate("/traveler")} className="h-11 rounded-full bg-white px-5 text-slate-950 hover:bg-slate-100">
                  Search flights
                </Button>
                <Button onClick={() => navigate("/login")} variant="outline" className="h-11 rounded-full border-white/30 bg-transparent px-5 text-white hover:bg-white/10 hover:text-white">
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

const AirportPanel = ({ code, city, label, align = "left" }) => (
  <div className={cn("rounded-2xl border border-white/10 bg-white/[0.06] p-4", align === "right" && "sm:text-right")}>
    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
    <p className="mt-2 text-4xl font-semibold">{code}</p>
    <p className="mt-1 text-sm text-slate-400">{city}</p>
  </div>
)

export default LandingPage
