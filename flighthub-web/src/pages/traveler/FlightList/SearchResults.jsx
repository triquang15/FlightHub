import * as React from "react";
import { AlertCircle, CheckCircle2, Menu, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { getAirlinesForDropdown } from "@/Redux/airline/airlineThunks";
import { listAllAirports } from "@/Redux/airport/airportThunk";
import { searchFlightsAvailability } from "@/Redux/flightSearch/flightSearchThunk";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import api from "@/utils/api";
import {
  buildTravelerSearchParams,
  formatSearchDateParam,
  readTravelerSearchParams,
} from "@/utils/travelerSearchParams";
import FiltersSidebar from "./Filterssidebar";
import {
  MAX_DURATION,
  PRICE_LIMITS,
  createDefaultFlightFilters,
} from "./flightFilterConfig";
import { NoResultsFound, SearchResultsLoading } from "./LoadingStates";
import ModernFlightCard from "./ModernFlightCard";
import SearchSummaryBar from "./SearchSummaryBar";
import SortingBar from "./SortingBar";
import "./animations.css";

const getPrice = (flight) =>
  Number(flight?.fare?.totalPrice ?? flight?.fare?.currentPrice ?? Number.MAX_SAFE_INTEGER);

const getDuration = (flight) =>
  new Date(flight.arrivalDateTime).getTime() - new Date(flight.departureDateTime).getTime();

const unwrapApiData = (response) => response?.data?.data ?? response?.data;

const getApiError = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

const encodeJsonParam = (value) => btoa(JSON.stringify(value));

const normalizeLegDate = (date) => formatSearchDateParam(date);

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const searchParamKey = searchParams.toString();
  const searchData = React.useMemo(
    () => readTravelerSearchParams(new URLSearchParams(searchParamKey)),
    [searchParamKey],
  );

  const { searchResults, loading, error } = useSelector((state) => state.flightSearch);
  const { airports = [] } = useSelector((state) => state.airport);
  const { dropdownAirlines = [] } = useSelector((state) => state.airline);

  const [sortBy, setSortBy] = React.useState("price");
  const [sortOrder, setSortOrder] = React.useState("asc");
  const [viewMode, setViewMode] = React.useState("list");
  const [showMobileFilters, setShowMobileFilters] = React.useState(false);
  const [filters, setFilters] = React.useState(createDefaultFlightFilters);
  const [returnResults, setReturnResults] = React.useState(null);
  const [returnLoading, setReturnLoading] = React.useState(false);
  const [returnError, setReturnError] = React.useState("");
  const [selectedOutbound, setSelectedOutbound] = React.useState(null);
  const [selectedReturn, setSelectedReturn] = React.useState(null);
  const [activeMultiCityLegIndex, setActiveMultiCityLegIndex] = React.useState(0);
  const [selectedMultiCityLegs, setSelectedMultiCityLegs] = React.useState([]);
  const [multiCityResults, setMultiCityResults] = React.useState({});
  const [multiCityLoading, setMultiCityLoading] = React.useState(false);
  const [multiCityError, setMultiCityError] = React.useState("");

  const departureDate = formatSearchDateParam(searchData.departureDate);
  const returnDate = formatSearchDateParam(searchData.returnDate);
  const isRoundTrip = searchData.tripType === "roundTrip";
  const isMultiCity = searchData.tripType === "multiCity";
  const multiCitySegments = React.useMemo(() => {
    if (Array.isArray(searchData.segments) && searchData.segments.length > 0) {
      return searchData.segments;
    }

    if (searchData.departureAirportId && searchData.arrivalAirportId && searchData.departureDate) {
      return [{
        departureAirportId: searchData.departureAirportId,
        arrivalAirportId: searchData.arrivalAirportId,
        departureDate: searchData.departureDate,
      }];
    }

    return [];
  }, [searchData.arrivalAirportId, searchData.departureAirportId, searchData.departureDate, searchData.segments]);
  const activeMultiCitySegment = multiCitySegments[activeMultiCityLegIndex];

  const buildSearchParamsForLeg = React.useCallback(
    ({ departureAirportId, arrivalAirportId, legDate }) => {
      const params = {
        departureAirportId,
        arrivalAirportId,
        departureDate: legDate,
        passengers: searchData.passengers,
        cabinClass: searchData.cabinClass,
        sortBy,
        sortOrder,
      };

      if (filters.airlines.length > 0) params.airlines = filters.airlines;
      if (filters.priceRange.min > PRICE_LIMITS.min) params.minPrice = filters.priceRange.min;
      if (filters.priceRange.max < PRICE_LIMITS.max) params.maxPrice = filters.priceRange.max;
      if (filters.departureTimeRange !== "any") params.departureTimeRange = filters.departureTimeRange;
      if (filters.arrivalTimeRange !== "any") params.arrivalTimeRange = filters.arrivalTimeRange;
      if (filters.maxDuration < MAX_DURATION) params.maxDuration = filters.maxDuration;

      return params;
    },
    [filters, searchData.cabinClass, searchData.passengers, sortBy, sortOrder],
  );

  React.useEffect(() => {
    if (airports.length === 0) {
      dispatch(
        listAllAirports({ page: 0, size: 100, sortBy: "name", sortDirection: "asc" }),
      );
    }
  }, [airports.length, dispatch]);

  React.useEffect(() => {
    dispatch(getAirlinesForDropdown());
  }, [dispatch]);

  React.useEffect(() => {
    if (isMultiCity || !searchData.departureAirportId || !searchData.arrivalAirportId || !departureDate) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      const params = buildSearchParamsForLeg({
        departureAirportId: searchData.departureAirportId,
        arrivalAirportId: searchData.arrivalAirportId,
        legDate: departureDate,
      });

      dispatch(searchFlightsAvailability(params));
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [
    departureDate,
    buildSearchParamsForLeg,
    dispatch,
    searchData.arrivalAirportId,
    searchData.departureAirportId,
    isMultiCity,
  ]);

  React.useEffect(() => {
    setSelectedOutbound(null);
    setSelectedReturn(null);
    setSelectedMultiCityLegs([]);
    setActiveMultiCityLegIndex(0);
    setMultiCityResults({});
    setMultiCityError("");
  }, [
    departureDate,
    returnDate,
    searchData.arrivalAirportId,
    searchData.cabinClass,
    searchData.departureAirportId,
    searchData.passengers,
    searchData.tripType,
    searchData.segments,
  ]);

  React.useEffect(() => {
    if (!isRoundTrip || !searchData.departureAirportId || !searchData.arrivalAirportId || !returnDate) {
      setReturnResults(null);
      setReturnError("");
      setReturnLoading(false);
      return undefined;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      setReturnLoading(true);
      setReturnError("");

      try {
        const params = buildSearchParamsForLeg({
          departureAirportId: searchData.arrivalAirportId,
          arrivalAirportId: searchData.departureAirportId,
          legDate: returnDate,
        });
        const response = await api.get("/api/flights/search", { params });
        const result = unwrapApiData(response);
        if (!cancelled) setReturnResults(result);
      } catch (err) {
        if (!cancelled) {
          setReturnError(getApiError(err, "Unable to search return flights right now"));
        }
      } finally {
        if (!cancelled) setReturnLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [
    buildSearchParamsForLeg,
    isRoundTrip,
    returnDate,
    searchData.arrivalAirportId,
    searchData.departureAirportId,
  ]);

  React.useEffect(() => {
    if (!isMultiCity || !activeMultiCitySegment) {
      setMultiCityLoading(false);
      setMultiCityError("");
      return undefined;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      const legKey = String(activeMultiCityLegIndex);
      if (multiCityResults[legKey]) return;

      setMultiCityLoading(true);
      setMultiCityError("");

      try {
        const params = buildSearchParamsForLeg({
          departureAirportId: activeMultiCitySegment.departureAirportId,
          arrivalAirportId: activeMultiCitySegment.arrivalAirportId,
          legDate: normalizeLegDate(activeMultiCitySegment.departureDate),
        });
        const response = await api.get("/api/flights/search", { params });
        const result = unwrapApiData(response);
        if (!cancelled) {
          setMultiCityResults((current) => ({ ...current, [legKey]: result }));
        }
      } catch (err) {
        if (!cancelled) {
          setMultiCityError(getApiError(err, "Unable to search this multi-city leg right now"));
        }
      } finally {
        if (!cancelled) setMultiCityLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [
    activeMultiCityLegIndex,
    activeMultiCitySegment,
    buildSearchParamsForLeg,
    isMultiCity,
    multiCityResults,
  ]);

  const departureAirport = airports.find(
    (airport) => airport.id === searchData.departureAirportId,
  );
  const arrivalAirport = airports.find(
    (airport) => airport.id === searchData.arrivalAirportId,
  );
  const resultContent = React.useMemo(
    () => (Array.isArray(searchResults?.content) ? searchResults.content : []),
    [searchResults],
  );
  const returnResultContent = React.useMemo(
    () => (Array.isArray(returnResults?.content) ? returnResults.content : []),
    [returnResults],
  );

  const sortFlights = React.useCallback((flights) => {
    const directFlights = searchData.directOnly
      ? flights.filter((flight) => (flight.totalStops ?? flight.stops ?? 0) === 0)
      : flights;
    const direction = sortOrder === "asc" ? 1 : -1;

    return [...directFlights].sort((left, right) => {
      if (sortBy === "price") return (getPrice(left) - getPrice(right)) * direction;
      if (sortBy === "duration") return (getDuration(left) - getDuration(right)) * direction;
      if (sortBy === "arrival") {
        return (
          (new Date(left.arrivalDateTime).getTime() - new Date(right.arrivalDateTime).getTime()) *
          direction
        );
      }
      return (
        (new Date(left.departureDateTime).getTime() -
          new Date(right.departureDateTime).getTime()) *
        direction
      );
    });
  }, [searchData.directOnly, sortBy, sortOrder]);

  const visibleFlights = React.useMemo(() => sortFlights(resultContent), [resultContent, sortFlights]);
  const visibleReturnFlights = React.useMemo(
    () => sortFlights(returnResultContent),
    [returnResultContent, sortFlights],
  );
  const activeMultiCityResultContent = React.useMemo(() => {
    const result = multiCityResults[String(activeMultiCityLegIndex)];
    return Array.isArray(result?.content) ? result.content : [];
  }, [activeMultiCityLegIndex, multiCityResults]);
  const visibleMultiCityFlights = React.useMemo(
    () => sortFlights(activeMultiCityResultContent),
    [activeMultiCityResultContent, sortFlights],
  );
  const isReturnSelectionStage = isRoundTrip && Boolean(selectedOutbound);

  const hasActiveFilters =
    filters.airlines.length > 0 ||
    filters.priceRange.min !== PRICE_LIMITS.min ||
    filters.priceRange.max !== PRICE_LIMITS.max ||
    filters.departureTimeRange !== "any" ||
    filters.arrivalTimeRange !== "any" ||
    filters.maxDuration !== MAX_DURATION;

  const modifySearch = () => navigate("/traveler");
  const includeConnections = () => {
    const next = buildTravelerSearchParams({ ...searchData, directOnly: false });
    navigate(`/search?${next.toString()}`);
  };

  const handleOutboundFareSelected = (selection) => {
    setSelectedOutbound(selection);
    setSelectedReturn(null);
    toast.success("Departure flight selected. Choose your return flight next.");
    return false;
  };

  const handleReturnFareSelected = (returnSelection) => {
    if (!selectedOutbound) {
      toast.error("Choose a departure flight first.");
      return false;
    }

    const roundTripDraft = {
      tripType: "roundTrip",
      searchData,
      outbound: selectedOutbound,
      return: returnSelection,
      numberOfTravellers: searchData.passengers,
      createdAt: new Date().toISOString(),
    };

    sessionStorage.setItem("roundTripDraft", JSON.stringify(roundTripDraft));
    setSelectedReturn(returnSelection);
    sessionStorage.setItem("bookingData", JSON.stringify({
      ...selectedOutbound.bookingData,
      tripType: "roundTrip",
      roundTrip: roundTripDraft,
    }));
    const params = new URLSearchParams(selectedOutbound.queryParams);
    params.set("tripType", "ROUND_TRIP");
    params.set("returnFlightInstanceId", returnSelection.queryParams.flightInstanceId);
    params.set("returnFlightId", returnSelection.queryParams.flightId);
    params.set("returnFareId", returnSelection.queryParams.fareId);
    params.set("returnCabinClassId", returnSelection.queryParams.cabinClassId);
    params.set("returnCabinClass", returnSelection.queryParams.cabinClass);
    navigate(`/booking-review?${params.toString()}`);
    return false;
  };

  const handleMultiCityFareSelected = (selection) => {
    const nextSelections = [...selectedMultiCityLegs];
    nextSelections[activeMultiCityLegIndex] = selection;
    setSelectedMultiCityLegs(nextSelections);

    if (activeMultiCityLegIndex < multiCitySegments.length - 1) {
      setActiveMultiCityLegIndex((index) => index + 1);
      toast.success(`Flight ${activeMultiCityLegIndex + 1} selected. Choose flight ${activeMultiCityLegIndex + 2} next.`);
      return false;
    }

    const completedSelections = nextSelections.filter(Boolean);
    if (completedSelections.length !== multiCitySegments.length) {
      toast.error("Please select a fare for every multi-city flight.");
      return false;
    }

    const firstSelection = completedSelections[0];
    const legs = completedSelections.map((legSelection, index) => ({
      legOrder: index + 1,
      flightId: legSelection.queryParams.flightId,
      flightInstanceId: legSelection.queryParams.flightInstanceId,
      fareId: legSelection.queryParams.fareId,
      cabinClass: legSelection.queryParams.cabinClass,
      cabinClassId: legSelection.queryParams.cabinClassId,
    }));

    const multiCityDraft = {
      tripType: "multiCity",
      searchData,
      legs: completedSelections,
      numberOfTravellers: searchData.passengers,
      createdAt: new Date().toISOString(),
    };

    sessionStorage.setItem("multiCityDraft", JSON.stringify(multiCityDraft));
    sessionStorage.setItem("bookingData", JSON.stringify({
      ...firstSelection.bookingData,
      tripType: "multiCity",
      multiCity: multiCityDraft,
    }));

    const params = new URLSearchParams(firstSelection.queryParams);
    params.set("tripType", "MULTI_CITY");
    params.set("multiLegs", encodeJsonParam(legs));
    navigate(`/booking-review?${params.toString()}`);
    return false;
  };

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <SearchSummaryBar
          searchData={{
            from: departureAirport?.iataCode || "---",
            fromName: departureAirport?.city?.name || departureAirport?.name,
            to: arrivalAirport?.iataCode || "---",
            toName: arrivalAirport?.city?.name || arrivalAirport?.name,
            departureDate: searchData.departureDate,
            returnDate: searchData.returnDate,
            passengers: searchData.passengers,
            cabinClass: searchData.cabinClass,
          }}
          onModifySearch={modifySearch}
        />

        {!isMultiCity && loading ? (
          <div className="mt-5 grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
            <div className="hidden h-96 rounded-md border bg-card lg:block" />
            <SearchResultsLoading count={3} />
          </div>
        ) : !isMultiCity && error ? (
          <section className="mt-5 flex min-h-96 items-center justify-center rounded-md border bg-card px-6 py-16 text-center">
            <div className="max-w-md">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </span>
              <h1 className="mt-5 text-xl font-semibold">We could not load these flights</h1>
              <p className="mt-2 text-sm text-muted-foreground">{error}</p>
              <div className="mt-6 flex justify-center gap-3">
                <Button variant="outline" onClick={modifySearch}>Change search</Button>
                <Button onClick={() => window.location.reload()}>Try again</Button>
              </div>
            </div>
          </section>
        ) : !isMultiCity && visibleFlights.length === 0 ? (
          <NoResultsFound
            className="mt-5 min-h-96 rounded-md border bg-card px-6"
            hasActiveFilters={hasActiveFilters}
            directOnly={searchData.directOnly}
            onClearFilters={() => setFilters(createDefaultFlightFilters())}
            onIncludeConnections={includeConnections}
            onModifySearch={modifySearch}
          />
        ) : (
          <>
            <div className="mt-5 lg:hidden">
              <Button
                variant="outline"
                onClick={() => setShowMobileFilters((open) => !open)}
                className="h-11 w-full justify-start gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {showMobileFilters ? (
                  <X className="ml-auto h-4 w-4" />
                ) : (
                  <Menu className="ml-auto h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
              <div className={cn(showMobileFilters ? "block" : "hidden", "lg:block")}>
                <FiltersSidebar
                  filters={filters}
                  onFiltersChange={setFilters}
                  airlines={dropdownAirlines}
                />
              </div>

              <section className="min-w-0 space-y-4">
                {isMultiCity && (
                  <div className="rounded-lg border bg-card p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Multi-city
                        </p>
                        <h2 className="mt-1 text-lg font-semibold">
                          Choose flight {activeMultiCityLegIndex + 1} of {multiCitySegments.length}
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Select one fare for each flight. Checkout will create a single multi-leg booking.
                        </p>
                      </div>
                      {activeMultiCityLegIndex > 0 && (
                        <Button
                          variant="outline"
                          onClick={() => setActiveMultiCityLegIndex((index) => Math.max(0, index - 1))}
                          className="gap-2"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Previous flight
                        </Button>
                      )}
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {multiCitySegments.map((segment, index) => {
                        const fromAirport = airports.find((airport) => airport.id === segment.departureAirportId);
                        const toAirport = airports.find((airport) => airport.id === segment.arrivalAirportId);
                        const selectedLeg = selectedMultiCityLegs[index];
                        const isActive = activeMultiCityLegIndex === index;

                        return (
                          <button
                            key={`${segment.departureAirportId}-${segment.arrivalAirportId}-${index}`}
                            type="button"
                            onClick={() => setActiveMultiCityLegIndex(index)}
                            className={cn(
                              "rounded-md border px-3 py-3 text-left transition",
                              isActive
                                ? "border-primary bg-primary/10"
                                : selectedLeg
                                  ? "border-emerald-500/30 bg-emerald-500/10"
                                  : "bg-background hover:border-primary/40",
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Flight {index + 1}
                              </span>
                              {selectedLeg && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                            </div>
                            <p className="mt-1 font-semibold">
                              {fromAirport?.iataCode || segment.departureAirportId} to {toAirport?.iataCode || segment.arrivalAirportId}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {formatSearchDateParam(segment.departureDate)}
                              {selectedLeg ? ` · ${selectedLeg.flight?.flightNumber || "Selected"}` : ""}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {isRoundTrip && (
                  <div className="rounded-lg border bg-card p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Round trip
                        </p>
                        <h2 className="mt-1 text-lg font-semibold">
                          {selectedOutbound ? "Choose your return flight" : "Choose your departure flight"}
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Select a fare for each leg before checkout. Multi-leg booking checkout will use this paired selection.
                        </p>
                      </div>
                      {selectedOutbound && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedOutbound(null);
                            setSelectedReturn(null);
                          }}
                          className="gap-2"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Change departure
                        </Button>
                      )}
                    </div>

                    {selectedOutbound && (
                      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-200">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="font-semibold">
                          Departure selected:
                        </span>
                        <span>
                          {selectedOutbound.flight?.flightNumber || "Flight"} · fare {selectedOutbound.selectedFare?.fareLabel || selectedOutbound.selectedFare?.name || selectedOutbound.selectedFare?.id}
                        </span>
                      </div>
                    )}

                    {selectedReturn && (
                      <div className="mt-3 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-3 text-sm text-emerald-700 dark:text-emerald-200">
                        <div className="flex flex-wrap items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="font-semibold">Return selected:</span>
                          <span>
                            {selectedReturn.flight?.flightNumber || "Flight"} · fare {selectedReturn.selectedFare?.fareLabel || selectedReturn.selectedFare?.name || selectedReturn.selectedFare?.id}
                          </span>
                        </div>
                        <p className="mt-2 leading-5">Opening checkout for both selected legs.</p>
                      </div>
                    )}
                  </div>
                )}

                <SortingBar
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSortChange={setSortBy}
                  onSortOrderChange={setSortOrder}
                  resultsCount={
                    isMultiCity
                      ? visibleMultiCityFlights.length
                      : isReturnSelectionStage
                        ? visibleReturnFlights.length
                        : visibleFlights.length
                  }
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                />

                {!isRoundTrip || !selectedOutbound ? (
                  isMultiCity ? (
                    multiCityLoading ? (
                      <SearchResultsLoading count={3} />
                    ) : multiCityError ? (
                      <section className="flex min-h-80 items-center justify-center rounded-md border bg-card px-6 py-14 text-center">
                        <div className="max-w-md">
                          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                            <AlertCircle className="h-6 w-6 text-destructive" />
                          </span>
                          <h3 className="mt-5 text-lg font-semibold">We could not load this flight</h3>
                          <p className="mt-2 text-sm text-muted-foreground">{multiCityError}</p>
                        </div>
                      </section>
                    ) : visibleMultiCityFlights.length === 0 ? (
                      <NoResultsFound
                        className="min-h-80 rounded-md border bg-card px-6"
                        hasActiveFilters={hasActiveFilters}
                        directOnly={searchData.directOnly}
                        onClearFilters={() => setFilters(createDefaultFlightFilters())}
                        onIncludeConnections={includeConnections}
                        onModifySearch={modifySearch}
                      />
                    ) : (
                      <div
                        className={cn(
                          viewMode === "grid" ? "grid gap-4 xl:grid-cols-2" : "space-y-4",
                        )}
                      >
                        {visibleMultiCityFlights.map((flight) => (
                          <ModernFlightCard
                            key={flight.id}
                            flight={flight}
                            cabinClass={searchData.cabinClass}
                            viewMode={viewMode}
                            chooseLabel={`Select flight ${activeMultiCityLegIndex + 1}`}
                            onFareSelected={handleMultiCityFareSelected}
                          />
                        ))}
                      </div>
                    )
                  ) : (
                    <div
                      className={cn(
                        viewMode === "grid" ? "grid gap-4 xl:grid-cols-2" : "space-y-4",
                      )}
                    >
                      {visibleFlights.map((flight) => (
                        <ModernFlightCard
                          key={flight.id}
                          flight={flight}
                          cabinClass={searchData.cabinClass}
                          viewMode={viewMode}
                          chooseLabel={isRoundTrip ? "Select departure" : "Choose fare"}
                          onFareSelected={isRoundTrip ? handleOutboundFareSelected : undefined}
                        />
                      ))}
                    </div>
                  )
                ) : returnLoading ? (
                  <SearchResultsLoading count={3} />
                ) : returnError ? (
                  <section className="flex min-h-80 items-center justify-center rounded-md border bg-card px-6 py-14 text-center">
                    <div className="max-w-md">
                      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                        <AlertCircle className="h-6 w-6 text-destructive" />
                      </span>
                      <h3 className="mt-5 text-lg font-semibold">We could not load return flights</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{returnError}</p>
                    </div>
                  </section>
                ) : visibleReturnFlights.length === 0 ? (
                  <NoResultsFound
                    className="min-h-80 rounded-md border bg-card px-6"
                    hasActiveFilters={hasActiveFilters}
                    directOnly={searchData.directOnly}
                    onClearFilters={() => setFilters(createDefaultFlightFilters())}
                    onIncludeConnections={includeConnections}
                    onModifySearch={modifySearch}
                  />
                ) : (
                  <div
                    className={cn(
                      viewMode === "grid" ? "grid gap-4 xl:grid-cols-2" : "space-y-4",
                    )}
                  >
                    {visibleReturnFlights.map((flight) => (
                      <ModernFlightCard
                        key={flight.id}
                        flight={flight}
                        cabinClass={searchData.cabinClass}
                        viewMode={viewMode}
                        chooseLabel="Select return"
                        onFareSelected={handleReturnFareSelected}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </main>
  );
};

export default SearchResults;
