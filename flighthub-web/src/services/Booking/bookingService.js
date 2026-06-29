// services/bookingService.js

import { encodeBase64,generateItineraryId,
  generateCrId,
  generateRKey,
  buildPaxString } from "@/utils/bookingUtils";

const airportCode = (airport, fallback) => airport?.iataCode || fallback || "";
const airportName = (airport, fallback) => airport?.name || airport?.cityName || fallback || "";

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
  const departureCode = airportCode(flight.departureAirport, flight.departureAirportCode);
  const arrivalCode = airportCode(flight.arrivalAirport, flight.arrivalAirportCode);
  const departureDateTime = flight.departureDateTime || flight.departureTime;
  const flightInstanceId = flight.id || flight.flightInstanceId;
  const flightDefinitionId = flight.flightId || flight.id;
  const cabinClassId = selectedCabinClass.id || selectedFare.cabinClassId;

  const searchFilter = {
    c: cabinName?.charAt(0) || "E",
    p: paxString,
    s: `${departureCode}-${arrivalCode}-${departureDateTime}`,
    ItineraryId: itineraryId,
    PaxType: paxString,
    Intl: false,
    CabinClass: cabinName,
    Ccde: "US",
    ForwardFlowRequired: true,
    flightInstanceId,
    flightId: flightDefinitionId,
    fareId: selectedFare.id,
    cabinClassId,
  };

  const xflt = encodeBase64(searchFilter);

  const bookingData = {
    flight: {
      ...flight,
      selectedCabinClass,
      departureAirportCode: departureCode,
      arrivalAirportCode: arrivalCode,
      departureAirportName: airportName(flight.departureAirport, flight.departureAirportName),
      arrivalAirportName: airportName(flight.arrivalAirport, flight.arrivalAirportName),
      departureDateTime,
    },
    fare: selectedFare,
    flightType: flight.flightType,
    numberOfTravellers,
  };

  return {
    bookingData,
    queryParams: {
      itineraryId,
      cur: currency,
      ccde: "US",
      crId,
      rKey,
      userCurrency: currency,
      xflt,
      numberOfTravellers: String(numberOfTravellers),
      cabinClass: cabinName,
      flightInstanceId,
      flightId: flightDefinitionId,
      fareId: selectedFare.id,
      cabinClassId,
    },
  };
};
