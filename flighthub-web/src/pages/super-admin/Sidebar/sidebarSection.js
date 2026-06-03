import {
  Building2,
  MapPin,
  Plane,
  Users,
  DollarSign,
  BarChart3,
  Bell,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Globe,
  Mail,
  Database,
  Activity,
  Zap,
  Crown,
} from "lucide-react";

export const sidebarSections = [
  {
    id: "overview",
    title: "FlightHub Overview",
    icon: Crown,
    color: "from-purple-500 to-purple-600",
    items: [
      {
        id: "overview",
        label: "Control Center",
        icon: BarChart3,
        count: null,
        path: "/super-admin/dashboard",
      },
    ],
  },
  {
    id: "airlines",
    title: "Airline Partners",
    icon: Building2,
    color: "from-blue-500 to-blue-600",
    items: [
      {
        id: "airlines-list",
        label: "Airline Partners",
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
        label: "Restricted Airlines",
        icon: XCircle,
        countKey: "restrictedAirlines",
        path: "/super-admin/airlines/suspended",
      },
      {
        id: "airlines-compliance",
        label: "Compliance Review",
        icon: CheckCircle,
        count: null,
        path: "/super-admin/airlines/compliance",
      },
      {
        id: "airlines-commission",
        label: "Commission Setup",
        icon: DollarSign,
        count: null,
        path: "/super-admin/airlines/commission",
      },
    ],
  },
  {
    id: "airports",
    title: "Location Data",
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
        label: "Cities & Markets",
        icon: Globe,
        countKey: "totalCities",
        path: "/super-admin/cities",
      },
    ],
  },

  {
    id: "users",
    title: "Accounts & Access",
    icon: Users,
    color: "from-indigo-500 to-indigo-600",
    items: [
      {
        id: "users-list",
        label: "User Accounts",
        icon: Users,
        countKey: "totalUsers",
        path: "/super-admin/users",
      },
    ],
  },

  {
    id: "reports",
    title: "Performance Analytics",
    icon: BarChart3,
    color: "from-pink-500 to-rose-500",
    items: [
      {
        id: "airport-performance",
        label: "Airport Performance",
        icon: Building2,
        count: null,
        path: "/super-admin/airport-performance",
      },
      {
        id: "route-performance",
        label: "Route Performance",
        icon: ArrowRight,
        count: null,
        path: "/super-admin/route-performance",
      }
      ,
      {
        id: "airline-performance",
        label: "Airline Performance",
        icon: Plane,
        count: null,
        path: "/super-admin/airline-performance",
      }
    ],
  },
 
  {
    id: "notifications",
    title: "Notification Center",
    icon: Bell,
    color: "from-yellow-500 to-orange-500",
    items: [
      {
        id: "notifications-system",
        label: "Operations Overview",
        icon: Activity,
        countKey: "totalNotificationEvents",
        path: "/super-admin/notifications",
      },
      {
        id: "notifications-deliveries",
        label: "Delivery Logs",
        icon: Database,
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
        count: null,
        path: "/super-admin/notifications/templates",
      },
      {
        id: "notifications-channels",
        label: "Channel Health",
        icon: Zap,
        count: null,
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
