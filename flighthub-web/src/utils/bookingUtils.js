// utils/bookingUtils.js

export const generateItineraryId = (flight) => {
  const departureCode = flight?.departureAirport?.iataCode || flight?.departureAirportCode || "ORIGIN";
  const arrivalCode = flight?.arrivalAirport?.iataCode || flight?.arrivalAirportCode || "DEST";
  const departureTime = flight?.departureDateTime || flight?.departureTime || flight?.scheduledDepartureTime || "TIME";

  return btoa(`${departureCode}-${arrivalCode}-${departureTime}`)
    .replace(/=/g, "")
    .substring(0, 40);
};

export const generateCrId = () => `cr-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

export const generateRKey = () =>
  `RKEY:${Math.random().toString(36).substring(2, 15)}:${Math.random()
    .toString(36)
    .substring(2, 15)}`;

export const buildPaxString = (adults = 1, children = 0, infants = 0) =>
  `A-${adults}_C-${children}_I-${infants}`;

export const encodeBase64 = (data) => btoa(JSON.stringify(data));
