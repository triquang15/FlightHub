import { motion } from "framer-motion";
import { Plane, Clock, Calendar } from "lucide-react";
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
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600 dark:border-blue-300"></div>
          <p className="text-slate-600 dark:text-slate-300">Loading flight details...</p>
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

  // Extract flight data
  const departure = formatDateTime(flightInstance.departureDateTime);
  const arrival = formatDateTime(flightInstance.arrivalDateTime);
  const duration = flightInstance.duration || "N/A";



  // Get airport info
  const departureAirport = flightInstance.departureAirport || flightInstance.flight?.departureAirport || {};
  const arrivalAirport = flightInstance.arrivalAirport || flightInstance.flight?.arrivalAirport || {};

  // Get cabin class info
  const cabinClass = flightInstance.cabin?.cabinClassType || searchParams.get("cabinClass") || "ECONOMY";

  // Get stops info
  const stops = flightInstance.stops || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-white/10 dark:bg-slate-900/90 dark:shadow-black/20"
    >
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Flight Details</h2>
        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-500/10 dark:text-green-300">
          {stops === 0 ? "Non-stop" : `${stops} Stop(s)`}
        </span>
      </div>

      {/* Airline Info */}
      <div className="mb-6 flex items-center gap-3 border-b border-slate-200 pb-6 dark:border-white/10">
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-slate-50 dark:bg-white/5">
          <img
            src={flightInstance?.airlineLogo}
            alt={flightInstance?.airlineName}
            className="h-8 w-8 object-contain"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.parentElement.textContent = flightInstance?.airlineName?.slice(0, 2)?.toUpperCase() || "FH";
            }}
          />
        </div>
        <div>
          <p className="font-semibold text-slate-950 dark:text-white">
            {flightInstance?.airlineName}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {flightInstance?.flightNumber} • {flightInstance?.aircraftModal}
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {cabinClass}
          </p>
        </div>
      </div>

      {/* Flight Route */}
      <div className="mb-6 grid grid-cols-[1fr_auto_1fr] gap-4">
        {/* Departure */}
        <div className="text-left">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {departure.date}
            </p>
          </div>
          <p className="mb-1 text-2xl font-bold text-slate-950 dark:text-white">
            {departure.time}
          </p>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {departureAirport.iataCode || "N/A"}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400">{departureAirport.city?.name || departureAirport.name || "N/A"}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
            {departureAirport.terminal ? `Terminal ${departureAirport.terminal}` : ""}
          </p>
        </div>

        {/* Duration & Arrow */}
        <div className="flex flex-col items-center justify-center px-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {duration}
            </p>
          </div>
          <div className="relative w-full">
            <div className="h-0.5 w-full bg-slate-300 dark:bg-slate-700"></div>
            <Plane className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rotate-90 text-blue-600 dark:text-blue-300" />
          </div>
          {stops === 0 && (
            <p className="mt-2 text-xs font-medium text-green-600 dark:text-green-300">Non-stop</p>
          )}
        </div>

        {/* Arrival */}
        <div className="text-right">
          <div className="flex items-center justify-end gap-2 mb-2">
            <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <p className="text-xs text-slate-500 dark:text-slate-400">{arrival.date}</p>
          </div>
          <p className="mb-1 text-2xl font-bold text-slate-950 dark:text-white">
            {arrival.time}
          </p>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {arrivalAirport.iataCode || "N/A"}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400">{arrivalAirport.city?.name || arrivalAirport.name || "N/A"}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
            {arrivalAirport.terminal ? `Terminal ${arrivalAirport.terminal}` : ""}
          </p>
        </div>
      </div>

      
    </motion.div>
  );
};

export default FlightDetailsOverview;
