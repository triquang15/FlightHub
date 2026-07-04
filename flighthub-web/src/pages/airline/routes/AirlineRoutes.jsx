import { Link, Navigate, Routes, Route } from "react-router-dom";
import { AlertTriangle, Building2, LockKeyhole, RefreshCw } from "lucide-react";
import DashboardOverview from "../Dashboard/DashboardOverview";
import FlightForm from "../Dashboard/FlightManagment/FlightForm";
import AnalyticsDashboard from "../Dashboard/AnalyticsDashboard";
import BookingManagement from "../Dashboard/Bookings/BookingManagement";

import SeatManagement from "../Dashboard/SeatManagement";

import FlightManagement from "../Dashboard/FlightManagment/FlightManagement";
import AircraftListPage from "../Dashboard/AircraftManagement/AircraftListPage";
import AircraftDetail from "../Dashboard/AircraftManagement/AircraftDetail";
import CabinClassCreate from "../Dashboard/CabinClassCreate";
import CabinClassEdit from "../Dashboard/CabinClassEdit";
import { SeatMapCreate, SeatMapView, SeatMapEdit } from "../SeatMap";
import AircraftForm from "../Dashboard/AircraftManagement/AircraftForm";

import FlightInstanceDetail from "../Dashboard/FlightInstances/FlightInstanceDetail";
import FlightInstanceForm from "../Dashboard/FlightInstances/FlightInstanceForm";
import FlightScheduleForm from "../Dashboard/FlightSchedules/FlightScheduleForm";
import FlightScheduleTable from "../Dashboard/FlightSchedules/FlightScheduleTable";
import FlightScheduleDetail from "../Dashboard/FlightSchedules/FlightScheduleDetail";

// import FlightCabinSeatPage from "../Dashboard/FlightCabins/FlightInstanceCabinSeatPage";
import FlightDetail from "../Dashboard/FlightManagment/FlightDetail";
import FareRulesManagement from "../Dashboard/FareRules/FareRulesManagement";
import FareRulesForm from "../Dashboard/FareRules/FareRulesForm";
import FareRulesDetail from "../Dashboard/FareRules/FareRulesDetail";
import BagagePolicyForm from "../Dashboard/BaggagePolicy/BaggagePolicyForm";
import BaggagePolicyDetail from "../Dashboard/BaggagePolicy/BaggagePolicyDetail";
import BaggagePolicyPage from "../Dashboard/BaggagePolicy/BaggagePolicyPage";
import FareManagementForm from "../Dashboard/Fare/FareManagementForm";
import FareManagement from "../Dashboard/Fare/FareManagement";
import FareDetail from "../Dashboard/Fare/FareDetail";


import FlightInstanceTable from "../Dashboard/FlightInstances/FlightInstanceTable";

import AncillaryList from "../Dashboard/Ancillaries/AncillaryList";
import AncillaryForm from "../Dashboard/Ancillaries/AncillaryForm";


import FlightCabinAncillaryForm from "../Dashboard/FlightCabinAncillaries/FlightCabinAncillaryForm";
import MealManagement from "../Dashboard/Meals/MealManagement";
import MealFormPage from "../Dashboard/Meals/MealFormPage";

import FlightMealFormPage from "../Dashboard/FlightMeals/FlightMealFormPage";
import InsuranceCoverageManagement from "../Dashboard/InsuranceCoverage/InsuranceCoverageManagement";
import BookingStatisticsOverview from "../Dashboard/BookingStatistics/BookingStatisticsOverview";
import RoutePerformancePage from "../Dashboard/RoutePerformance/RoutePerformancePage";
import AirportPerformancePage from "../Dashboard/AirportPerformance/AirportPerformancePage";
import CouponTable from "../Dashboard/Coupons/CouponTable";
import CouponForm from "../Dashboard/Coupons/CouponForm";

import AirlineAdminProfile from "../Airline Admin Profile/AirlineAdminProfile";
import WorkspaceAccountProfile from "@/components/account/WorkspaceAccountProfile";
import FlightInstanceCabinDetails from "../Dashboard/FlightInstances/FlightInstanceCabinDetails";
import AirlineOwnerModulePlaceholder from "../Dashboard/AirlineOwnerModulePlaceholder";
import { useSelector } from "react-redux";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const statusCopy = {
  PENDING: {
    title: "Airline is waiting for approval",
    description: "FlightHub operations must approve this airline before fleet, flight, schedule, fare, and ancillary modules can be changed.",
    tone: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-200",
  },
  INACTIVE: {
    title: "Airline operations are suspended",
    description: "Operational modules are paused while this airline is inactive. Contact a platform administrator to reactivate access.",
    tone: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200",
  },
  SUSPENDED: {
    title: "Airline operations are suspended",
    description: "Operational modules are paused while this airline is suspended. Contact a platform administrator to reactivate access.",
    tone: "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900/60 dark:bg-orange-950/30 dark:text-orange-200",
  },
  BANNED: {
    title: "Airline access is blocked",
    description: "This airline is banned from operational activity. Only profile review remains available.",
    tone: "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200",
  },
  UNKNOWN: {
    title: "Airline workspace is not ready",
    description: "We could not confirm an active airline profile for this owner account yet.",
    tone: "border-muted bg-muted/40 text-muted-foreground",
  },
};

