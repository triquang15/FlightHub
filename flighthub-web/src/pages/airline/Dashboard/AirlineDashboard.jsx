import * as React from "react"
import { useLocation } from "react-router-dom"
import { PlaneTakeoff } from "lucide-react"
import { cn } from "@/lib/utils"
import AirlineSidebar from "../Sidebar/AirlineSidebar"
import AirlineRoutes from "../routes/AirlineRoutes"
import { useSelector, useDispatch } from "react-redux"
import { getFlightsByAirline } from "@/Redux/flight/flightThunk"
import { getAirlineByAdmin } from "@/Redux/airline/airlineThunks"
import WorkspaceHeader from "@/components/navigation/WorkspaceHeader"

const sectionMeta = {
  overview: ["Operations Overview", "Monitor your airline configuration and operational readiness"],
  aircraft: ["Fleet Management", "Manage aircraft details and cabin configurations"],
  flights: ["Flight Management", "Manage flight definitions, routes, and fares"],
  schedules: ["Flight Schedules", "Manage recurring schedules and timetable templates"],
  instances: ["Flight Instances", "Manage dated flight operations and cabin inventory"],
  fareRules: ["Fare Rules", "Configure fare restrictions and commercial conditions"],
  baggagePolicy: ["Baggage Policies", "Configure baggage allowances for your airline"],
  insuranceCoverages: ["Insurance Coverage", "Manage travel protection products"],
  ancillaries: ["Ancillaries", "Manage optional services and add-ons"],
  meals: ["Meal Management", "Manage meal options and catering products"],
  pricing: ["Pricing & Promotions", "Manage coupons and promotional offers"],
  bookings: ["Booking Management", "Review and manage passenger bookings"],
  transactions: ["Transactions", "Review airline payment and settlement activity"],
  "route-performance": ["Route Performance", "Analyze performance across operated routes"],
  "airport-performance": ["Airport Performance", "Monitor performance across your airport network"],
  profile: ["Account Profile", "Manage your owner identity, contact details, and sign-in security"],
  "organization-profile": ["Airline Profile", "Manage airline identity and customer support contacts"],
  settlements: ["Settlements", "Review airline-specific balances and settlement statements"],
  administration: ["Workspace Administration", "Manage airline-scoped access, activity, and integrations"],
}

const statusClass = {
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300",
  PENDING: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-300",
  INACTIVE: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300",
  SUSPENDED: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/30 dark:text-orange-300",
  BANNED: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300",
}

const AirlineDashboard = () => {
  const location = useLocation()
  const dispatch = useDispatch()

  // Determine active section from URL
  const getActiveSectionFromPath = (pathname) => {
    if (pathname === '/airline' || pathname === '/airline/' || pathname === '/airline/dashboard') return 'overview'
    if (pathname.includes('/aircraft')) return 'aircraft'
    if (pathname.includes('/baggage-policies')) return 'baggagePolicy'
    if (pathname.includes('/fare-rules')) return 'fareRules'
    if (pathname.includes('/fares') || pathname.includes('/fare/')) return 'fares'
    if (pathname.includes('/flight-cabin')) return 'flights'
    if (pathname.includes('/flights')) return 'flights'
    if (pathname.includes('/schedules')) return 'schedules'
    if (pathname.includes('/instances')) return 'instances'
    if (pathname.includes('/insurance-coverages')) return 'insuranceCoverages'
    if (pathname.includes('/ancillaries')) return 'ancillaries'
    if (pathname.includes('/meals')) return 'meals'
    if (pathname.includes('/coupons')) return 'pricing'
    if (pathname.includes('/pricing')) return 'pricing'
    if (pathname.includes('/bookings')) return 'bookings'
    if (pathname.includes('/transactions') || pathname.includes('/settlements')) return 'settlements'
    if (pathname.includes('/route-performance')) return 'route-performance'
    if (pathname.includes('/airport-performance')) return 'airport-performance';
    if (pathname.includes('/organization-profile')) return 'organization-profile'
    if (pathname.includes('/profile')) return 'profile'
    if (pathname.includes('/administration')) return 'administration'
    if (pathname.includes('/reports')) return 'reports'
    return 'overview'
  }

  const activeSection = getActiveSectionFromPath(location.pathname)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false)
  const [isMobileNavigationOpen, setIsMobileNavigationOpen] = React.useState(false)
  
  // Existing flight management state
  const {flights}=useSelector(state=>state.flight)
  const currentAirline = useSelector((state) => state.airline?.currentAirline)
 

  const [statusFilter, setStatusFilter] = React.useState("all")
  const [routeFilter, setRouteFilter] = React.useState("all")



  // Load flights on component mount
  React.useEffect(() => {
    dispatch(getFlightsByAirline());
    dispatch(getAirlineByAdmin());
  }, [dispatch])


 

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  const [sectionTitle, sectionDescription] = sectionMeta[activeSection] || sectionMeta.overview
  const airlineStatus = String(currentAirline?.status || "INACTIVE").toUpperCase()

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <AirlineSidebar
        activeSection={activeSection}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        isMobileOpen={isMobileNavigationOpen}
        onMobileClose={() => setIsMobileNavigationOpen(false)}
      />

      {/* Main Content Area */}
      <div className={cn(
        "flex min-h-screen min-w-0 w-full flex-col overflow-hidden transition-all duration-300 ease-in-out",
        isSidebarCollapsed
          ? "lg:ml-16 lg:w-[calc(100vw_-_4rem)] lg:max-w-[calc(100vw_-_4rem)]"
          : "lg:ml-80 lg:w-[calc(100vw_-_20rem)] lg:max-w-[calc(100vw_-_20rem)]"
      )}>
        <WorkspaceHeader
          title={sectionTitle}
          description={sectionDescription}
          badge={airlineStatus}
          badgeClassName={statusClass[airlineStatus] || statusClass.INACTIVE}
          icon={PlaneTakeoff}
          iconClassName="bg-sky-500/10 text-sky-600 dark:text-sky-400"
          onOpenNavigation={() => setIsMobileNavigationOpen(true)}
        />

        {/* Main Content */}
        <main className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
          <AirlineRoutes
            flights={flights}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            routeFilter={routeFilter}
            setRouteFilter={setRouteFilter}
          
          />
        </main>
      </div>

      
    </div>
  )
}



export default AirlineDashboard
