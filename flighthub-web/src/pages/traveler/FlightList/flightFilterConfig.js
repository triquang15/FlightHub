export const PRICE_LIMITS = { min: 0, max: 5000 };
export const MAX_DURATION = 1440;

export const createDefaultFlightFilters = () => ({
  airlines: [],
  priceRange: { ...PRICE_LIMITS },
  departureTimeRange: "any",
  arrivalTimeRange: "any",
  maxDuration: MAX_DURATION,
});
