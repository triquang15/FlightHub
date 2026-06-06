import {
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  ChartNoAxesCombined,
  CircleDollarSign,
  Luggage,
  Package,
  Plane,
  PlaneTakeoff,
  ShieldCheck,
  Tags,
  UtensilsCrossed,
  Users,
  FileClock,
  Plug,
  WalletCards,
} from "lucide-react";

export const sidebarSections = [
  {
    id: "overview",
    title: "Overview",
    icon: BarChart3,
    items: [
      {
        id: "overview",
        label: "Operations Overview",
        icon: BarChart3,
        path: "/airline/dashboard",
      },
    ],
  },
  {
    id: "fleet",
    title: "Fleet",
    icon: PlaneTakeoff,
    items: [
      {
        id: "aircraft",
        label: "Aircraft",
        icon: PlaneTakeoff,
        path: "/airline/aircraft",
      },
    ],
  },
  {
    id: "operations",
    title: "Flight Operations",
    icon: Plane,
    items: [
      {
        id: "flights",
        label: "Flights",
        icon: Plane,
        path: "/airline/flights",
      },
      {
        id: "schedules",
        label: "Schedules",
        icon: CalendarDays,
        path: "/airline/schedules",
      },
      {
        id: "instances",
        label: "Flight Instances",
        icon: BookOpenCheck,
        path: "/airline/instances",
      },
    ],
  },
  {
    id: "commercial",
    title: "Commercial",
    icon: CircleDollarSign,
    items: [
      {
        id: "fare-rules",
        label: "Fare Rules",
        icon: CircleDollarSign,
        path: "/airline/fare-rules",
      },
      {
        id: "baggage-policies",
        label: "Baggage Policies",
        icon: Luggage,
        path: "/airline/baggage-policies",
      },
      {
        id: "ancillaries-catalog",
        label: "Ancillaries",
        icon: Package,
        path: "/airline/ancillaries",
      },
      {
        id: "meals",
        label: "Meals",
        icon: UtensilsCrossed,
        path: "/airline/meals",
      },
      {
        id: "coupons",
        label: "Coupons",
        icon: Tags,
        path: "/airline/coupons",
      },
    ],
  },
  {
    id: "customers",
    title: "Customer Operations",
    icon: Users,
    items: [
      {
        id: "bookings-list",
        label: "Bookings",
        icon: Users,
        path: "/airline/bookings",
      },
      {
        id: "bookings-statistics",
        label: "Booking Analytics",
        icon: ChartNoAxesCombined,
        path: "/airline/bookings/statistics",
      },
      {
        id: "transactions",
        label: "Settlements",
        icon: WalletCards,
        path: "/airline/settlements",
      },
    ],
  },
  {
    id: "insights",
    title: "Insights",
    icon: ChartNoAxesCombined,
    items: [
      {
        id: "route-performance",
        label: "Route Performance",
        icon: ChartNoAxesCombined,
        path: "/airline/route-performance",
      },
      {
        id: "airport-performance",
        label: "Airport Performance",
        icon: BarChart3,
        path: "/airline/airport-performance",
      },
    ],
  },
  {
    id: "administration",
    title: "Administration",
    icon: ShieldCheck,
    items: [
      {
        id: "airline-profile",
        label: "Airline Profile",
        icon: ShieldCheck,
        path: "/airline/profile",
      },
      {
        id: "team-access",
        label: "Team & Access",
        icon: Users,
        path: "/airline/administration/team",
      },
      {
        id: "activity-log",
        label: "Activity Log",
        icon: FileClock,
        path: "/airline/administration/activity",
      },
      {
        id: "integrations",
        label: "Integrations",
        icon: Plug,
        path: "/airline/administration/integrations",
      },
    ],
  },
];
