import * as React from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  CircleCheck,
  Globe2,
  Headphones,
  Layers3,
  LockKeyhole,
  Menu,
  Plane,
  Search,
  ShieldCheck,
  TicketCheck,
  Users,
  X,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const capabilities = [
  {
    icon: Search,
    title: "Search that stays simple",
    description: "Compare routes, schedules, cabin classes, and fare options in one clear journey.",
  },
  {
    icon: TicketCheck,
    title: "Booking from start to finish",
    description: "Move from flight selection to secure payment and e-ticket access without friction.",
  },
  {
    icon: BarChart3,
    title: "Operations built for airlines",
    description: "Manage aircraft, schedules, fares, inventory, bookings, and performance from one workspace.",
  },
  {
    icon: Layers3,
    title: "A connected platform",
    description: "Traveler and airline experiences work together through a shared booking infrastructure.",
  },
]

const travelerSteps = [
  { title: "Find the right flight", description: "Search one-way, round-trip, or multi-city journeys." },
  { title: "Compare with confidence", description: "Review schedules, fare options, and trip details." },
  { title: "Book and manage", description: "Complete payment, access bookings, and retrieve e-tickets." },
]

const airlineSteps = [
  { title: "Complete onboarding", description: "Submit airline and owner details through a guided flow." },
  { title: "Configure operations", description: "Create aircraft, schedules, cabins, fares, and policies." },
  { title: "Distribute and monitor", description: "Publish availability and track bookings and performance." },
]

const trustItems = [
  { icon: LockKeyhole, title: "Protected transactions", description: "Authentication and payment flows are designed around secure handling of customer data." },
  { icon: ShieldCheck, title: "Role-based access", description: "Traveler, airline, and system administration experiences remain clearly separated." },
  { icon: Zap, title: "Real-time workflows", description: "Availability, fares, and operational changes flow through the platform as they happen." },
  { icon: Headphones, title: "Operational clarity", description: "Focused dashboards and booking records help teams respond with context." },
]

