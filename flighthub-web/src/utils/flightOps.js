export const CANONICAL_FLIGHT_STATUSES = [
  "SCHEDULED",
  "BOARDING",
  "DEPARTED",
  "ARRIVED",
  "CANCELLED",
];

export const NEXT_FLIGHT_STATUSES = {
  SCHEDULED: ["BOARDING", "CANCELLED"],
  BOARDING: ["DEPARTED", "CANCELLED"],
  DEPARTED: ["ARRIVED", "CANCELLED"],
  ARRIVED: [],
  CANCELLED: [],
};

export const ALL_OPERATING_DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

export const unwrapApiData = (response) => response?.data?.data ?? response?.data;

export const toLocalDateTimePayload = (value) => {
  if (!value) return value;
  return value.length === 16 ? `${value}:00` : value;
};

export const getApiErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.response?.data?.detail ||
  fallback;
