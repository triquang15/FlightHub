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

const encodeSegments = (segments = []) => {
  try {
    const normalizedSegments = segments
      .filter((segment) => segment.departureAirportId && segment.arrivalAirportId && segment.departureDate)
      .map((segment) => ({
        from: Number(segment.departureAirportId),
        to: Number(segment.arrivalAirportId),
        depart: formatSearchDateParam(segment.departureDate),
      }))

    return normalizedSegments.length ? btoa(JSON.stringify(normalizedSegments)) : ""
  } catch {
    return ""
  }
}

const decodeSegments = (value) => {
  if (!value) return []

  try {
    const parsed = JSON.parse(atob(value))
    if (!Array.isArray(parsed)) return []

    return parsed
      .map((segment) => ({
        departureAirportId: parseInt(segment.from || segment.departureAirportId, 10) || "",
        arrivalAirportId: parseInt(segment.to || segment.arrivalAirportId, 10) || "",
        departureDate: segment.depart || segment.departureDate ? new Date(segment.depart || segment.departureDate) : null,
      }))
      .filter((segment) => segment.departureAirportId && segment.arrivalAirportId && segment.departureDate)
  } catch {
    return []
  }
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
  if (tripType === "multiCity") {
    const encodedSegments = encodeSegments(searchData.segments)
    if (encodedSegments) params.set("legs", encodedSegments)
  }
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
  const segments = decodeSegments(searchParams.get("legs") || searchParams.get("segments"))

  return {
    departureAirportId: parseInt(searchParams.get("from") || searchParams.get("departureAirportId"), 10) || "",
    arrivalAirportId: parseInt(searchParams.get("to") || searchParams.get("arrivalAirportId"), 10) || "",
    departureDate: departureDate ? new Date(departureDate) : null,
    returnDate: returnDate ? new Date(returnDate) : null,
    passengers: parseInt(searchParams.get("pax") || searchParams.get("passengers") || searchParams.get("numberOfTravellers") || "1", 10),
    cabinClass: searchParams.get("cabin") || searchParams.get("cabinClass") || "ECONOMY",
    tripType,
    directOnly: searchParams.get("direct") === "1" || searchParams.get("directOnly") === "true",
    segments,
  }
}