const LandingPage = () => {
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5" aria-label="FlightHub home">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Plane className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold tracking-tight">FlightHub</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
            <a href="#platform" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">Platform</a>
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">How it works</a>
            <a href="#airlines" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">For airlines</a>
            <a href="#security" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">Security</a>
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Button variant="ghost" onClick={() => navigate("/login")}>Sign in</Button>
            <Button onClick={() => navigate("/traveler")} className="rounded-full px-5">
              Search flights <ArrowRight className="ml-1 h-4 w-4" />
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
          <div className="border-t bg-background px-4 py-5 md:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col gap-1" aria-label="Mobile navigation">
              {[
                ["Platform", "#platform"],
                ["How it works", "#how-it-works"],
                ["For airlines", "#airlines"],
                ["Security", "#security"],
              ].map(([label, href]) => (
                <a key={href} href={href} onClick={closeMobileMenu} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted">
                  {label}
                </a>
              ))}
              <div className="mt-4 grid grid-cols-2 gap-2 border-t pt-4">
                <Button variant="outline" onClick={() => navigate("/login")}>Sign in</Button>
                <Button onClick={() => navigate("/traveler")}>Search flights</Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main>
        <section className="relative isolate overflow-hidden border-b bg-slate-950 text-white">
          <div className="absolute inset-0 -z-20">
            <img
              src="https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?auto=format&fit=crop&w=2200&q=85"
              alt=""
              className="h-full w-full object-cover opacity-25"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/95 to-indigo-950/60" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
          </div>

          <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-slate-200 backdrop-blur-md sm:text-sm">
                <Globe2 className="h-4 w-4 text-sky-300" />
                One platform for travelers and airlines
              </div>
              <h1 className="mt-7 text-4xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
                Better journeys begin with better infrastructure.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                FlightHub brings flight discovery, booking, airline operations, and distribution into one connected platform.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button onClick={() => navigate("/traveler")} className="h-12 rounded-full bg-white px-6 text-slate-950 hover:bg-slate-100">
                  Search flights <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button onClick={() => navigate("/airline-onboarding")} variant="outline" className="h-12 rounded-full border-white/25 bg-white/5 px-6 text-white hover:bg-white/10 hover:text-white">
                  Join as an airline
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-slate-300 sm:text-sm">
                {["Clear flight comparison", "Secure booking flow", "Connected airline operations"].map((item) => (
                  <span key={item} className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-300" />{item}</span>
                ))}
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="absolute -inset-12 rounded-full bg-primary/25 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 p-3 shadow-2xl backdrop-blur-xl">
                <div className="rounded-[1.4rem] bg-white p-5 text-slate-950">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600">Flight search</p>
                      <p className="mt-1 text-sm text-slate-500">Build your next journey</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">Live availability</span>
                  </div>
                  <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-medium text-slate-500">From</p>
                      <p className="mt-2 text-2xl font-bold">SGN</p>
                      <p className="text-xs text-slate-500">Ho Chi Minh City</p>
                    </div>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-violet-700"><ArrowRight className="h-4 w-4" /></span>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-medium text-slate-500">To</p>
                      <p className="mt-2 text-2xl font-bold">SIN</p>
                      <p className="text-xs text-slate-500">Singapore</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    {[
                      ["Departure", "18 Jun"],
                      ["Travelers", "2 adults"],
                      ["Cabin", "Economy"],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl border p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                        <p className="mt-1 text-xs font-semibold sm:text-sm">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-center rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white">
                    Search flights
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="platform" className="scroll-mt-20 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">The platform</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">Every essential workflow, working together.</h2>
              <p className="mt-5 leading-7 text-muted-foreground">
                FlightHub connects the traveler booking experience with the tools airlines need to operate and distribute flights.
              </p>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {capabilities.map(({ icon: Icon, title, description }) => (
                <article key={title} className="rounded-3xl border bg-card p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <span className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary"><Icon className="h-5 w-5" /></span>
                  <h3 className="mt-5 font-semibold">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-20 bg-muted/45 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">How it works</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">Two experiences. One connected journey.</h2>
            </div>
            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              {[
                { icon: Users, title: "For travelers", description: "A focused path from search to ticket.", steps: travelerSteps, action: "Explore flights", route: "/traveler" },
                { icon: Plane, title: "For airlines", description: "A structured path from onboarding to operations.", steps: airlineSteps, action: "Start onboarding", route: "/airline-onboarding" },
              ].map(({ icon: Icon, title, description, steps, action, route }) => (
                <article key={title} className="rounded-[2rem] border bg-card p-6 sm:p-8">
                  <div className="flex items-center gap-4 border-b pb-6">
                    <span className="rounded-2xl bg-primary p-3 text-primary-foreground"><Icon className="h-6 w-6" /></span>
                    <div><h3 className="text-xl font-semibold">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>
                  </div>
                  <ol className="mt-7 space-y-6">
                    {steps.map((step, index) => (
                      <li key={step.title} className="flex gap-4">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{index + 1}</span>
                        <div><h4 className="font-semibold">{step.title}</h4><p className="mt-1 text-sm leading-6 text-muted-foreground">{step.description}</p></div>
                      </li>
                    ))}
                  </ol>
                  <Button onClick={() => navigate(route)} variant="outline" className="mt-8 h-11 rounded-full px-5">
                    {action} <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="airlines" className="scroll-mt-20 py-20 sm:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">For airline teams</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">Operate with a clearer view of the business.</h2>
              <p className="mt-5 leading-7 text-muted-foreground">
                Bring core commercial and operational workflows into one role-aware dashboard, from aircraft configuration to booking performance.
              </p>
              <div className="mt-7 space-y-3">
                {["Aircraft and cabin configuration", "Schedules, fares, ancillaries, and policies", "Booking management and operational analytics"].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm font-medium"><CircleCheck className="h-5 w-5 text-emerald-500" />{item}</div>
                ))}
              </div>
              <Button onClick={() => navigate("/airline-onboarding")} className="mt-8 h-11 rounded-full px-5">
                Join FlightHub <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { label: "Inventory", value: "Centralized", icon: Layers3 },
                { label: "Distribution", value: "Connected", icon: Globe2 },
                { label: "Access", value: "Role-aware", icon: ShieldCheck },
                { label: "Insights", value: "Actionable", icon: BarChart3 },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-3xl border bg-muted/30 p-6">
                  <Icon className="h-6 w-6 text-primary" />
                  <p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
                  <p className="mt-2 text-2xl font-semibold">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="security" className="scroll-mt-20 bg-slate-950 py-20 text-white sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-violet-300">Built responsibly</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">Confidence at every step.</h2>
              <p className="mt-5 leading-7 text-slate-300">Production travel systems need more than a polished interface. FlightHub is designed around clear ownership, secure workflows, and dependable operations.</p>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {trustItems.map(({ icon: Icon, title, description }) => (
                <article key={title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                  <Icon className="h-5 w-5 text-violet-300" />
                  <h3 className="mt-5 font-semibold">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-[2rem] bg-primary px-6 py-14 text-primary-foreground sm:px-12 lg:flex lg:items-center lg:justify-between lg:px-16">
              <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
              <div className="relative max-w-2xl">
                <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Ready to move forward?</h2>
                <p className="mt-4 text-primary-foreground/80">Start planning a journey or bring your airline onto the platform.</p>
              </div>
              <div className="relative mt-8 flex flex-col gap-3 sm:flex-row lg:mt-0">
                <Button onClick={() => navigate("/traveler")} className="h-11 rounded-full bg-white px-5 text-slate-950 hover:bg-slate-100">Search flights</Button>
                <Button onClick={() => navigate("/airline-onboarding")} variant="outline" className="h-11 rounded-full border-white/30 bg-transparent px-5 text-white hover:bg-white/10 hover:text-white">Airline onboarding</Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-muted/30">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <Link to="/" className="flex items-center gap-2 font-bold"><Plane className="h-4 w-4 text-primary" />FlightHub</Link>
            <p className="mt-2 text-xs text-muted-foreground">Connected flight booking and airline operations.</p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-muted-foreground">
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

export default LandingPage
