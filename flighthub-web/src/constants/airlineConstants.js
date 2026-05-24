// Airline status enum mapping
export const AIRLINE_STATUS = {
  ACTIVE: "Active",
  INACTIVE: "Inactive", 
  PENDING: "Pending",
  BANNED: "Banned"
}

// Airline status configuration for UI
export const AIRLINE_STATUS_CONFIG = {
  ACTIVE: { 
    color: "bg-green-100 text-green-800 border-green-200", 
    icon: "CheckCircle",
    description: "Airline is operational and accepting bookings"
  },
  INACTIVE: { 
    color: "bg-red-100 text-red-800 border-red-200", 
    icon: "AlertCircle",
    description: "Airline is not operational"
  },
  PENDING: { 
    color: "bg-yellow-100 text-yellow-800 border-yellow-200", 
    icon: "Clock",
    description: "Airline is pending approval"
  },
  BANNED: {
    color: "bg-red-100 text-red-800 border-red-200",
    icon: "XCircle",
    description: "Airline has been banned"
  }
}

// Country field removed: backend does not use this field

// Airline alliances
export const ALLIANCES = [
  "Star Alliance",
  "SkyTeam", 
  "Oneworld",
  "Independent"
]

// Validation rules
export const VALIDATION_RULES = {
  IATA_CODE: {
    required: true,
    minLength: 2,
    maxLength: 2,
    pattern: /^[A-Z]{2}$/,
    message: "IATA code must be exactly 2 uppercase letters"
  },
  ICAO_CODE: {
    required: true,
    minLength: 3,
    maxLength: 3,
    pattern: /^[A-Z]{3}$/,
    message: "ICAO code must be exactly 3 uppercase letters"
  },
  AIRLINE_NAME: {
    required: true,
    minLength: 2,
    maxLength: 100,
    message: "Airline name must be between 2 and 100 characters"
  },
  COUNTRY: {
    required: false,
    message: "Country (not required)"
  },
  WEBSITE: {
    required: false,
    pattern: /^https?:\/\/.+/,
    message: "Website must be a valid URL starting with http:// or https://"
  },
  LOGO_URL: {
    required: false,
    pattern: /^https?:\/\/.+\.(png|jpg|jpeg|gif|svg)$/i,
    message: "Logo URL must be a valid image URL"
  },
  SUPPORT_EMAIL: {
    required: false,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Please enter a valid email address"
  },
  SUPPORT_PHONE: {
    required: false,
    pattern: /^[\+]?[0-9\s\-\(\)]{10,}$/,
    message: "Please enter a valid phone number"
  },
  BAGGAGE_POLICY_ID: {
    required: false,
    pattern: /^\d+$/,
    message: "Baggage Policy ID must be a number"
  },
  HEADQUARTERS_CITY_ID: {
    required: false,
    pattern: /^\d+$/,
    message: "Headquarters City ID must be a number"
  }
}

// Form field configurations
export const FORM_FIELDS = {
  BASIC_INFO: [
    { name: "iataCode", label: "IATA Code", type: "text", required: true, maxLength: 2 },
    { name: "icaoCode", label: "ICAO Code", type: "text", required: true, maxLength: 3 },
    { name: "name", label: "Airline Name", type: "text", required: true },
    { name: "alias", label: "Alias", type: "text", required: false }
    // country field removed
  ],
  MEDIA_WEB: [
    { name: "logoUrl", label: "Logo URL", type: "url", required: false },
    { name: "website", label: "Website", type: "url", required: false }
  ],
  BUSINESS_INFO: [
    { name: "status", label: "Status", type: "select", required: true, options: Object.keys(AIRLINE_STATUS) },
    { name: "alliance", label: "Alliance", type: "select", required: false, options: ALLIANCES },
    { name: "baggagePolicyId", label: "Baggage Policy ID", type: "number", required: false },
    { name: "headquartersCityId", label: "Headquarters City ID", type: "number", required: false }
  ],
  SUPPORT_INFO: [
    { name: "supportEmail", label: "Support Email", type: "email", required: false },
    { name: "supportPhone", label: "Support Phone", type: "tel", required: false },
    { name: "supportHours", label: "Support Hours", type: "text", required: false }
  ]
}

// Default airline data structure
export const DEFAULT_AIRLINE_DATA = {
  iataCode: "",
  icaoCode: "",
  name: "",
  alias: "",
  // country removed
  logoUrl: "",
  website: "",
  status: "ACTIVE",
  alliance: "",
  baggagePolicyId: "",
  headquartersCityId: "",
  supportEmail: "",
  supportPhone: "",
  supportHours: ""
}

// API endpoints (for future integration)
export const API_ENDPOINTS = {
  AIRLINES: "/api/airlines",
  AIRLINE_BY_ID: (id) => `/api/airlines/${id}`,
  CREATE_AIRLINE: "/api/airlines",
  UPDATE_AIRLINE: (id) => `/api/airlines/${id}`,
  DELETE_AIRLINE: (id) => `/api/airlines/${id}`,
  AIRLINE_PROFILE: "/api/airlines/profile"
}

