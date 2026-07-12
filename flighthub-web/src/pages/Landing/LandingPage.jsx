import * as React from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  Activity,
  ArrowRight,
  BarChart3,
  CalendarClock,
  Check,
  ChevronRight,
  Gauge,
  Globe2,
  LockKeyhole,
  Menu,
  Plane,
  Radar,
  Search,
  ShieldCheck,
  TicketCheck,
  Users,
  X,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navigationItems = [
  { label: "Travelers", href: "#traveler" },
  { label: "Airline ops", href: "#airline-ops" },
  { label: "Platform", href: "#platform-control" },
  { label: "Trust", href: "#trust" },
]

const platformMetrics = [
  { label: "Routes indexed", value: "128", trend: "+18%" },
  { label: "Booking flow", value: "Live", trend: "Healthy" },
  { label: "Payment rails", value: "2", trend: "Stripe + PayPal" },
]

const travelerFeatures = [
  { icon: Search, title: "Smart search", description: "One-way, round-trip, cabin, passenger, and route context stay readable before checkout." },
  { icon: TicketCheck, title: "Clear checkout", description: "Fare, baggage, seats, protection, and payment are handled in one guided booking review." },
  { icon: CalendarClock, title: "Manage trips", description: "Confirmed bookings, e-ticket views, and payment status stay accessible after purchase." },
]

const airlineModules = [
  "Aircraft, cabin, and seat map setup",
  "Flight schedules, instances, and inventory",
  "Fares, rules, baggage policies, meals, ancillaries",
  "Booking operations and performance analytics",
]

const controlModules = [
  { icon: Users, title: "Identity and access", description: "Role-aware flows for traveler, airline owner, and system administrator accounts." },
  { icon: BarChart3, title: "Performance analytics", description: "Route, airline, airport, notification, and platform health views for operations." },
  { icon: Activity, title: "Observability hub", description: "Prometheus, Grafana, Loki, Alertmanager, Kibana, and Elasticsearch links in one control surface." },
]

const trustItems = [
  { icon: LockKeyhole, title: "Secure access", description: "Token restore, gateway logout, role guards, and rate limits protect workspace entry." },
  { icon: ShieldCheck, title: "Operational boundaries", description: "Airline and platform workflows stay separated so teams only touch what they own." },
  { icon: Zap, title: "Event-ready system", description: "Booking and security events are prepared for notification and audit workflows." },
]

const timelineItems = [
  { label: "Search", detail: "Find availability" },
  { label: "Select", detail: "Choose fare and seats" },
  { label: "Pay", detail: "Verify provider callback" },
  { label: "Ticket", detail: "Issue and manage" },
]

