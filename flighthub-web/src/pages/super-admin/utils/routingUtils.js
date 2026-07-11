/**
 * Super Admin Dashboard Routing Utilities
 *
 * This file contains utility functions for handling navigation and section detection
 * in the Super Admin dashboard. It provides a centralized configuration for all
 * route mappings and section identification logic.
 */

// Route mapping configuration for all Super Admin sections
export const ROUTE_MAP = {
  // Overview
  overview: "/super-admin",

  // Airlines
  "airlines-list": "/super-admin/airlines",
  "airlines-pending": "/super-admin/airlines?filter=pending",
  "airlines-suspended": "/super-admin/airlines?filter=suspended",
  "airlines-compliance": "/super-admin/airlines?tab=compliance",
  "airlines-commission": "/super-admin/airlines?tab=commission",

  // Airports & Cities
  "airports-list": "/super-admin/airports",
  "cities-list": "/super-admin/cities",
  "airports-codes": "/super-admin/airports?tab=codes",
  "airports-terminals": "/super-admin/airports?tab=terminals",
  "airports-timezones": "/super-admin/airports?tab=timezones",

  // Flights
  "flights-all": "/super-admin/flights",
  "flights-monitoring": "/super-admin/flights?tab=monitoring",
  "flights-delays": "/super-admin/flights?tab=delays",
  "flights-override": "/super-admin/flights?tab=override",
  "flights-availability": "/super-admin/flights?tab=availability",

  // Bookings
  "bookings-all": "/super-admin/bookings",
  "bookings-disputes": "/super-admin/bookings?tab=disputes",
  "bookings-refunds": "/super-admin/bookings?tab=refunds",
  "bookings-fraud": "/super-admin/bookings?tab=fraud",
  "bookings-logs": "/super-admin/bookings?tab=logs",

  // Users
  "users-customers": "/super-admin/users?type=customers",
  "users-agents": "/super-admin/users?type=agents",
  "users-agencies": "/super-admin/users?type=agencies",
  "users-suspended": "/super-admin/users?tab=suspended",
  "users-policies": "/super-admin/users?tab=policies",
  "access-roles": "/super-admin/access/roles",
  "access-audit": "/super-admin/access/audit",
  "account-profile": "/super-admin/profile",

  // Finance UI shells
  "finance-transactions": "/super-admin/finance/transactions",
  "finance-settlements": "/super-admin/finance/settlements",
  "finance-disputes": "/super-admin/finance/disputes",

  // Financial
  "financial-fees": "/super-admin/financial?tab=fees",
  "financial-commissions": "/super-admin/financial?tab=commissions",
  "financial-transactions": "/super-admin/financial?tab=transactions",
  "financial-payouts": "/super-admin/financial?tab=payouts",
  "financial-gateways": "/super-admin/financial?tab=gateways",
  "financial-chargebacks": "/super-admin/financial?tab=chargebacks",

  // Reports
  "reports-airlines": "/super-admin/reports?type=airlines",
  "reports-airports": "/super-admin/reports?type=airports",
  "reports-customers": "/super-admin/reports?type=customers",
  "reports-fraud": "/super-admin/reports?type=fraud",
  "reports-revenue": "/super-admin/reports?type=revenue",
  "reports-custom": "/super-admin/reports?tab=custom",
  "airport-performance": "/super-admin/airport-performance",
  "airline-performance": "/super-admin/airline-performance",
  "route-performance": "/super-admin/route-performance",

  // System
  "system-global": "/super-admin/system",
  "system-currencies": "/super-admin/system?tab=currencies",
  "system-languages": "/super-admin/system?tab=languages",
  "system-loyalty": "/super-admin/system?tab=loyalty",
  "system-api": "/super-admin/system?tab=api",
  "system-integrations": "/super-admin/system?tab=integrations",

  // Notifications
  "notifications-system": "/super-admin/notifications",
  "notifications-deliveries": "/super-admin/notifications/deliveries",
  "notifications-events": "/super-admin/notifications/events",
  "notifications-failed": "/super-admin/notifications/failed",
  "notifications-templates": "/super-admin/notifications/templates",
  "notifications-channels": "/super-admin/notifications/channels",
  "operations-observability": "/super-admin/operations/observability",
  "operations-service-health": "/super-admin/operations/health",
  "operations-incidents": "/super-admin/operations/incidents",
  "configuration-settings": "/super-admin/configuration/settings",
  "configuration-integrations": "/super-admin/configuration/integrations",

  // Security
  "security-rbac": "/super-admin/security?tab=rbac",
  "security-kyc": "/super-admin/security?tab=kyc",
  "security-gdpr": "/super-admin/security?tab=gdpr",
  "security-pci": "/super-admin/security?tab=pci",
  "security-audit": "/super-admin/security/audit",
  "security-threats": "/super-admin/security?tab=threats",
};