const AirlineStatusGuard = ({ children }) => {
  const { currentAirline, loading } = useSelector((state) => state.airline);
  const status = String(currentAirline?.status || "UNKNOWN").toUpperCase();
  const isActive = status === "ACTIVE";
  const copy = statusCopy[status] || statusCopy.UNKNOWN;

  if (loading && !currentAirline) {
    return (
      <Card className="mx-auto max-w-3xl">
        <CardContent className="flex min-h-64 items-center justify-center gap-3 text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Checking airline workspace access...
        </CardContent>
      </Card>
    );
  }

  if (isActive) return children;

  return (
    <Card className="mx-auto max-w-3xl overflow-hidden">
      <CardContent className="space-y-5 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight">{copy.title}</h2>
              <Badge variant="outline" className={copy.tone}>
                {status}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{copy.description}</p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex gap-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300" />
            <div>
              <p className="font-medium">Available while restricted</p>
              <p className="mt-1 text-muted-foreground">
                You can still review the dashboard and maintain airline profile/support information.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild>
            <Link to="/airline/organization-profile">
              <Building2 className="mr-2 h-4 w-4" />
              Review airline profile
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/airline/dashboard">Back to overview</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const AirlineRoutes = ({
  flights,
  filteredFlights,
  dashboardStats,
  statusFilter,
  setStatusFilter,
  routeFilter,
  setRouteFilter,
 
  editingFlight,

}) => {
  const operational = (element) => (
    <AirlineStatusGuard>{element}</AirlineStatusGuard>
  );

  return (
    <Routes>
      {/* Dashboard Overview */}
      <Route
        path="/"
        element={
          <DashboardOverview
            flights={filteredFlights}
            dashboardStats={dashboardStats}
          />
        }
      />

       <Route
        path="/dashboard"
        element={
          <DashboardOverview
            flights={filteredFlights}
            dashboardStats={dashboardStats}
          />
        }
      />

      {/* Aircraft Management Routes */}
      <Route path="/aircraft" element={operational(<AircraftListPage />)} />
      <Route path="/aircraft/:aircraftId" element={operational(<AircraftDetail />)} />
      <Route
        path="/aircraft/:aircraftId/edit"
        element={operational(<AircraftForm />)}
      />
      <Route path="/aircraft/new" element={operational(<AircraftForm />)} />

      {/* Cabin Class Management Routes */}
      <Route
        path="/aircraft/:aircraftId/cabin/new"
        element={operational(<CabinClassCreate />)}
      />
      <Route
        path="/aircraft/:aircraftId/cabin/:cabinId/edit"
        element={operational(<CabinClassEdit />)}
      />

      {/* Seat Map Management Routes */}
      <Route
        path="/aircraft/:aircraftId/cabin/:cabinId/seat-map/:seatMapId"
        element={operational(<SeatMapView />)}
      />
      <Route
        path="/aircraft/:aircraftId/cabin/:cabinId/seat-map/:seatMapId/edit"
        element={operational(<SeatMapEdit />)}
      />
      <Route
        path="/aircraft/:aircraftId/cabin/:cabinId/seat-map/create"
        element={operational(<SeatMapCreate />)}
      />

      {/* Flight Management Routes */}
      <Route
        path="/flights"
        element={
          operational(<FlightManagement
            flights={filteredFlights}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            routeFilter={routeFilter}
            setRouteFilter={setRouteFilter}
            
          />)
        }
      />

      <Route
        path="/flights/new"
        element={operational(<FlightForm flight={editingFlight} />)}
      />

      <Route path="/flights/:id" element={operational(<FlightDetail />)} />

      <Route
        path="/flights/:flightId/edit"
        element={operational(<FlightForm flight={editingFlight} />)}
      />

      

      {/* Meal Management Routes */}
      <Route path="/meals" element={operational(<MealManagement />)} />
      <Route path="/meals/new" element={operational(<MealFormPage />)} />
      <Route path="/meals/:id/edit" element={operational(<MealFormPage />)} />

      {/* Flight Meal Management Routes */}
      <Route path="/flights/:flightId/meals/assign" element={operational(<FlightMealFormPage />)} />


      {/* Flight Instance Management Routes */}
      <Route path="/instances" element={operational(<FlightInstanceTable />)} />
      <Route path="/instances/:id" element={operational(<FlightInstanceDetail />)} />
      <Route path="/instances/:id/edit" element={operational(<FlightInstanceForm />)} />
      <Route path="/instances/new" element={operational(<FlightInstanceForm />)} />
      

      {/* Flight Schedule Management Routes */}
      <Route path="/schedules" element={operational(<FlightScheduleTable />)} />
      <Route path="/schedules/:id" element={operational(<FlightScheduleDetail />)} />
      <Route path="/schedules/:id/edit" element={operational(<FlightScheduleForm />)} />
      <Route path="/schedules/new" element={operational(<FlightScheduleForm />)} />

      {/* Flight Instance Cabin Management Routes (Instance Level) */}

      <Route
        path="/instances/:flightInstanceId/cabins/:cabinId"
        element={operational(<FlightInstanceCabinDetails />)}
      />

    
      {/* Master Ancillary Management Routes */}
      <Route path="/ancillaries" element={operational(<AncillaryList />)} />
      <Route path="/ancillaries/create" element={operational(<AncillaryForm />)} />
      <Route path="/ancillaries/edit/:id" element={operational(<AncillaryForm />)} />

      {/* Insurance Coverage Management Routes */}
      <Route path="/insurance-coverages" element={operational(<InsuranceCoverageManagement />)} />

      {/* Flight Cabin Ancillary Management Routes */}
      <Route path="/cabin-ancillaries/new" element={operational(<FlightCabinAncillaryForm />)} />

      {/* Fare Rules Management Routes */}
      <Route path="/fare-rules" element={operational(<FareRulesManagement />)} />
      <Route path="/fare-rules/new" element={operational(<FareRulesForm />)} />
      <Route path="/fare-rules/:id" element={operational(<FareRulesDetail />)} />
      <Route path="/fare-rules/:id/edit" element={operational(<FareRulesForm />)} />

      {/* Fare Management Routes */}
      <Route path="/fares" element={operational(<FareManagement />)} />
      <Route path="/fares/new" element={operational(<FareManagementForm />)} />
      <Route path="/fares/:id" element={operational(<FareDetail />)} />
      <Route path="/fares/:id/edit" element={operational(<FareManagementForm />)} />
      <Route path="/fare/new" element={<Navigate to="/airline/fares/new" replace />} />
      <Route path="/fare/:id/edit" element={<Navigate to="/airline/fares" replace />} />

      {/* Baggage Policy Management Routes */}
      <Route path="/baggage-policies" element={operational(<BaggagePolicyPage />)} />
      <Route path="/baggage-policies/new" element={operational(<BagagePolicyForm />)} />
      <Route path="/baggage-policies/:id" element={operational(<BaggagePolicyDetail />)} />
      <Route path="/baggage-policies/:id/edit" element={operational(<BagagePolicyForm />)} />

      {/* Coupon Management Routes */}
      <Route path="/coupons" element={operational(<CouponTable />)} />
      <Route path="/coupons/new" element={operational(<CouponForm />)} />
      <Route path="/coupons/:id/edit" element={operational(<CouponForm />)} />

      
      <Route path="/seats" element={operational(<SeatManagement activeSection="seats" />)} />
      <Route path="/pricing" element={<Navigate to="/airline/coupons" replace />} />
      <Route path="/offers" element={<Navigate to="/airline/coupons" replace />} />
      <Route
        path="/bookings"
        element={operational(<BookingManagement  />)}
      />
      <Route
        path="/bookings/statistics"
        element={operational(<BookingStatisticsOverview />)}
      />
      <Route
        path="/route-performance"
        element={operational(<RoutePerformancePage />)}
      />
      <Route
        path="/airport-performance"
        element={operational(<AirportPerformancePage />)}
      />
    
      
      <Route
        path="/transactions"
        element={operational(<AirlineOwnerModulePlaceholder module="settlements" />)}
      />
      <Route path="/settlements" element={operational(<AirlineOwnerModulePlaceholder module="settlements" />)} />
      <Route path="/administration/team" element={operational(<AirlineOwnerModulePlaceholder module="team" />)} />
      <Route path="/administration/activity" element={operational(<AirlineOwnerModulePlaceholder module="activity" />)} />
      <Route path="/administration/integrations" element={operational(<AirlineOwnerModulePlaceholder module="integrations" />)} />
      <Route
        path="/reports"
        element={operational(<AnalyticsDashboard flights={flights} />)}
      />
      <Route
        path="/analytics"
        element={operational(<AnalyticsDashboard flights={flights} />)}
      />

      {/* Settings Routes */}
      <Route
        path="/profile"
        element={<WorkspaceAccountProfile variant="owner" />}
      />
      <Route path="/organization-profile" element={<AirlineAdminProfile />} />
      

      {/* Catch-all route */}
      <Route
        path="*"
        element={
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Page Not Found
              </h2>
              <p className="text-gray-600">
                The requested page does not exist.
              </p>
            </div>
          </div>
        }
      />
    </Routes>
  );
};

export default AirlineRoutes;
