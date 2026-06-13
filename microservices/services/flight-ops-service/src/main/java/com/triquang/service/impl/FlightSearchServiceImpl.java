package com.triquang.service.impl;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.time.Duration;
import java.time.LocalTime;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.triquang.client.AirlineClient;
import com.triquang.client.LocationClient;
import com.triquang.client.PricingClient;
import com.triquang.client.SeatClient;
import com.triquang.enums.CabinClassType;
import com.triquang.mapper.FlightInstanceMapper;
import com.triquang.model.FlightInstance;
import com.triquang.payload.request.FlightSearchRequest;
import com.triquang.payload.response.AircraftResponse;
import com.triquang.payload.response.AirlineResponse;
import com.triquang.payload.response.AirportResponse;
import com.triquang.payload.response.CabinClassResponse;
import com.triquang.payload.response.FareResponse;
import com.triquang.payload.response.FlightInstanceResponse;
import com.triquang.repository.FlightInstanceRepository;
import com.triquang.service.FlightSearchService;
import com.triquang.specification.FlightInstanceSpecification;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class FlightSearchServiceImpl implements FlightSearchService {

    private final FlightInstanceRepository flightInstanceRepository;
    private final LocationClient locationClient;
    private final AirlineClient airlineClient;
    private final PricingClient pricingClient;
    private final SeatClient seatClient;


    /**
     * Three-phase flight search that respects microservice boundaries
     * (no cross-service DB joins).
     *
     * <h3>Phase 1 – Cross-service filter resolution (before DB)</h3>
     * Resolves optional {@code airlines} (IATA codes) and {@code alliance}
     * to concrete airline IDs via single bulk Feign calls to airline-core-service.
     *
     * <h3>Phase 2 – DB query via JPA Specification</h3>
     * Filters everything owned by this service's own table: active/future status,
     * airports, departure date range, seat-count guard, airline IDs,
     * departure/arrival time-range buckets, max duration.
     *
     * <h3>Phase 3 – Price + cabin-class post-filter (after DB)</h3>
     * Resolves cabinClassId once from seat-service, then does a single batch
     * call to pricing-service. Filters by cabin class and price range, then
     * passes the already-fetched fare map to enrichment — no redundant calls.
     */
    @Override
    @Transactional(readOnly = true)
    public Page<FlightInstanceResponse> searchFlights(FlightSearchRequest request, Pageable pageable) {

        // ── Phase 2: paginated DB query with dynamic Specification ────────────
        Pageable sortedPageable = applySort(pageable, request.getSortBy(), request.getSortOrder());

        Specification<FlightInstance> spec =
                FlightInstanceSpecification.buildSearchSpec(request);

        Page<FlightInstance> dbPage = flightInstanceRepository.findAll(spec, sortedPageable);

        log.debug("searchFlights: DB returned {} results", dbPage.getContent().size());

        if (dbPage.isEmpty()) {
            return Page.empty(sortedPageable);
        }

        List<FlightInstance> instances = new ArrayList<>(dbPage.getContent());
        instances = instances.stream().filter(fi -> matchesPortableFilters(fi, request)).toList();

        // ── Phase 3: cabin-class + price filtering via pricing-service ────────
        // Resolve cabin class ID once (not per-instance), fetch fares once.
        Map<Long, FareResponse> fareMap = Collections.emptyMap();

        if (request.getCabinClass() != null) {
            final boolean hasPriceFilter = request.getMinPrice() != null || request.getMaxPrice() != null;
            Map<Long, Long> cabinByAircraft = new HashMap<>();
            instances.stream().map(fi -> fi.getFlight().getAircraftId()).distinct()
                    .forEach(id -> cabinByAircraft.put(id, resolveCabinClassId(request.getCabinClass(), id)));

            Map<Long, FareResponse> mergedFareMap = new HashMap<>();
            instances.stream()
                    .filter(fi -> cabinByAircraft.get(fi.getFlight().getAircraftId()) != null)
                    .collect(Collectors.groupingBy(fi -> cabinByAircraft.get(fi.getFlight().getAircraftId())))
                    .forEach((cabinId, group) -> {
                        List<Long> flightIds = group.stream().map(fi -> fi.getFlight().getId()).distinct().toList();
                        try {
                            mergedFareMap.putAll(pricingClient.getLowestFarePerFlight(flightIds, cabinId));
                        } catch (Exception e) {
                            log.warn("pricing-service batch call failed for cabinClassId={}: {}", cabinId, e.getMessage());
                        }
                    });

            List<FlightInstance> filtered = instances.stream().filter(fi -> {
                FareResponse fare = mergedFareMap.get(fi.getFlight().getId());
                if (fare == null) return false;
                Double price = fare.getTotalPrice();
                return !hasPriceFilter || price != null
                        && (request.getMinPrice() == null || price >= request.getMinPrice())
                        && (request.getMaxPrice() == null || price <= request.getMaxPrice());
            }).toList();

            fareMap = mergedFareMap;
            instances = filtered;

            if (instances.isEmpty()) {
                return Page.empty(sortedPageable);
            }
        }


        // ── Enrichment: airline + airport (per-request cache), fare already fetched ──
        List<FlightInstanceResponse> responses = enrichWithExternalData(instances, fareMap);

        log.debug("searchFlights: returning {} enriched results", responses.size());

        // totalElements from DB page may slightly overcount when price filter
        // removes results post-DB. For perfect counts at scale use a search index.
        return new PageImpl<>(responses, sortedPageable, dbPage.getTotalElements());
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Resolves the cabin class ID from seat-service once for the whole page.
     * Tries each unique aircraft in the result set until one succeeds.
     * Returns null if seat-service is unavailable or the cabin class doesn't exist.
     */
    private Long resolveCabinClassId(CabinClassType cabinClassName, Long aircraftId) {
        try {
            CabinClassResponse cabin = seatClient.getCabinClassByAircraftIdAndName(cabinClassName, aircraftId);
            if (cabin != null) return cabin.getId();
        } catch (Exception e) {
            log.warn("seat-service call failed for aircraftId={}: {}", aircraftId, e.getMessage());
        }
        return null;
    }

    private boolean matchesPortableFilters(FlightInstance instance, FlightSearchRequest request) {
        if (request.getMaxDuration() != null
                && Duration.between(instance.getDepartureDateTime(), instance.getArrivalDateTime()).toMinutes()
                > request.getMaxDuration()) {
            return false;
        }
        return matchesTimeRange(instance.getDepartureDateTime().toLocalTime(), request.getDepartureTimeRange())
                && matchesTimeRange(instance.getArrivalDateTime().toLocalTime(), request.getArrivalTimeRange());
    }

    private boolean matchesTimeRange(LocalTime time, String range) {
        if (range == null || range.isBlank() || range.equalsIgnoreCase("any")) return true;
        int hour = time.getHour();
        return switch (range.toLowerCase()) {
            case "morning" -> hour >= 6 && hour <= 11;
            case "afternoon" -> hour >= 12 && hour <= 17;
            case "evening" -> hour >= 18 && hour <= 20;
            case "night" -> hour >= 21 || hour <= 5;
            default -> true;
        };
    }

    /**
     * Fetches airline and airport details from remote services, deduplicating
     * calls with per-invocation caches so each unique ID is fetched at most once.
     * Uses the already-fetched {@code fareMap} — no extra calls to pricing or seat services.
     */
    private List<FlightInstanceResponse> enrichWithExternalData(
            List<FlightInstance> instances,
            Map<Long, FareResponse> fareMap) {

        Map<Long, AirlineResponse> airlineCache  = new HashMap<>();
        Map<Long, AirportResponse> airportCache  = new HashMap<>();
        Map<Long, AircraftResponse> aircraftCache = new HashMap<>();
        List<FlightInstanceResponse> results = new ArrayList<>(instances.size());

        for (FlightInstance fi : instances) {
            try {
                AircraftResponse aircraft = aircraftCache.computeIfAbsent(
                        fi.getFlight().getAircraftId(), airlineClient::getAircraftById);

                AirlineResponse airline = airlineCache.computeIfAbsent(
                        fi.getAirlineId(), airlineClient::getAirlineById);

                AirportResponse depAirport = airportCache.computeIfAbsent(
                        fi.getDepartureAirportId(), locationClient::getAirportById);

                AirportResponse arrAirport = airportCache.computeIfAbsent(
                        fi.getArrivalAirportId(), locationClient::getAirportById);

                FlightInstanceResponse response = FlightInstanceMapper.toResponse(
                        fi, aircraft, airline, depAirport, arrAirport);

                // Attach the pre-fetched fare (null if no cabin filter was applied)
                response.setFare(fareMap.get(fi.getFlight().getId()));

                results.add(response);

            } catch (Exception e) {
                log.error("searchFlights: enrichment failed for FlightInstance id={} – skipping: {}",
                        fi.getId(), e.getMessage());
            }
        }
        return results;
    }

    /**
     * Builds a sort-aware {@link Pageable}.
     *
     * <table>
     *   <tr><th>sortBy</th><th>DB expression</th></tr>
     *   <tr><td>departure (default)</td><td>departureDateTime</td></tr>
     *   <tr><td>arrival</td><td>arrivalDateTime</td></tr>
     *   <tr><td>duration</td><td>falls back to departureDateTime; duration is cross-service post-filtered</td></tr>
     *   <tr><td>price</td><td>falls back to departureDateTime (price lives in pricing-service)</td></tr>
     * </table>
     */
    private Pageable applySort(Pageable pageable, String sortBy, String sortOrder) {
        Sort.Direction direction = "desc".equalsIgnoreCase(sortOrder)
                ? Sort.Direction.DESC : Sort.Direction.ASC;

        Sort sort = (sortBy == null || sortBy.isBlank())
                ? Sort.by(direction, "departureDateTime")
                : switch (sortBy.toLowerCase()) {
                    case "arrival"  -> Sort.by(direction, "arrivalDateTime");
                    case "duration" -> Sort.by(direction, "departureDateTime");
                    default         -> Sort.by(direction, "departureDateTime");
                };

        return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);
    }
}