// Section title mapping
export const SECTION_TITLES = {
  overview: "Platform Overview",
  // Airlines
  "airlines-list": "All Airlines",
  "airlines-pending": "Pending Airlines",
  "airlines-suspended": "Suspended Airlines",
  "airlines-compliance": "Airline Compliance",
  "airlines-commission": "Commission Management",
  // Airports & Cities
  "airports-list": "Airport Management",
  "cities-list": "City Management",
  "airports-codes": "IATA/ICAO Codes",
  "airports-terminals": "Terminals & Gates",
  "airports-timezones": "Airport Time Zones",
  // Flights
  "flights-all": "Flight Inventory",
  "flights-monitoring": "Live Flight Monitoring",
  "flights-delays": "Delays & Issues",
  "flights-override": "Schedule Override",
  "flights-availability": "Flight Availability",
  // Bookings
  "bookings-all": "Booking Management",
  "bookings-disputes": "Booking Disputes",
  "bookings-refunds": "Refund Management",
  "bookings-fraud": "Fraud Detection",
  "bookings-logs": "System Logs",
  // Users
  "users-customers": "Customer Management",
  "users-agents": "Travel Agents",
  "users-agencies": "Agency Management",
  "users-suspended": "Suspended Users",
  "users-policies": "User Policies",
  "access-roles": "Roles & Permissions",
  "access-audit": "Audit Logs",
  "account-profile": "Account Profile",
  "finance-transactions": "Platform Transactions",
  "finance-settlements": "Airline Settlements",
  "finance-disputes": "Refunds & Chargebacks",
  // Financial
  "financial-fees": "Service Fees",
  "financial-commissions": "Commission Management",
  "financial-transactions": "Transaction History",
  "financial-payouts": "Payout Management",
  "financial-gateways": "Payment Gateways",
  "financial-chargebacks": "Chargeback Management",
  // Reports
  "reports-airlines": "Airline Performance",
  "reports-airports": "Airport Analytics",
  "reports-customers": "Customer Insights",
  "reports-fraud": "Fraud Monitoring",
  "airport-performance": "Airport Performance",
  "airline-performance": "Airline Performance",
  "route-performance": "Route Performance",
  "reports-revenue": "Revenue Reports",
  "reports-custom": "Custom Reports",
  // System
  "system-global": "Global Settings",
  "system-currencies": "Currency Management",
  "system-languages": "Language Settings",
  "system-loyalty": "Loyalty Programs",
  "system-api": "API Management",
  "system-integrations": "OTA Integrations",
  // Notifications
  "notifications-system": "Notification Operations",
  "notifications-deliveries": "Delivery Logs",
  "notifications-events": "Notification Events",
  "notifications-failed": "Failed & Retry Queue",
  "notifications-templates": "Notification Templates",
  "notifications-channels": "Channel Health",
  "operations-observability": "Observability",
  "operations-service-health": "Service Health",
  "operations-incidents": "Incident Management",
  "configuration-settings": "Platform Settings",
  "configuration-integrations": "Integrations",
  // Security
  "security-rbac": "Role Management",
  "security-kyc": "KYC Compliance",
  "security-gdpr": "GDPR Compliance",
  "security-pci": "PCI Compliance",
  "security-audit": "Audit Logs",
  "security-threats": "Threat Monitoring",
};

