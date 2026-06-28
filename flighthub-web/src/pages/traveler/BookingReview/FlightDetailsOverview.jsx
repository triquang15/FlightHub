import { motion } from "framer-motion";
import { ArrowRight, Calendar, Clock, MapPin, Plane, ShieldCheck, Ticket } from "lucide-react";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { getFlightInstanceById } from "@/Redux/flightInstance/flightInstanceThunk";
import { useSelector } from "react-redux";

const FlightDetailsOverview = ({ flightData }) => {
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { flightInstance: storeFlightInstance } = useSelector((state) => state.flightInstance);
  const flightInstance = flightData || storeFlightInstance;

  useEffect(() => {
    const cabinClass = searchParams.get("cabinClass");
    const flightInstanceId = searchParams.get("flightInstanceId");

    if (!flightData && flightInstanceId && cabinClass) {
      dispatch(
        getFlightInstanceById(flightInstanceId)
      );
    }
  }, [dispatch, flightData, searchParams]);

  if (!flightInstance) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900/90">
        <div className="flex h-40 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-indigo-600 dark:border-indigo-300"></div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Loading itinerary...</p>
          </div>
        </div>
      </div>
    );
  }

  // Helper function to format date and time
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return { date: "N/A", time: "N/A" };
    const date = new Date(dateTimeString);
    const timeStr = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const dateStr = date.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    return { date: dateStr, time: timeStr };
  };

  const departure = formatDateTime(flightInstance.departureDateTime);
  const arrival = formatDateTime(flightInstance.arrivalDateTime);
  const duration = flightInstance.duration || "N/A";

  const departureAirport = flightInstance.departureAirport || flightInstance.flight?.departureAirport || {};
  const arrivalAirport = flightInstance.arrivalAirport || flightInstance.flight?.arrivalAirport || {};
  const departureCode = departureAirport.iataCode || flightInstance.departureAirportCode || searchParams.get("from") || "N/A";
  const arrivalCode = arrivalAirport.iataCode || flightInstance.arrivalAirportCode || searchParams.get("to") || "N/A";
  const departureName = departureAirport.name || departureAirport.city?.name || flightInstance.departureAirportName || "Departure airport";
  const arrivalName = arrivalAirport.name || arrivalAirport.city?.name || flightInstance.arrivalAirportName || "Arrival airport";

  const cabinClass = flightInstance.cabin?.cabinClassType || searchParams.get("cabinClass") || "ECONOMY";
  const stops = flightInstance.stops || 0;
  const airlineName = flightInstance?.airlineName || flightInstance?.flight?.airlineName || "FlightHub airline";
  const flightNumber = flightInstance?.flightNumber || flightInstance?.flight?.flightNumber || `Flight ${flightInstance?.flightId || ""}`.trim();
  const aircraftName = flightInstance?.aircraftModal || flightInstance?.aircraftModel || flightInstance?.flight?.aircraftModel || "Aircraft";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-white/10 dark:bg-slate-900/90 dark:shadow-black/20"
    >
      <div className="border-b border-slate-200 bg-slate-50/80 p-6 dark:border-white/10 dark:bg-slate-950/40">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-white text-sm font-bold text-indigo-700 dark:border-white/10 dark:bg-slate-900 dark:text-indigo-200">
              {flightInstance?.airlineLogo ? (
                <img
                  src={flightInstance.airlineLogo}
                  alt={airlineName}
                  className="h-8 w-8 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.parentElement.textContent = airlineName?.slice(0, 2)?.toUpperCase() || "FH";
                  }}
                />
              ) : (
                airlineName?.slice(0, 2)?.toUpperCase() || "FH"
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
                Selected itinerary
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">
                {departureCode} to {arrivalCode}
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {airlineName} · {flightNumber} · {aircraftName}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 sm:justify-end">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              {stops === 0 ? "Non-stop" : `${stops} stop${stops > 1 ? "s" : ""}`}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-200">
              <Ticket className="h-3.5 w-3.5" />
              {cabinClass}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_8.5rem_minmax(0,1fr)] xl:items-center">
          <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/40">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <Calendar className="h-4 w-4" />
              Departure · {departure.date}
            </div>
            <p className="text-3xl font-bold text-slate-950 dark:text-white">{departure.time}</p>
            <div className="mt-3 flex min-w-0 items-start gap-3">
              <span className="shrink-0 rounded-md bg-indigo-50 px-2.5 py-1 text-sm font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-200">
                {departureCode}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{departureName}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {flightInstance.terminal || departureAirport.terminal ? `Terminal ${flightInstance.terminal || departureAirport.terminal}` : "Terminal assigned by airline"}
                  {flightInstance.gate ? ` · Gate ${flightInstance.gate}` : ""}
                </p>
              </div>
            </div>
          </div>

          <div className="flex min-w-0 items-center justify-center">
            <div className="flex w-full min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-slate-950/40 xl:flex-col">
              <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
              <div className="min-w-0 flex-1 text-left xl:text-center">
                <p className="text-sm font-semibold text-slate-950 dark:text-white">{duration}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{stops === 0 ? "Direct flight" : "Connection required"}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 xl:rotate-90" />
            </div>
          </div>

          <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/40">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 xl:justify-end">
              <Calendar className="h-4 w-4" />
              Arrival · {arrival.date}
            </div>
            <p className="text-3xl font-bold text-slate-950 dark:text-white xl:text-right">{arrival.time}</p>
            <div className="mt-3 flex min-w-0 items-start gap-3 xl:justify-end">
              <div className="min-w-0 xl:text-right">
                <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{arrivalName}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {arrivalAirport.terminal ? `Terminal ${arrivalAirport.terminal}` : "Arrival terminal may change"}
                </p>
              </div>
              <span className="shrink-0 rounded-md bg-indigo-50 px-2.5 py-1 text-sm font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-200">
                {arrivalCode}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-950/40">
          <span className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-200">
            <Plane className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-300" />
            {aircraftName}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-200">
            <MapPin className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-300" />
            {flightNumber}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-200">
            <Ticket className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-300" />
            {cabinClass}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default FlightDetailsOverview;
