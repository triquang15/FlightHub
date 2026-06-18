import {
  Building2,
  MapPin,
  Plane,
  Users,
  DollarSign,
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
  ShieldCheck,
  Route,
  UserCog,
  UserRound,
  Gauge,
  MailCheck,
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
    ],
  },
  {
    id: "airlines",
    title: "Airline Operations",
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
      {
        id: "airlines-compliance",
        label: "Compliance",
        icon: ShieldCheck,
        path: "/super-admin/airlines/compliance",
      },
      {
        id: "airlines-commission",
        label: "Commissions",
        icon: DollarSign,
        path: "/super-admin/airlines/commission",
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
    id: "users",
    title: "Identity & Access",
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
    title: "Platform Operations",
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