// Section description mapping
export const SECTION_DESCRIPTIONS = {
  overview: "Complete platform oversight and management",
  // Airlines
  "airlines-list": "Manage all registered airlines on the platform",
  "airlines-pending": "Review and approve pending airline applications",
  "airlines-suspended": "Manage suspended airline accounts",
  "airlines-compliance": "Monitor airline compliance and certifications",
  "airlines-commission": "Configure commission rules and rates",
  // Airports & Cities
  "airports-list": "Manage airport data and infrastructure",
  "cities-list": "Maintain city and destination information",
  "airports-codes": "Manage IATA and ICAO airport codes",
  "airports-terminals": "Configure terminal and gate information",
  "airports-timezones": "Manage airport timezone settings",
  // Flights
  "flights-all": "Monitor and oversee all flight operations",
  "flights-monitoring": "Real-time flight tracking and status updates",
  "flights-delays": "Manage flight delays and operational issues",
  "flights-override": "Override flight schedules and configurations",
  "flights-availability": "Monitor seat availability across all flights",
  // Bookings
  "bookings-all": "System-wide booking management and oversight",
  "bookings-disputes": "Handle booking disputes and resolutions",
  "bookings-refunds": "Process and manage refund requests",
  "bookings-fraud": "Monitor and prevent fraudulent booking activities",
  "bookings-logs": "View detailed booking system logs",
  // Users
  "users-customers": "Manage customer accounts and profiles",
  "users-agents": "Oversee travel agent accounts and permissions",
  "users-agencies": "Manage travel agency partnerships",
  "users-suspended": "Review and manage suspended user accounts",
  "users-policies": "Configure global user policies and terms",
  "access-roles": "Define roles, permission scopes, and privileged access",
  "access-audit": "Review administrative and security-sensitive platform events",
  "account-profile": "Manage your administrator identity and sign-in security",
  "finance-transactions": "Monitor payment activity across the platform",
  "finance-settlements": "Track settlement cycles and payable airline balances",
  "finance-disputes": "Manage refunds, chargebacks, and financial exceptions",
  // Financial
  "financial-fees": "Configure platform service fees and charges",
  "financial-commissions": "Manage commission structures and payments",
  "financial-transactions": "Monitor all financial transactions",
  "financial-payouts": "Process and track payouts to partners",
  "financial-gateways": "Manage payment gateway integrations",
  "financial-chargebacks": "Handle chargeback cases and disputes",
  // Reports
  "reports-airlines": "Analyze airline performance metrics",
  "reports-airports": "Review airport usage and analytics",
  "airline-performance": "Analyze airline performance system-wide",
  "airport-performance": "Track airport performance across all airlines",
  "route-performance": "Analyze route performance system-wide",
  "reports-customers": "Gain insights into customer behavior",
  "reports-fraud": "Monitor fraud detection and prevention",
  "reports-revenue": "Track revenue streams and financial performance",
  "reports-custom": "Create and manage custom report templates",
  // System
  "system-global": "Configure global platform settings",
  "system-currencies": "Manage supported currencies and exchange rates",
  "system-languages": "Configure supported languages and localization",
  "system-loyalty": "Manage loyalty program configurations",
  "system-api": "Control API access and authentication",
  "system-integrations": "Manage third-party integrations and OTAs",
  // Notifications
  "notifications-system": "Monitor notification events, deliveries, channels, and backend readiness",
  "notifications-deliveries": "Review tracked notification_events and notification_deliveries records",
  "notifications-events": "Inspect source business events recorded by notification-service",
  "notifications-failed": "Investigate failed deliveries, retries, and DLQ-bound events",
  "notifications-templates": "Review transactional email templates used by notification-service",
  "notifications-channels": "Monitor email, SMS, Kafka, Redis, and idempotency health",
  "operations-observability": "Connect Grafana, Prometheus, Loki, and Alertmanager for platform logs and metrics",
  "operations-service-health": "Monitor platform services and their dependencies",
  "operations-incidents": "Coordinate and resolve platform-impacting incidents",
  "configuration-settings": "Manage controlled global platform configuration",
  "configuration-integrations": "Manage external providers and connection health",
  // Security
  "security-rbac": "Manage user roles and access permissions",
  "security-kyc": "Monitor Know Your Customer compliance",
  "security-gdpr": "Ensure GDPR compliance and data protection",
  "security-pci": "Maintain PCI DSS compliance standards",
  "security-audit": "Review security audit logs and activities",
  "security-threats": "Monitor and respond to security threats",
};

/**
 * Determines the active section ID based on the current pathname and URL parameters
 * @param {string} pathname - The current pathname
 * @param {URLSearchParams} urlParams - URL search parameters
 * @returns {string} The active section ID
 */
