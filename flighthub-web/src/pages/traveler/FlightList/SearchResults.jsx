import * as React from "react";
import { AlertCircle, Menu, SlidersHorizontal, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getAirlinesForDropdown } from "@/Redux/airline/airlineThunks";
import { listAllAirports } from "@/Redux/airport/airportThunk";
import { searchFlightsAvailability } from "@/Redux/flightSearch/flightSearchThunk";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const searchData = readTravelerSearchParams(searchParams);

  const { searchResults, loading, error } = useSelector((state) => state.flightSearch);
  const { airports = [] } = useSelector((state) => state.airport);
  const { dropdownAirlines = [] } = useSelector((state) => state.airline);

  const [sortBy, setSortBy] = React.useState("price");
  const [sortOrder, setSortOrder] = React.useState("asc");
  const [viewMode, setViewMode] = React.useState("list");
  const [showMobileFilters, setShowMobileFilters] = React.useState(false);
  const [filters, setFilters] = React.useState(createDefaultFlightFilters);

  const departureDate = formatSearchDateParam(searchData.departureDate);

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
    if (!searchData.departureAirportId || !searchData.arrivalAirportId || !departureDate) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      const params = {
        departureAirportId: searchData.departureAirportId,
        arrivalAirportId: searchData.arrivalAirportId,
        departureDate,
        passengers: searchData.passengers,
        cabinClass: searchData.cabinClass,
        sortBy,
        sortOrder,
      };

      if (filters.airlines.length > 0) params.airlines = filters.airlines;
      if (filters.priceRange.min > PRICE_LIMITS.min) params.minPrice = filters.priceRange.min;
      if (filters.priceRange.max < PRICE_LIMITS.max) params.maxPrice = filters.priceRange.max;
      if (filters.departureTimeRange !== "any") {
        params.departureTimeRange = filters.departureTimeRange;
      }
      if (filters.arrivalTimeRange !== "any") {
        params.arrivalTimeRange = filters.arrivalTimeRange;
      }
      if (filters.maxDuration < MAX_DURATION) params.maxDuration = filters.maxDuration;

      dispatch(searchFlightsAvailability(params));
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [
    departureDate,
    dispatch,
    filters,
    searchData.arrivalAirportId,
    searchData.cabinClass,
    searchData.departureAirportId,
    searchData.passengers,
    sortBy,
    sortOrder,
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

  const visibleFlights = React.useMemo(() => {
    const directFlights = searchData.directOnly
      ? resultContent.filter((flight) => (flight.totalStops ?? flight.stops ?? 0) === 0)
      : resultContent;
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
  }, [resultContent, searchData.directOnly, sortBy, sortOrder]);

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

        {loading ? (
          <div className="mt-5 grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
            <div className="hidden h-96 rounded-md border bg-card lg:block" />
            <SearchResultsLoading count={3} />
          </div>
        ) : error ? (
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
        ) : visibleFlights.length === 0 ? (
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
                <SortingBar
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSortChange={setSortBy}
                  onSortOrderChange={setSortOrder}
                  resultsCount={visibleFlights.length}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                />

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
                    />
                  ))}
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </main>
  );
};

export default SearchResults;
