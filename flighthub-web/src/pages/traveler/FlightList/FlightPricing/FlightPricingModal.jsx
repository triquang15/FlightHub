import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowRight, CalendarDays, Clock, Plane, Route, Users } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";

import { getCabinClassesByAircraft } from "@/Redux/cabinClass/cabinClassThunk";
import { clearFlightFares } from "@/Redux/fare/fareSlice";
import { getFlightFares } from "@/Redux/fare/fareThunk";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { buildBookingPayload } from "@/services/Booking/bookingService";
import FareCard from "./FareCard";

const formatTime = (dateTime) => {
  if (!dateTime) return "--:--";
  return new Date(dateTime).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const formatDate = (dateTime) => {
  if (!dateTime) return "Date TBA";
  return new Date(dateTime).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatMoney = (amount, currency = "USD") => {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "Unavailable";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
};

const airportCode = (airport) => airport?.iataCode || "--";
const airportLabel = (airport, fallback) => airport?.cityName || airport?.name || fallback;
const fareTotal = (fare) => fare?.totalPrice ?? fare?.currentPrice ?? fare?.baseFare ?? 0;

const FlightPricingModal = ({ isOpen, onClose, flight, onSelectFare }) => {
  const [selectedFareId, setSelectedFareId] = useState(null);
  const {
    flightFares = [],
    flightFaresLoading: faresLoading,
    flightFaresError: faresError,
  } = useSelector((store) => store.fare);
  const {
    cabinClasses = [],
    loading: cabinsLoading,
    error: cabinsError,
  } = useSelector((store) => store.cabinClass);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const passengerCount =
    parseInt(searchParams.get("pax") || searchParams.get("passengers") || searchParams.get("numberOfTravellers"), 10) || 1;

  const searchedCabin = useMemo(
    () => cabinClasses.find(
      (cabin) => cabin.name === flight?.fare?.cabinClass || cabin.cabinClassType === flight?.fare?.cabinClass,
    ),
    [cabinClasses, flight?.fare?.cabinClass],
  );

  const selectedCabinId = useMemo(() => (searchedCabin || cabinClasses[0])?.id || null, [cabinClasses, searchedCabin]);

  const selectedCabinClass = useMemo(
    () => cabinClasses.find((cabin) => String(cabin.id) === String(selectedCabinId)) || null,
    [cabinClasses, selectedCabinId],
  );

  const availableFares = useMemo(() => {
    if (Array.isArray(flightFares) && flightFares.length > 0) return flightFares;
    if (!flight?.fare?.id) return [];

    const selectedCabinName = selectedCabinClass?.name || selectedCabinClass?.cabinClassType;
    const fareCabinName = flight.fare.cabinClass;
    if (selectedCabinName && fareCabinName && selectedCabinName !== fareCabinName) return [];

    return [flight.fare];
  }, [flightFares, flight, selectedCabinClass]);

  const sortedFares = useMemo(
    () => [...availableFares].sort((a, b) => fareTotal(a) - fareTotal(b)),
    [availableFares],
  );

  const selectedFare = useMemo(
    () => sortedFares.find((fare) => String(fare.id) === String(selectedFareId)) || sortedFares[0] || null,
    [selectedFareId, sortedFares],
  );

  const bookingCabinClass = useMemo(() => {
    if (selectedCabinClass) return selectedCabinClass;
    if (!selectedFare) return null;

    const cabinName = selectedFare.cabinClass || flight?.fare?.cabinClass;
    if (!cabinName && !selectedFare.cabinClassId) return null;

    return {
      id: selectedFare.cabinClassId || selectedCabinId,
      name: cabinName || "ECONOMY",
      cabinClassType: cabinName || "ECONOMY",
    };
  }, [flight?.fare?.cabinClass, selectedCabinClass, selectedCabinId, selectedFare]);

  const continueDisabledReason = useMemo(() => {
    if (faresLoading) return "Loading available fares for this flight.";
    if (faresError && !selectedFare) return `Fare data could not be loaded: ${faresError}`;
    if (!sortedFares.length) return "No fare is available for this flight and cabin.";
    if (!selectedFare) return "Select a fare option to continue.";
    if (cabinsLoading && !bookingCabinClass) return "Loading cabin information before booking.";
    if (cabinsError && !bookingCabinClass) return `Cabin data could not be loaded: ${cabinsError}`;
    if (!bookingCabinClass) return "Cabin class could not be resolved for the selected fare.";
    return "";
  }, [bookingCabinClass, cabinsError, cabinsLoading, faresError, faresLoading, selectedFare, sortedFares.length]);

  const canContinue = Boolean(selectedFare && bookingCabinClass && !faresLoading);

  const selectedTotal = selectedFare ? fareTotal(selectedFare) * passengerCount : 0;
  const selectedCurrency = selectedFare?.currency || flight?.fare?.currency || "USD";
  const routeLabel = `${airportCode(flight?.departureAirport)} to ${airportCode(flight?.arrivalAirport)}`;

  useEffect(() => {
    if (!isOpen) return;
    setSelectedFareId(null);
    dispatch(clearFlightFares());
  }, [dispatch, flight?.flightId, flight?.id, isOpen]);

  useEffect(() => {
    if (isOpen && flight?.aircraftId) {
      dispatch(getCabinClassesByAircraft(flight.aircraftId));
    }
  }, [dispatch, flight?.aircraftId, isOpen]);

  useEffect(() => {
    if (!selectedCabinId || !flight?.flightId) return;
    dispatch(getFlightFares({ cabinId: selectedCabinId, flightId: flight.flightId }));
  }, [dispatch, flight?.flightId, selectedCabinId]);

  const handleContinueBooking = () => {
    if (!canContinue) return;

    const { bookingData, queryParams } = buildBookingPayload({
      flight,
      selectedFare,
      selectedCabinClass: bookingCabinClass,
      numberOfTravellers: passengerCount,
    });

    const selectionPayload = {
      flight,
      selectedFare,
      selectedCabinClass: bookingCabinClass,
      bookingData,
      queryParams,
    };

    if (onSelectFare) {
      const shouldNavigate = onSelectFare(selectionPayload);
      onClose?.();
      if (shouldNavigate === false) return;
    }

    sessionStorage.setItem("bookingData", JSON.stringify(bookingData));
    navigate(`/booking-review?${new URLSearchParams(queryParams).toString()}`);
    onClose?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[92vh] w-[min(calc(100vw-1rem),980px)] !max-w-none overflow-hidden p-0 sm:w-[min(calc(100vw-2rem),980px)]">
        <DialogHeader className="border-b bg-background px-5 py-4 pr-12 sm:px-6 sm:pr-14">
          <DialogTitle className="flex min-w-0 items-center gap-3 text-xl font-semibold">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Plane className="h-5 w-5" />
            </span>
            Choose your fare
          </DialogTitle>
          <DialogDescription>
            Select a fare option for this flight before entering traveler details.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(92vh-154px)] overflow-y-auto">
          <div className="grid gap-0 lg:grid-cols-[360px_1fr]">
            <aside className="border-b bg-muted/20 p-5 sm:p-6 lg:border-b-0 lg:border-r">
              <div className="flex flex-wrap gap-2 text-sm">
                <Badge variant="outline" className="rounded-md px-3 py-1">
                  <Route className="mr-1.5 h-3.5 w-3.5" />
                  {routeLabel}
                </Badge>
                <Badge variant="outline" className="rounded-md px-3 py-1">
                  <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
                  {formatDate(flight?.departureDateTime)}
                </Badge>
                <Badge variant="secondary" className="rounded-md px-3 py-1">
                  <Users className="mr-1.5 h-3.5 w-3.5" />
                  {passengerCount} traveler{passengerCount > 1 ? "s" : ""}
                </Badge>
              </div>

              <div className="mt-5 rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Departure</p>
                    <p className="mt-2 text-3xl font-semibold tabular-nums">{formatTime(flight?.departureDateTime)}</p>
                    <p className="mt-1 font-semibold">{airportCode(flight?.departureAirport)}</p>
                    <p className="mt-1 truncate text-sm text-muted-foreground">{airportLabel(flight?.departureAirport, "Origin airport")}</p>
                  </div>
                  <div className="min-w-0 text-right">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Arrival</p>
                    <p className="mt-2 text-3xl font-semibold tabular-nums">{formatTime(flight?.arrivalDateTime)}</p>
                    <p className="mt-1 font-semibold">{airportCode(flight?.arrivalAirport)}</p>
                    <p className="mt-1 truncate text-sm text-muted-foreground">{airportLabel(flight?.arrivalAirport, "Destination airport")}</p>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="grid gap-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4 text-primary" /> Duration</span>
                    <span className="font-semibold">{flight?.formattedDuration || "TBA"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Flight</span>
                    <span className="font-semibold">{flight?.airlineName || "Airline"} {flight?.flightNumber || ""}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Aircraft</span>
                    <span className="font-semibold">{flight?.aircraftModel || flight?.aircraftModal || "TBA"}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-lg border bg-card p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Checkout total</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {selectedFare ? formatMoney(selectedTotal, selectedCurrency) : "Select a fare"}
                </p>
                {selectedFare && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    for {passengerCount} traveler{passengerCount > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </aside>

            <section className="p-5 sm:p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-foreground">Fare options</h3>
                <p className="mt-1 text-sm text-muted-foreground">Prices are shown in {selectedCurrency}.</p>
              </div>

              {faresError && (
                <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                  {faresError}
                </div>
              )}

              {faresLoading ? (
                <div className="grid gap-3">
                  {[1, 2].map((item) => (
                    <div key={item} className="h-40 animate-pulse rounded-lg border bg-muted" />
                  ))}
                </div>
              ) : sortedFares.length ? (
                <div className="grid gap-3">
                  {sortedFares.map((fare) => (
                    <FareCard
                      key={fare.id}
                      fare={fare}
                      isSelected={selectedFare?.id === fare.id}
                      onSelect={() => setSelectedFareId(fare.id)}
                      passengerCount={passengerCount}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center">
                  <p className="font-semibold">No fares available for this cabin.</p>
                  <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Try another cabin class or adjust your search.</p>
                </div>
              )}
            </section>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t bg-background/95 px-5 py-4 backdrop-blur sm:flex-row sm:justify-end sm:px-6">
          <Button variant="outline" onClick={onClose}>
            Back to results
          </Button>
          <div className="min-w-0 flex-1 sm:max-w-md">
            {continueDisabledReason && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{continueDisabledReason}</span>
              </div>
            )}
          </div>
          <Button
            onClick={handleContinueBooking}
            disabled={!canContinue}
            title={continueDisabledReason || "Continue to booking"}
            className="h-11 min-w-48 justify-between"
          >
            {faresLoading || cabinsLoading ? "Preparing booking" : "Continue to booking"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FlightPricingModal;
