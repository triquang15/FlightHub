const tripToUrl = {
  oneWay: "oneway",
  roundTrip: "round",
  multiCity: "multi",
}

const tripFromUrl = {
  oneway: "oneWay",
  oneWay: "oneWay",
  round: "roundTrip",
  roundTrip: "roundTrip",
  multi: "multiCity",
  multiCity: "multiCity",
}

export const formatSearchDateParam = (date) => {
  if (!date) return ""
  if (typeof date === "string") return date

  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60 * 1000).toISOString().split("T")[0]
}

export const buildTravelerSearchParams = (searchData = {}) => {
  const params = new URLSearchParams()
  const tripType = searchData.tripType || "oneWay"
  const passengers = searchData.passengers || searchData.numberOfTravellers || 1
  const cabinClass = searchData.cabinClass || "ECONOMY"
  const departureDate = formatSearchDateParam(searchData.departureDate)
  const returnDate = formatSearchDateParam(searchData.returnDate)

  if (searchData.departureAirportId) params.set("from", String(searchData.departureAirportId))
  if (searchData.arrivalAirportId) params.set("to", String(searchData.arrivalAirportId))
  if (departureDate) params.set("depart", departureDate)
  if (returnDate && tripType === "roundTrip") params.set("return", returnDate)
  if (tripType !== "oneWay") params.set("trip", tripToUrl[tripType] || tripType)
  if (Number(passengers) !== 1) params.set("pax", String(passengers))
  if (cabinClass !== "ECONOMY") params.set("cabin", cabinClass)
  if (searchData.directOnly) params.set("direct", "1")

  return params
}

export const readTravelerSearchParams = (searchParams) => {
  const tripParam = searchParams.get("trip") || searchParams.get("tripType") || "oneway"
  const tripType = tripFromUrl[tripParam] || "oneWay"
  const departureDate = searchParams.get("depart") || searchParams.get("departureDate")
  const returnDate = searchParams.get("return") || searchParams.get("returnDate")

  return {
    departureAirportId: parseInt(searchParams.get("from") || searchParams.get("departureAirportId"), 10) || "",
    arrivalAirportId: parseInt(searchParams.get("to") || searchParams.get("arrivalAirportId"), 10) || "",
    departureDate: departureDate ? new Date(departureDate) : null,
    returnDate: returnDate ? new Date(returnDate) : null,
    passengers: parseInt(searchParams.get("pax") || searchParams.get("passengers") || searchParams.get("numberOfTravellers") || "1", 10),
    cabinClass: searchParams.get("cabin") || searchParams.get("cabinClass") || "ECONOMY",
    tripType,
    directOnly: searchParams.get("direct") === "1" || searchParams.get("directOnly") === "true",
  }
}
