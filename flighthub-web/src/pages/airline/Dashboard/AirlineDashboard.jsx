import * as React from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import AirlineSidebar from "../Sidebar/AirlineSidebar"
import AirlineRoutes from "../routes/AirlineRoutes"
import { useSelector, useDispatch } from "react-redux"
import { getFlightsByAirline } from "@/Redux/flight/flightThunk"
import { getAirlineByAdmin } from "@/Redux/airline/airlineThunks"

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
  profile: ["Airline Profile", "Manage airline identity, support contacts, and owner details"],
  settlements: ["Settlements", "Review airline-specific balances and settlement statements"],
  administration: ["Workspace Administration", "Manage airline-scoped access, activity, and integrations"],
}

const statusClass = {
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300",
  INACTIVE: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300",
  SUSPENDED: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/30 dark:text-orange-300",
  BANNED: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300",
}

const AirlineDashboard = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  // Determine active section from URL
  const getActiveSectionFromPath = (pathname) => {
    if (pathname === '/airline' || pathname === '/airline/' || pathname === '/airline/dashboard') return 'overview'
    if (pathname.includes('/aircraft')) return 'aircraft'
    if (pathname.includes('/baggage-policies')) return 'baggagePolicy'
    if (pathname.includes('/fare-rules')) return 'fareRules'
    if (pathname.includes('/fare/')) return 'flights'
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
    if (pathname.includes('/profile')) return 'profile'
    if (pathname.includes('/administration')) return 'administration'
    if (pathname.includes('/reports')) return 'reports'
    return 'overview'
  }

  const activeSection = getActiveSectionFromPath(location.pathname)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false)
  
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


 

  // Handle sidebar section changes
  const handleSectionChange = (sectionId) => {
    switch(sectionId) {
      // Dashboard
      case 'overview':
        navigate('/airline/dashboard')
        break

      // Aircraft Management
      case 'aircraft':
        navigate('/airline/aircraft')
        break
      case 'create-aircraft':
        navigate('/airline/aircraft/new')
        break

      // Flight Management
      case 'flights':
        navigate('/airline/flights')
        break
      case 'flights-create':
        navigate('/airline/flights/new')
        break
      case 'flight-cabin-create':
        navigate('/airline/flight-cabin/new')
        break

      // Flight Schedules
      case 'schedules':
        navigate('/airline/schedules')
        break
      case 'schedules-create':
        navigate('/airline/schedules/new')
        break

      // Flight Instances
      case 'instances':
        navigate('/airline/instances')
        break
      case 'instances-create':
        navigate('/airline/instances/new')
        break

      // Fare Management
      case 'fare-create':
        navigate('/airline/fare/new')
        break

      // Baggage Policy
      case 'baggage-policy-create':
        navigate('/airline/baggage-policies/new')
        break
      case 'baggage-policies':
        navigate('/airline/baggage-policies')
        break

      // Fare Rules
      case 'fare-rules':
        navigate('/airline/fare-rules')
        break
      case 'fare-rules-create':
        navigate('/airline/fare-rules/new')
        break
      case 'fare-rules-templates':
        navigate('/airline/fare-rules/templates')
        break

      // Ancillaries
      case 'ancillaries-catalog':
        navigate('/airline/ancillaries')
        break
      case 'ancillaries-create':
        navigate('/airline/ancillaries/create')
        break
      case 'insurance-coverages':
        navigate('/airline/insurance-coverages')
        break

      // Meals
      case 'meals-catalog':
      case 'meals':
        navigate('/airline/meals')
        break

      // Pricing & Discounts
      case 'pricing-base':
        navigate('/airline/pricing/base')
        break
      case 'pricing-dynamic':
        navigate('/airline/pricing/dynamic')
        break
      case 'coupons':
        navigate('/airline/coupons')
        break
      case 'coupons-create':
        navigate('/airline/coupons/new')
        break
      case 'discounts-list':
        navigate('/airline/pricing/discounts')
        break
      case 'discounts-create':
        navigate('/airline/pricing/discounts/create')
        break
      case 'pricing-rules':
        navigate('/airline/pricing/rules')
        break

      // Bookings
      case 'bookings-list':
        navigate('/airline/bookings')
        break
      case 'bookings-payments':
        navigate('/airline/bookings/payments')
        break

      // Reports & Analytics
      case 'reports-sales':
        navigate('/airline/reports/sales')
        break
      case 'reports-occupancy':
        navigate('/airline/reports/occupancy')
        break
      case 'reports-revenue':
        navigate('/airline/reports/revenue')
        break
      case 'reports-performance':
        navigate('/airline/reports/performance')
        break
      case 'route-performance':
        navigate('/airline/route-performance')
        break
      case 'airport-performance':
        navigate('/airline/airport-performance')
        break
      case 'reports-custom':
        navigate('/airline/reports/custom')
        break

      default:
        navigate('/airline/dashboard')
    }
  }

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
        onSectionChange={handleSectionChange}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />

      {/* Main Content Area */}
      <div className={cn(
        "flex-1 transition-all duration-300 ease-in-out",
        isSidebarCollapsed ? "ml-16" : "ml-80"
      )}>
        {/* Header */}
        <div className="bg-background border-b border-border sticky top-0 z-30">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold text-foreground">{sectionTitle}</h1>
                  <Badge
                    variant="outline"
                    className={cn("rounded-md", statusClass[airlineStatus] || statusClass.INACTIVE)}
                  >
                    {airlineStatus}
                  </Badge>
                </div>
                <p className="mt-1 text-muted-foreground">{sectionDescription}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <ScrollArea className="flex-1 p-6">
          <AirlineRoutes
            flights={flights}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            routeFilter={routeFilter}
            setRouteFilter={setRouteFilter}
          
          />
        </ScrollArea>
      </div>

      
    </div>
  )
}



export default AirlineDashboard
