import { Routes, Route } from 'react-router-dom';
import AirlineManagement from '../airline/AirlineManagement';
import AirportManagementNew from '../airport/AirportManagementNew';
import CreateAirport from '../airport/CreateAirport';
import EditAirport from '../airport/EditAirport';
import FlightInventory from '../Dashboard/FlightInventory';
import SearchDataInspector from '../Dashboard/SearchDataInspector';

import UserManagement from '../Dashboard/UserManagement';
import NotificationsManagement from '../Dashboard/NotificationsManagement';
import AirportPerformancePage from "../Dashboard/AirportPerformancePage";
import RoutePerformancePage from "../Dashboard/RoutePerformancePage";
import AirlinePerformancePage from "../Dashboard/Airport Anlitics/AirlinePerformancePage";
import CityManagement from '../city/CityManagement';
import PlatformOverview from '../Dashboard/PlateformOverview';
import PlatformModulePlaceholder from '../Dashboard/PlatformModulePlaceholder';
import WorkspaceAccountProfile from '@/components/account/WorkspaceAccountProfile';

// Platform Overview Component


const SuperAdminRoutes = ({ platformStats }) => {
  return (
    <Routes>
      {/* Platform Overview */}
      <Route path="/" element={<PlatformOverview platformStats={platformStats} />} />
      <Route path="/dashboard" element={<PlatformOverview platformStats={platformStats} />} />
      <Route path="/overview" element={<PlatformOverview platformStats={platformStats} />} />

      {/* Airline Management */}
      <Route path="/airlines" element={<AirlineManagement />} />
      <Route path="/airlines/pending" element={<AirlineManagement activeSection={"airlines-pending"} />} />
      <Route path="/airlines/suspended" element={<AirlineManagement activeSection={"airlines-suspended"} />} />
      <Route path="/airlines/compliance" element={<PlatformModulePlaceholder module="airlineCompliance" />} />
      <Route path="/airlines/commission" element={<PlatformModulePlaceholder module="airlineCommission" />} />
    

      {/* Airport Management */}
      <Route path="/airports" element={<AirportManagementNew />} />
      <Route path="/airports/new" element={<CreateAirport />} />
      <Route path="/airports/:airportId/edit" element={<EditAirport />} />
      <Route path="/airports/:airportId" element={<AirportManagementNew />} />

      {/* City Management - Multiple route paths */}
      <Route path="/cities" element={<CityManagement />} />
      <Route path="/airports/cities" element={<CityManagement />} />
      <Route path="/cities/:cityId" element={<CityManagement />} />
      <Route path="/cities/:cityId/edit" element={<CityManagement />} />
      <Route path="/cities/new" element={<CityManagement />} />

      {/* Flight Management */}
      <Route path="/flights" element={<FlightInventory />} />
      <Route path="/flights/:flightId" element={<FlightInventory />} />
      <Route path="/search-data" element={<SearchDataInspector />} />
  

      {/* User Management */}
      <Route path="/users" element={<UserManagement />} />
      <Route path="/users/:userId" element={<UserManagement />} />
      <Route path="/profile" element={<WorkspaceAccountProfile variant="admin" />} />
      <Route path="/agents" element={<UserManagement />} />
      <Route path="/access/roles" element={<PlatformModulePlaceholder module="roles" />} />
      <Route path="/access/audit" element={<PlatformModulePlaceholder module="audit" />} />

      {/* Financial Management */}
      <Route path="/financial" element={<PlatformModulePlaceholder module="transactions" />} />
      <Route path="/finance/transactions" element={<PlatformModulePlaceholder module="transactions" />} />
      <Route path="/finance/settlements" element={<PlatformModulePlaceholder module="settlements" />} />
      <Route path="/finance/disputes" element={<PlatformModulePlaceholder module="disputes" />} />

      {/* Reports & Analytics */}
      <Route path="/reports" element={<PlatformModulePlaceholder module="reports" />} />
      <Route path="/reports/platform" element={<PlatformModulePlaceholder module="reports" />} />
      <Route path="/reports/airline/:airlineId" element={<PlatformModulePlaceholder module="reports" />} />
      <Route path="/analytics" element={<PlatformModulePlaceholder module="reports" />} />

      {/* System Configuration */}
      <Route path="/system" element={<PlatformModulePlaceholder module="settings" />} />

      {/* Notifications */}
      <Route path="/notifications" element={<NotificationsManagement activeSection="notifications-system" />} />
      <Route path="/notifications/deliveries" element={<NotificationsManagement activeSection="notifications-deliveries" />} />
      <Route path="/notifications/failed" element={<NotificationsManagement activeSection="notifications-failed" />} />
      <Route path="/notifications/templates" element={<NotificationsManagement activeSection="notifications-templates" />} />
      <Route path="/notifications/channels" element={<NotificationsManagement activeSection="notifications-channels" />} />
      <Route path="/operations/health" element={<PlatformModulePlaceholder module="health" />} />
      <Route path="/operations/incidents" element={<PlatformModulePlaceholder module="incidents" />} />
      <Route path="/configuration/settings" element={<PlatformModulePlaceholder module="settings" />} />
      <Route path="/configuration/integrations" element={<PlatformModulePlaceholder module="integrations" />} />

      {/* Security & Compliance */}
      <Route path="/security" element={<PlatformModulePlaceholder module="audit" />} />
      <Route path="/security/audit" element={<PlatformModulePlaceholder module="audit" />} />
      {/* Performance Analytics */}
      <Route path="/airport-performance" element={<AirportPerformancePage />} />
      <Route path="/route-performance" element={<RoutePerformancePage />} />
      <Route path="/airline-performance" element={<AirlinePerformancePage />} />

      {/* Catch-all route */}
      <Route path="*" element={
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h2>
            <p className="text-gray-600">The requested page does not exist in Super Admin panel.</p>
          </div>
        </div>
      } />
    </Routes>
  );
};

export default SuperAdminRoutes;
