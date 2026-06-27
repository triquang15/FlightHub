// services/bookingService.js

import { encodeBase64,generateItineraryId,
  generateCrId,
  generateRKey,
  buildPaxString } from "@/utils/bookingUtils";


export const buildBookingPayload = ({
  flight,
  selectedFare,
  selectedCabinClass,
  numberOfTravellers,
}) => {
  if (!flight || !selectedFare || !selectedCabinClass) {
    throw new Error("Invalid booking data");
  }

  const itineraryId = generateItineraryId(flight);
  const crId = generateCrId();
  const rKey = generateRKey();
  const paxString = buildPaxString(numberOfTravellers);
  const cabinName = selectedCabinClass.name || selectedCabinClass.cabinClassType || selectedFare.cabinClass || "ECONOMY";
  const currency = selectedFare.currency || "USD";

  const searchFilter = {
    c: cabinName?.charAt(0) || "E",
    p: paxString,
    s: `${flight.departureAirport?.iataCode || flight.departureAirportCode}-${flight.arrivalAirport?.iataCode || flight.arrivalAirportCode}-${flight.departureDateTime || flight.departureTime}`,
    ItineraryId: itineraryId,
    PaxType: paxString,
    Intl: false,
    CabinClass: cabinName,
    Ccde: "US",
    ForwardFlowRequired: true,
    flightInstanceId: flight.id,
    flightId:flight.flightId
  };

  const xflt = encodeBase64(searchFilter);

  const bookingData = {
    flight: { ...flight, selectedCabinClass },
    fare: selectedFare,
    flightType: flight.flightType,
  };

  return {
    bookingData,
    queryParams: {
      itineraryId,
      cur: currency,
      ccde: "US",
      crId,
      rKey: encodeURIComponent(rKey),
      userCurrency: currency,
      xflt,
      numberOfTravellers: String(numberOfTravellers),
      cabinClass: cabinName,
      flightInstanceId: flight.id,
      flightId: flight.flightId,
      fareId: selectedFare.id,
    },
  };
};
