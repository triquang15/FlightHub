import {
  Building2,
  MapPin,
  Plane,
  Users,
  BarChart3,
  Bell,
  Clock,
  XCircle,
  AlertTriangle,
  Globe,
  Mail,
  Activity,
  Zap,
  LayoutDashboard,
  Route,
  UserCog,
  UserRound,
  Gauge,
  MailCheck,
  Search,
  ClipboardList,
  Settings,
  ServerCog,
  Siren,
  PlugZap,
} from "lucide-react";

export const sidebarSections = [
  {
    id: "overview",
    title: "Command Center",
    icon: LayoutDashboard,
    color: "from-sky-500 to-cyan-500",
    items: [
      {
        id: "overview",
        label: "Platform Overview",
        icon: BarChart3,
        path: "/super-admin/dashboard",
      },
      {
        id: "search-data",
        label: "Search Data",
        icon: Search,
        path: "/super-admin/search-data",
      },
    ],
  },
  {
    id: "airlines",
    title: "Airline Registry",
    icon: Building2,
    color: "from-blue-500 to-sky-600",
    items: [
      {
        id: "airlines-list",
        label: "Airlines",
        icon: Building2,
        countKey: "totalAirlines",
        path: "/super-admin/airlines",
      },
      {
        id: "airlines-pending",
        label: "Approval Queue",
        icon: Clock,
        countKey: "pendingApprovals",
        path: "/super-admin/airlines/pending",
      },
      {
        id: "airlines-suspended",
        label: "Restricted",
        icon: XCircle,
        countKey: "restrictedAirlines",
        path: "/super-admin/airlines/suspended",
      },
    ],
  },
  {
    id: "airports",
    title: "Network Data",
    icon: MapPin,
    color: "from-green-500 to-emerald-500",
    items: [
      {
        id: "airports-list",
        label: "Airports",
        icon: MapPin,
        countKey: "totalAirports",
        path: "/super-admin/airports",
      },
      {
        id: "cities-list",
        label: "Cities",
        icon: Globe,
        countKey: "totalCities",
        path: "/super-admin/cities",
      },
      {
        id: "flights-all",
        label: "Flight Inventory",
        icon: Plane,
        path: "/super-admin/flights",
      },
    ],
  },

  {
    id: "identity",
    title: "Identity & Security",
    icon: UserCog,
    color: "from-violet-500 to-indigo-600",
    items: [
      {
        id: "users-list",
        label: "Accounts",
        icon: Users,
        countKey: "totalUsers",
        path: "/super-admin/users",
      },
      {
        id: "security-audit",
        label: "Security Audit",
        icon: ClipboardList,
        path: "/super-admin/security/audit",
      },
      {
        id: "account-profile",
        label: "My Account",
        icon: UserRound,
        path: "/super-admin/profile",
      },
    ],
  },

  {
    id: "reports",
    title: "Analytics",
    icon: Gauge,
    color: "from-teal-500 to-cyan-600",
    items: [
      {
        id: "airport-performance",
        label: "Airport Performance",
        icon: Building2,
        path: "/super-admin/airport-performance",
      },
      {
        id: "route-performance",
        label: "Route Performance",
        icon: Route,
        path: "/super-admin/route-performance",
      },
      {
        id: "airline-performance",
        label: "Airline Performance",
        icon: Plane,
        path: "/super-admin/airline-performance",
      },
    ],
  },
 
  {
    id: "notifications",
    title: "Notification Center",
    icon: Bell,
    color: "from-amber-500 to-orange-500",
    items: [
      {
        id: "notifications-system",
        label: "Operations",
        icon: Activity,
        countKey: "totalNotificationEvents",
        path: "/super-admin/notifications",
      },
      {
        id: "notifications-deliveries",
        label: "Delivery Logs",
        icon: MailCheck,
        countKey: "totalNotificationDeliveries",
        path: "/super-admin/notifications/deliveries",
      },
      {
        id: "notifications-failed",
        label: "Failed Deliveries",
        icon: AlertTriangle,
        countKey: "failedNotifications",
        path: "/super-admin/notifications/failed",
      },
      {
        id: "notifications-templates",
        label: "Templates",
        icon: Mail,
        path: "/super-admin/notifications/templates",
      },
      {
        id: "notifications-channels",
        label: "Channel Health",
        icon: Zap,
        path: "/super-admin/notifications/channels",
      },
    ],
  },
  {
    id: "operations",
    title: "Platform Controls",
    icon: ServerCog,
    color: "from-slate-500 to-slate-700",
    items: [
      {
        id: "operations-health",
        label: "Service Health",
        icon: Activity,
        path: "/super-admin/operations/health",
      },
      {
        id: "operations-incidents",
        label: "Incidents",
        icon: Siren,
        path: "/super-admin/operations/incidents",
      },
      {
        id: "configuration-settings",
        label: "Settings",
        icon: Settings,
        path: "/super-admin/configuration/settings",
      },
      {
        id: "configuration-integrations",
        label: "Integrations",
        icon: PlugZap,
        path: "/super-admin/configuration/integrations",
      },
    ],
  },
  
];

const resolveCount = (platformStats, countKey, fallbackCount) => {
  if (!countKey) {
    return Number.isFinite(fallbackCount) ? fallbackCount : null;
  }

  const count = platformStats?.[countKey];
  return Number.isFinite(count) ? count : null;
};

export const buildSidebarSections = (platformStats = {}) =>
  sidebarSections.map((section) => ({
    ...section,
    items: section.items.map((item) => ({
      ...item,
      count: resolveCount(platformStats, item.countKey, item.count),
    })),
  }));