const LandingPage = () => {
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/88 backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-2.5" aria-label="FlightHub home">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/20 transition duration-300 hover:scale-105">
              <Plane className="h-5 w-5" />
            </span>
            <span className="truncate text-lg font-bold">FlightHub</span>
          </Link>

          <nav className="hidden items-center gap-2 rounded-full border border-border/70 bg-muted/35 p-1 md:flex" aria-label="Main navigation">
            {navigationItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="group relative rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-background hover:text-foreground"
              >
                {item.label}
                <span className="absolute inset-x-4 -bottom-1 h-0.5 origin-left scale-x-0 rounded-full bg-primary transition-transform duration-300 group-hover:scale-x-100" />
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Button variant="ghost" onClick={() => navigate("/login")} className="rounded-full px-4">Sign in</Button>
            <Button onClick={() => navigate("/traveler")} className="group relative overflow-hidden rounded-full px-5 shadow-lg shadow-primary/20">
              <span className="absolute inset-y-0 -left-8 w-8 rotate-12 bg-white/25 blur-sm transition-all duration-700 group-hover:left-full" />
              Book now <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            aria-label={isMobileMenuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {isMobileMenuOpen && (
          <div className="border-t border-border/70 bg-background px-4 py-4 md:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col gap-1" aria-label="Mobile navigation">
              {navigationItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className="rounded-xl px-3 py-3 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  {item.label}
                </a>
              ))}
              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-4">
                <Button variant="outline" onClick={() => navigate("/login")}>Sign in</Button>
                <Button onClick={() => navigate("/traveler")}>Book now</Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main>
        <section className="relative isolate overflow-hidden bg-slate-950 text-white">
          <div className="absolute inset-0 -z-20">
            <img
              src="https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?auto=format&fit=crop&w=2400&q=85"
              alt=""
              className="h-full w-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.98),rgba(15,23,42,0.92),rgba(76,29,149,0.55))]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_24%,rgba(103,61,229,0.5),transparent_28%),linear-gradient(0deg,rgba(2,6,23,1),transparent_44%)]" />
          </div>

          <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-20">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold text-slate-100 backdrop-blur-md">
                <Radar className="h-4 w-4 text-violet-200" />
                Flight booking, airline operations, and platform control
              </div>
              <h1 className="mt-7 text-4xl font-semibold leading-[1.04] sm:text-6xl lg:text-7xl">
                Run the journey from search to ticketing.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                FlightHub connects traveler search, secure checkout, airline inventory, booking operations, and platform observability in one business-ready experience.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button onClick={() => navigate("/traveler")} className="h-12 rounded-full bg-white px-6 text-slate-950 hover:bg-slate-100">
                  Start searching <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button onClick={() => navigate("/airline-onboarding")} variant="outline" className="h-12 rounded-full border-white/25 bg-white/5 px-6 text-white hover:bg-white/10 hover:text-white">
                  Airline onboarding
                </Button>
              </div>

              <div className="mt-8 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
                {["Round-trip ready", "Seat and fare flow", "Observability enabled"].map((item) => (
                  <span key={item} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-300" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-2xl lg:max-w-none">
              <div className="absolute -left-8 top-10 hidden h-20 w-20 rounded-3xl border border-white/10 bg-white/10 backdrop-blur-md [animation:float-panel_6s_ease-in-out_infinite] lg:block" />
              <div className="absolute -right-4 bottom-24 hidden h-16 w-16 rounded-full border border-violet-300/30 bg-violet-400/20 backdrop-blur-md [animation:float-panel_7s_ease-in-out_infinite_reverse] lg:block" />

              <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 p-3 shadow-2xl backdrop-blur-xl [animation:panel-rise_700ms_ease-out_both]">
                <div className="rounded-[1.35rem] border border-white/10 bg-slate-950/88 p-5">
                  <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase text-violet-200">Live journey console</p>
                      <h2 className="mt-2 text-2xl font-semibold">SGN to SIN</h2>
                    </div>
                    <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-200">
                      <span className="h-2 w-2 rounded-full bg-emerald-300 [animation:soft-pulse_1.8s_ease-in-out_infinite]" />
                      Ready to book
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                    <AirportTile code="SGN" city="Ho Chi Minh City" label="Departure" />
                    <div className="hidden h-px bg-white/15 sm:block" />
                    <AirportTile code="SIN" city="Singapore" label="Arrival" align="right" />
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {platformMetrics.map((metric) => (
                      <div key={metric.label} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                        <p className="text-xs text-slate-400">{metric.label}</p>
                        <p className="mt-2 text-2xl font-semibold">{metric.value}</p>
                        <p className="mt-1 text-xs text-violet-200">{metric.trend}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase text-slate-400">Booking pipeline</p>
                        <p className="mt-1 text-sm text-slate-300">From availability to e-ticket</p>
                      </div>
                      <Gauge className="h-5 w-5 text-violet-200" />
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-4">
                      {timelineItems.map((item, index) => (
                        <div key={item.label} className="relative rounded-xl bg-slate-900 p-3">
                          {index < timelineItems.length - 1 && <span className="absolute left-[calc(100%-0.4rem)] top-1/2 hidden h-px w-5 bg-violet-300/40 sm:block" />}
                          <p className="text-xs font-bold text-white">{item.label}</p>
                          <p className="mt-1 text-[11px] text-slate-400">{item.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="traveler" className="scroll-mt-24 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionIntro
              eyebrow="Traveler experience"
              title="A booking flow that stays understandable."
              description="The traveler side should not feel like a maze. Search, compare, select fares, choose seats, pay, and retrieve tickets with clear context at every step."
            />
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {travelerFeatures.map(({ icon: Icon, title, description }) => (
                <article key={title} className="group rounded-3xl border bg-card p-6 transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
                  <span className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="airline-ops" className="scroll-mt-24 bg-muted/45 py-20 sm:py-28">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
            <div>
              <SectionIntro
                eyebrow="Airline operations"
                title="Manage the commercial engine behind each flight."
                description="Airline owners need clean operational tools, not scattered forms. FlightHub keeps fleet, inventory, fares, and booking work in one role-aware workspace."
              />
              <Button onClick={() => navigate("/airline-onboarding")} className="mt-8 h-11 rounded-full px-5">
                Start airline onboarding <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="rounded-[2rem] border bg-card p-5 shadow-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                {airlineModules.map((item, index) => (
                  <div key={item} className="rounded-2xl border bg-background p-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {index + 1}
                    </span>
                    <p className="mt-5 text-sm font-semibold leading-6">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="platform-control" className="scroll-mt-24 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionIntro
              eyebrow="Platform control"
              title="Super admin views for the full system."
              description="The platform layer focuses on users, airlines, routes, airports, notifications, service health, and observability. No duplicate menu noise, just clear control surfaces."
            />
            <div className="mt-12 grid gap-4 lg:grid-cols-3">
              {controlModules.map(({ icon: Icon, title, description }) => (
                <article key={title} className="rounded-3xl border bg-card p-6">
                  <Icon className="h-6 w-6 text-primary" />
                  <h3 className="mt-6 text-lg font-semibold">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="trust" className="scroll-mt-24 bg-slate-950 py-20 text-white sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionIntro
              eyebrow="Trust and readiness"
              title="Designed for real operating conditions."
              description="Production readiness comes from predictable access, clear ownership, resilient event handling, and observable services."
              dark
            />
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {trustItems.map(({ icon: Icon, title, description }) => (
                <article key={title} className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
                  <Icon className="h-6 w-6 text-violet-200" />
                  <h3 className="mt-6 text-lg font-semibold">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-[2rem] bg-primary px-6 py-14 text-primary-foreground sm:px-12 lg:flex lg:items-center lg:justify-between lg:px-16">
              <div className="absolute right-8 top-8 h-20 w-20 rounded-3xl bg-white/10 [animation:float-panel_6s_ease-in-out_infinite]" />
              <div className="relative max-w-2xl">
                <p className="text-sm font-bold uppercase text-primary-foreground/75">Ready when you are</p>
                <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Search a flight or onboard an airline.</h2>
                <p className="mt-4 text-primary-foreground/80">The main page now keeps the menu focused on what matters: traveler booking, airline operations, platform control, and trust.</p>
              </div>
              <div className="relative mt-8 flex flex-col gap-3 sm:flex-row lg:mt-0">
                <Button onClick={() => navigate("/traveler")} className="h-11 rounded-full bg-white px-5 text-slate-950 hover:bg-slate-100">Search flights</Button>
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
            <Link to="/" className="flex items-center gap-2 font-bold"><Plane className="h-4 w-4 text-primary" />FlightHub</Link>
            <p className="mt-2 text-xs text-muted-foreground">Connected booking, airline operations, and platform control.</p>
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

const SectionIntro = ({ eyebrow, title, description, dark = false }) => (
  <div className="max-w-3xl">
    <p className={cn("text-sm font-bold uppercase", dark ? "text-violet-200" : "text-primary")}>{eyebrow}</p>
    <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-5xl">{title}</h2>
    <p className={cn("mt-5 max-w-2xl leading-7", dark ? "text-slate-300" : "text-muted-foreground")}>{description}</p>
  </div>
)

const AirportTile = ({ code, city, label, align = "left" }) => (
  <div className={cn("rounded-2xl border border-white/10 bg-white/[0.06] p-4", align === "right" && "sm:text-right")}>
    <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
    <p className="mt-2 text-4xl font-semibold">{code}</p>
    <p className="mt-1 text-sm text-slate-400">{city}</p>
  </div>
)

export default LandingPage
