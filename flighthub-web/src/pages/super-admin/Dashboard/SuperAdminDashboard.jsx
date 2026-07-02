import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import SuperAdminSidebar from "../Sidebar/SuperAdminSidebar";
import SuperAdminRoutes from "../routes/SuperAdminRoutes";
import {
  getActiveSectionFromPath,
  getSectionTitle,
  getSectionDescription,
  navigateToSection,
} from "../utils/routingUtils";
import { SIDEBAR_COLLAPSE_KEY } from "../constants";
import api from "@/utils/api";
import WorkspaceHeader from "@/components/navigation/WorkspaceHeader";

const emptyPlatformStats = {
  loading: true,
  totalAirlines: null,
  activeAirlines: null,
  pendingAirlines: null,
  inactiveAirlines: null,
  bannedAirlines: null,
  restrictedAirlines: null,
  totalAirports: null,
  totalCities: null,
  totalFlights: null,
  activeFlights: null,
  totalBookings: null,
  totalUsers: null,
  totalAgents: null,
  systemRevenue: null,
  commissionRevenue: null,
  pendingApprovals: null,
  securityAlerts: null,
  totalNotificationEvents: null,
  totalNotificationDeliveries: null,
  failedNotifications: null,
  systemUptime: null,
};

const getPayload = (response) => response?.data?.data ?? response?.data ?? null;
const getPageTotal = (response) => {
  const payload = getPayload(response);
  return payload?.totalElements ?? 0;
};

const SuperAdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();


  const activeSection = React.useMemo(() => {
    const urlParams = new URLSearchParams(location.search);
    return getActiveSectionFromPath(location.pathname, urlParams);
  }, [location.pathname, location.search]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(() => {
    // Load sidebar collapse state from localStorage
    try {
      const saved = localStorage.getItem(SIDEBAR_COLLAPSE_KEY);
      return saved ? JSON.parse(saved) : false;
    } catch (error) {
      console.warn('Failed to load sidebar state from localStorage:', error);
      return false;
    }
  });
  const [isMobileNavigationOpen, setIsMobileNavigationOpen] = React.useState(false);
  const [platformStats, setPlatformStats] = React.useState(emptyPlatformStats);

  // Handle sidebar section changes using the utility function
  const handleSectionChange = React.useCallback((sectionId) => {
    try {
      navigateToSection(sectionId, navigate);
    } catch (error) {
      console.error('Navigation error:', error);
      // Could show a toast notification here in production
    }
  }, [navigate]);

  const toggleSidebar = React.useCallback(() => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);

    // Save sidebar state to localStorage
    try {
      localStorage.setItem(SIDEBAR_COLLAPSE_KEY, JSON.stringify(newState));
    } catch (error) {
      console.warn('Failed to save sidebar state to localStorage:', error);
    }
  }, [isSidebarCollapsed]);

  const loadPlatformStats = React.useCallback(async () => {
    const safeRequest = async (request) => {
      try {
        return await request();
      } catch (error) {
        console.warn("Failed to load platform stat:", error.response?.data?.message || error.message);
        return null;
      }
    };

    const [
      airlinesRes,
      activeAirlinesRes,
      pendingAirlinesRes,
      inactiveAirlinesRes,
      bannedAirlinesRes,
      airportsRes,
      citiesRes,
      usersRes,
      notificationsRes,
    ] = await Promise.all([
      safeRequest(() => api.get("/api/airlines", { params: { page: 0, size: 1 } })),
      safeRequest(() => api.get("/api/airlines", { params: { page: 0, size: 1, status: "ACTIVE" } })),
      safeRequest(() => api.get("/api/airlines", { params: { page: 0, size: 1, status: "PENDING" } })),
      safeRequest(() => api.get("/api/airlines", { params: { page: 0, size: 1, status: "INACTIVE" } })),
      safeRequest(() => api.get("/api/airlines", { params: { page: 0, size: 1, status: "BANNED" } })),
      safeRequest(() => api.get("/api/airports", { params: { page: 0, size: 1 } })),
      safeRequest(() => api.get("/api/cities", { params: { page: 0, size: 1 } })),
      safeRequest(() => api.get("/api/users", { params: { page: 0, size: 100 } })),
      safeRequest(() => api.get("/api/notifications/overview")),
    ]);

    const notificationOverview = getPayload(notificationsRes);
    const pendingAirlines = pendingAirlinesRes ? getPageTotal(pendingAirlinesRes) : null;
    const inactiveAirlines = inactiveAirlinesRes ? getPageTotal(inactiveAirlinesRes) : null;
    const bannedAirlines = bannedAirlinesRes ? getPageTotal(bannedAirlinesRes) : null;
    const failedNotifications = notificationOverview?.deliveriesByStatus?.FAILED ?? null;

    setPlatformStats({
      ...emptyPlatformStats,
      loading: false,
      totalAirlines: airlinesRes ? getPageTotal(airlinesRes) : null,
      activeAirlines: activeAirlinesRes ? getPageTotal(activeAirlinesRes) : null,
      pendingAirlines,
      inactiveAirlines,
      bannedAirlines,
      restrictedAirlines: Number.isFinite(inactiveAirlines) || Number.isFinite(bannedAirlines)
        ? (inactiveAirlines ?? 0) + (bannedAirlines ?? 0)
        : null,
      totalAirports: airportsRes ? getPageTotal(airportsRes) : null,
      totalCities: citiesRes ? getPageTotal(citiesRes) : null,
      totalUsers: usersRes ? getPageTotal(usersRes) : null,
      totalAgents: null,
      pendingApprovals: pendingAirlines,
      securityAlerts: failedNotifications,
      totalNotificationEvents: notificationOverview?.totalEvents ?? null,
      totalNotificationDeliveries: notificationOverview?.totalDeliveries ?? null,
      failedNotifications,
    });
  }, []);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      loadPlatformStats();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadPlatformStats]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <SuperAdminSidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        platformStats={platformStats}
        isMobileOpen={isMobileNavigationOpen}
        onMobileClose={() => setIsMobileNavigationOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={cn(
          "flex min-h-screen min-w-0 w-full flex-col overflow-hidden transition-all duration-300 ease-in-out",
          isSidebarCollapsed
            ? "lg:ml-16 lg:w-[calc(100vw_-_4rem)] lg:max-w-[calc(100vw_-_4rem)]"
            : "lg:ml-80 lg:w-[calc(100vw_-_20rem)] lg:max-w-[calc(100vw_-_20rem)]"
        )}
      >
        <WorkspaceHeader
          title={getSectionTitle(activeSection)}
          description={getSectionDescription(activeSection)}
          badge="System Admin"
          badgeClassName="border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-300"
          icon={Shield}
          iconClassName="bg-violet-500/10 text-violet-600 dark:text-violet-400"
          onOpenNavigation={() => setIsMobileNavigationOpen(true)}
        />

        {/* Main Content */}
        <main className="min-h-0 min-w-0 flex-1 overflow-auto p-4 sm:p-6">
          <div className="mx-auto min-w-0 max-w-full">
            <SuperAdminRoutes platformStats={platformStats} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
