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
    title: "Platform Overview",
    icon: Crown,
    color: "from-purple-500 to-purple-600",
    items: [
      {
        id: "overview",
        label: "Dashboard",
        icon: BarChart3,
        count: null,
        path: "/super-admin/dashboard",
      },
    ],
  },
  {
    id: "airlines",
    title: "Airline Management",
    icon: Building2,
    color: "from-blue-500 to-blue-600",
    items: [
      {
        id: "airlines-list",
        label: "All Airlines",
        icon: Building2,
        count: 24,
        path: "/super-admin/airlines",
      },
      {
        id: "airlines-pending",
        label: "Pending Approval",
        icon: Clock,
        count: 3,
        path: "/super-admin/airlines/pending",
      },
      {
        id: "airlines-suspended",
        label: "Suspended",
        icon: XCircle,
        count: 2,
        path: "/super-admin/airlines/suspended",
      },
      {
        id: "airlines-compliance",
        label: "Compliance",
        icon: CheckCircle,
        count: 8,
        path: "/super-admin/airlines/compliance",
      },
      {
        id: "airlines-commission",
        label: "Commission Rules",
        icon: DollarSign,
        count: null,
        path: "/super-admin/airlines/commission",
      },
    ],
  },
  {
    id: "airports",
    title: "Airport & City",
    icon: MapPin,
    color: "from-green-500 to-emerald-500",
    items: [
      {
        id: "airports-list",
        label: "All Airports",
        icon: MapPin,
        count: 156,
        path: "/super-admin/airports",
      },
      {
        id: "cities-list",
        label: "Cities",
        icon: Globe,
        count: 89,
        path: "/super-admin/cities",
      },
      
    ],
  },

  {
    id: "users",
    title: "User Management",
    icon: Users,
    color: "from-indigo-500 to-indigo-600",
    items: [
      {
        id: "users-list",
        label: "All Users",
        icon: Users,
        count: null,
        path: "/super-admin/users",
      },
    ],
  },

  {
    id: "reports",
    title: "Reports & Analytics",
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
    title: "Notification Ops",
    icon: Bell,
    color: "from-yellow-500 to-orange-500",
    items: [
      {
        id: "notifications-system",
        label: "Overview",
        icon: Activity,
        count: null,
        path: "/super-admin/notifications",
      },
      {
        id: "notifications-deliveries",
        label: "Delivery Logs",
        icon: Database,
        count: null,
        path: "/super-admin/notifications/deliveries",
      },
      {
        id: "notifications-failed",
        label: "Failed & Retry",
        icon: AlertTriangle,
        count: null,
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