export const getActiveSectionFromPath = (pathname, urlParams = null) => {
  const path = pathname.replace("/super-admin", "") || "/";

  // Use provided URLSearchParams or create new one from current location
  const params = urlParams || new URLSearchParams(window.location.search);

  // For overview/dashboard
  if (path === "/" || path === "/overview") return "overview";

  // Path section mapping with parameter-based sub-section detection
  const pathSectionMap = {
    "/profile": () => "account-profile",
    "/airlines": () => {
      const filter = params.get("filter");
      const tab = params.get("tab");
      if (filter === "pending") return "airlines-pending";
      if (filter === "suspended") return "airlines-suspended";
      if (tab === "compliance") return "airlines-compliance";
      if (tab === "commission") return "airlines-commission";
      return "airlines-list";
    },
    "/airports": () => {
      const tab = params.get("tab");
      if (tab === "codes") return "airports-codes";
      if (tab === "terminals") return "airports-terminals";
      if (tab === "timezones") return "airports-timezones";
      return "airports-list";
    },
    "/cities": () => "cities-list",
    "/flights": () => {
      const tab = params.get("tab");
      if (tab === "monitoring") return "flights-monitoring";
      if (tab === "delays") return "flights-delays";
      if (tab === "override") return "flights-override";
      if (tab === "availability") return "flights-availability";
      return "flights-all";
    },
    "/bookings": () => {
      const tab = params.get("tab");
      if (tab === "disputes") return "bookings-disputes";
      if (tab === "refunds") return "bookings-refunds";
      if (tab === "fraud") return "bookings-fraud";
      if (tab === "logs") return "bookings-logs";
      return "bookings-all";
    },
    "/users": () => {
      const type = params.get("type");
      const tab = params.get("tab");
      if (type === "customers") return "users-customers";
      if (type === "agents") return "users-agents";
      if (type === "agencies") return "users-agencies";
      if (tab === "suspended") return "users-suspended";
      if (tab === "policies") return "users-policies";
      return "users-customers";
    },
    "/financial": () => {
      const tab = params.get("tab");
      if (tab === "fees") return "financial-fees";
      if (tab === "commissions") return "financial-commissions";
      if (tab === "transactions") return "financial-transactions";
      if (tab === "payouts") return "financial-payouts";
      if (tab === "gateways") return "financial-gateways";
      if (tab === "chargebacks") return "financial-chargebacks";
      return "financial-fees";
    },
    "/reports": () => {
      const type = params.get("type");
      const tab = params.get("tab");
      if (type === "airlines") return "reports-airlines";
      if (type === "airports") return "reports-airports";
      if (type === "customers") return "reports-customers";
      if (type === "fraud") return "reports-fraud";
      if (type === "revenue") return "reports-revenue";
      if (tab === "custom") return "reports-custom";
      return "reports-airlines";
    },
    "/system": () => {
      const tab = params.get("tab");
      if (tab === "currencies") return "system-currencies";
      if (tab === "languages") return "system-languages";
      if (tab === "loyalty") return "system-loyalty";
      if (tab === "api") return "system-api";
      if (tab === "integrations") return "system-integrations";
      return "system-global";
    },
    "/notifications": () => {
      if (path.includes("/notifications/deliveries")) return "notifications-deliveries";
      if (path.includes("/notifications/events")) return "notifications-events";
      if (path.includes("/notifications/failed")) return "notifications-failed";
      if (path.includes("/notifications/templates")) return "notifications-templates";
      if (path.includes("/notifications/channels")) return "notifications-channels";
      return "notifications-system";
    },
    "/access/roles": () => "access-roles",
    "/access/audit": () => "access-audit",
    "/finance/transactions": () => "finance-transactions",
    "/finance/settlements": () => "finance-settlements",
    "/finance/disputes": () => "finance-disputes",
    "/operations/observability": () => "operations-observability",
    "/operations/health": () => "operations-service-health",
    "/operations/incidents": () => "operations-incidents",
    "/configuration/settings": () => "configuration-settings",
    "/configuration/integrations": () => "configuration-integrations",
   
    "/airline-performance": () => "airline-performance",
    "/airport-performance": () => "airport-performance",
    "/route-performance": () => "route-performance",
  };

  // Find matching path and return section ID
  for (const [pathPattern, getSectionId] of Object.entries(pathSectionMap)) {
    if (path.startsWith(pathPattern)) {
      return getSectionId();
    }
  }

  return "overview";
};

/**
 * Gets the section title for a given section ID
 * @param {string} sectionId - The section ID
 * @returns {string} The section title
 */
export const getSectionTitle = (sectionId) => {
  return SECTION_TITLES[sectionId] || "Super Admin Dashboard";
};

/**
 * Gets the section description for a given section ID
 * @param {string} sectionId - The section ID
 * @returns {string} The section description
 */
export const getSectionDescription = (sectionId) => {
  return SECTION_DESCRIPTIONS[sectionId] || "Comprehensive platform management and oversight";
};

/**
 * Navigates to a specific section by section ID
 * @param {string} sectionId - The section ID to navigate to
 * @param {function} navigate - React Router navigate function
 */
export const navigateToSection = (sectionId, navigate) => {
  const route = ROUTE_MAP[sectionId];

  if (route) {
    navigate(route);
  } else {
    // Fallback to main section if specific route not found
    const mainSection = sectionId.split('-')[0];
    const fallbackRoute = `/super-admin/${mainSection === 'overview' ? '' : mainSection}`;
    navigate(fallbackRoute);
  }
};

/**
 * Gets the main section name from a section ID (e.g., "airlines-list" -> "airlines")
 * @param {string} sectionId - The section ID
 * @returns {string} The main section name
 */
export const getMainSection = (sectionId) => {
  if (sectionId === "overview") return "overview";
  if (sectionId === "cities-list") return "airports"; // Cities are part of airports
  return sectionId.split('-')[0];
};
