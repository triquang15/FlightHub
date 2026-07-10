import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle, Bell, CheckCircle2, MailCheck, RefreshCw, Send, Shield } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
          actions={
            <HeaderNotificationCenter
              stats={platformStats}
              onNavigate={handleSectionChange}
              onRefresh={loadPlatformStats}
            />
          }
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

const HeaderNotificationCenter = ({ stats, onNavigate, onRefresh }) => {
  const failedCount = Number(stats?.failedNotifications ?? 0);
  const eventCount = Number(stats?.totalNotificationEvents ?? 0);
  const deliveryCount = Number(stats?.totalNotificationDeliveries ?? 0);
  const hasFailures = failedCount > 0;
  const hasEvents = eventCount > 0 || deliveryCount > 0;
  const badgeValue = hasFailures ? failedCount : eventCount;
  const badgeLabel = badgeValue > 99 ? "99+" : String(badgeValue);
  const loading = stats?.loading;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          aria-label="Open notifications"
          className={cn(
            "relative hidden sm:inline-flex",
            hasFailures && "border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/15"
          )}
        >
          <Bell className="h-4 w-4" />
          {(hasFailures || hasEvents) && !loading && (
            <span
              className={cn(
                "absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none text-white shadow-sm",
                hasFailures ? "bg-destructive" : "bg-primary"
              )}
            >
              {badgeLabel}
            </span>
          )}
          {loading && (
            <span className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-muted-foreground" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="border-b p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-foreground">Notifications</h2>
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-md",
                    hasFailures
                      ? "border-destructive/30 bg-destructive/10 text-destructive"
                      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                  )}
                >
                  {hasFailures ? "Action needed" : "Healthy"}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Live delivery status from notification-service.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Refresh notifications"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 divide-x border-b">
          <NotificationMetric
            icon={MailCheck}
            label="Events"
            value={eventCount}
            loading={loading}
          />
          <NotificationMetric
            icon={Send}
            label="Deliveries"
            value={deliveryCount}
            loading={loading}
          />
          <NotificationMetric
            icon={AlertTriangle}
            label="Failed"
            value={failedCount}
            loading={loading}
            critical={hasFailures}
          />
        </div>

        <div className="space-y-3 p-4">
          <div
            className={cn(
              "rounded-lg border p-3",
              hasFailures
                ? "border-destructive/25 bg-destructive/10"
                : "border-emerald-500/20 bg-emerald-500/10"
            )}
          >
            <div className="flex items-start gap-3">
              {hasFailures ? (
                <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600 dark:text-emerald-300" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {hasFailures
                    ? `${failedCount} delivery${failedCount > 1 ? "ies" : ""} need review`
                    : "No failed deliveries detected"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {hasFailures
                    ? "Open the failed queue to inspect errors and retry saved payloads."
                    : "Notification events and delivery attempts are being tracked."}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant={hasFailures ? "destructive" : "outline"}
              className="flex-1"
              onClick={() => onNavigate("notifications-failed")}
            >
              Failed queue
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onNavigate("notifications-system")}
            >
              View center
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const NotificationMetric = ({ icon: Icon, label, value, loading, critical = false }) => (
  <div className="min-w-0 p-3">
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Icon className={cn("h-3.5 w-3.5", critical && "text-destructive")} />
      <span>{label}</span>
    </div>
    <p className={cn("mt-1 text-lg font-semibold text-foreground", critical && "text-destructive")}>
      {loading ? "..." : value.toLocaleString("en-US")}
    </p>
  </div>
);

export default SuperAdminDashboard;
