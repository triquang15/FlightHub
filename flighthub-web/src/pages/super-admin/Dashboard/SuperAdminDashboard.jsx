import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  Crown,
  AlertTriangle,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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

const emptyPlatformStats = {
  loading: true,
  totalAirlines: null,
  activeAirlines: null,
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
      inactiveAirlinesRes,
      bannedAirlinesRes,
      airportsRes,
      citiesRes,
      usersRes,
      notificationsRes,
    ] = await Promise.all([
      safeRequest(() => api.get("/api/airlines", { params: { page: 0, size: 1 } })),
      safeRequest(() => api.get("/api/airlines", { params: { page: 0, size: 1, status: "ACTIVE" } })),
      safeRequest(() => api.get("/api/airlines", { params: { page: 0, size: 1, status: "INACTIVE" } })),
      safeRequest(() => api.get("/api/airlines", { params: { page: 0, size: 1, status: "BANNED" } })),
      safeRequest(() => api.get("/api/airports", { params: { page: 0, size: 1 } })),
      safeRequest(() => api.get("/api/cities", { params: { page: 0, size: 1 } })),
      safeRequest(() => api.get("/api/users", { params: { page: 0, size: 100 } })),
      safeRequest(() => api.get("/api/notifications/overview")),
    ]);

    const notificationOverview = getPayload(notificationsRes);
    const inactiveAirlines = inactiveAirlinesRes ? getPageTotal(inactiveAirlinesRes) : null;
    const bannedAirlines = bannedAirlinesRes ? getPageTotal(bannedAirlinesRes) : null;
    const failedNotifications = notificationOverview?.deliveriesByStatus?.FAILED ?? null;

    setPlatformStats({
      ...emptyPlatformStats,
      loading: false,
      totalAirlines: airlinesRes ? getPageTotal(airlinesRes) : null,
      activeAirlines: activeAirlinesRes ? getPageTotal(activeAirlinesRes) : null,
      inactiveAirlines,
      bannedAirlines,
      restrictedAirlines: Number.isFinite(inactiveAirlines) || Number.isFinite(bannedAirlines)
        ? (inactiveAirlines ?? 0) + (bannedAirlines ?? 0)
        : null,
      totalAirports: airportsRes ? getPageTotal(airportsRes) : null,
      totalCities: citiesRes ? getPageTotal(citiesRes) : null,
      totalUsers: usersRes ? getPageTotal(usersRes) : null,
      totalAgents: null,
      pendingApprovals: null,
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
      />

      {/* Main Content Area */}
      <div
        className={cn(
          "flex-1 transition-all duration-300 ease-in-out",
          isSidebarCollapsed ? "ml-16" : "ml-80"
        )}
      >
        {/* Header */}
        <div className="bg-background border-b border-border sticky top-0 z-30">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Crown className="h-6 w-6 text-primary" />
                  {getSectionTitle(activeSection)}
                </h1>
                <p className="text-muted-foreground">
                  {getSectionDescription(activeSection)}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="outline" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  System Alerts
                  <Badge className="ml-1 bg-red-100 text-red-800">
                    {platformStats.loading ? "…" : platformStats.securityAlerts ?? "N/A"}
                  </Badge>
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Pending Approvals
                  <Badge className="ml-1 bg-yellow-100 text-yellow-800">
                    {platformStats.loading ? "…" : platformStats.pendingApprovals ?? "N/A"}
                  </Badge>
                </Button>
                <Button className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Admin Actions
                </Button>
              </div>
            </div>

          </div>
        </div>

        {/* Main Content */}
        <ScrollArea className="flex-1 p-6">
          <SuperAdminRoutes platformStats={platformStats} />
        </ScrollArea>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
