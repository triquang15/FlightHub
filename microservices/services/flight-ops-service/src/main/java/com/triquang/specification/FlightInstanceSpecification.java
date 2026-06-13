package com.triquang.specification;

import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;

import com.triquang.enums.FlightStatus;
import com.triquang.model.FlightInstance;
import com.triquang.payload.request.FlightSearchRequest;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * JPA Specification for dynamic {@link FlightInstance} search.
 *
 * <h3>What this class handles (pure DB filters)</h3>
 * <ul>
 *   <li>isActive = true</li>
 *   <li>Status not in {CANCELLED, COMPLETED, DIVERTED}</li>
 *   <li>departureDateTime strictly in the future</li>
 *   <li>Origin / destination airport IDs</li>
 *   <li>Departure date range (startOfDay … endOfDay)</li>
 *   <li>Total available seats &ge; requested passengers (general guard)</li>
 *   <li>Airline IDs (pre-resolved from IATA codes / alliance in the service layer)</li>
 * </ul>
 *
 * <h3>What this class does NOT handle</h3>
 * <ul>
 *   <li><b>Price filtering</b> – fare data lives in pricing-service; handled in
 *       the service layer via a single batch Feign call after the DB query.</li>
 *   <li><b>Per-cabin-class seat count</b> – FlightInstanceCabin lives in
 *       seat-service; the {@code availableSeats} guard here is aggregate.</li>
 * </ul>
 *
 * Time-bucket and duration filters are intentionally handled in the service layer
 * so this specification remains portable across PostgreSQL and H2.
 */
public class FlightInstanceSpecification {

    private static final Set<FlightStatus> EXCLUDED_STATUSES = Set.of(
            FlightStatus.CANCELLED,
            FlightStatus.COMPLETED,
            FlightStatus.DIVERTED
    );

    private FlightInstanceSpecification() {}

    /**
     * Builds a composite {@link Specification} from the search request.
     *
     * @param request search criteria – all fields null-safe / optional

     */
    public static Specification<FlightInstance> buildSearchSpec(
            FlightSearchRequest request) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            /*
             * Eagerly fetch the Flight association so the mapper can read
             * flight.flightNumber without an extra SELECT per row.
             * Skip for count queries (Long return type) that Spring Data issues
             * internally for pagination totals.
             */
//            if (query.getResultType() != Long.class && query.getResultType() != long.class) {
//                root.fetch("flight", JoinType.LEFT);
//            }

            // ── Always-on real-world rules ───────────────────────────────────

            // 1. Only active instances
            predicates.add(cb.isTrue(root.get("isActive")));

            // 2. Exclude terminal statuses
            predicates.add(root.get("status").in(EXCLUDED_STATUSES).not());

            // 3. Flight must still be in the future
            predicates.add(cb.greaterThan(root.get("departureDateTime"), LocalDateTime.now()));

            // 4. Origin airport
            predicates.add(cb.equal(root.get("departureAirportId"), request.getDepartureAirportId()));

            // 5. Destination airport
            predicates.add(cb.equal(root.get("arrivalAirportId"), request.getArrivalAirportId()));

            // ── Optional DB-level filters ────────────────────────────────────

            // 6. Departure date: entire calendar day (startOfDay … endOfDay inclusive)
            if (request.getDepartureDate() != null) {
                LocalDateTime startOfDay = request.getDepartureDate().atStartOfDay();
                LocalDateTime endOfDay   = request.getDepartureDate().atTime(LocalTime.MAX);
                predicates.add(cb.between(root.get("departureDateTime"), startOfDay, endOfDay));
            }

            // 7. Seat availability guard – total available seats >= passengers
            //    (per-cabin availability is checked at booking time via seat-service)
            if (request.getPassengers() != null) {
                predicates.add(cb.greaterThanOrEqualTo(
                        root.get("availableSeats"), request.getPassengers()));
            }

            // 8. Airline IDs (optional – pass a non-empty list to restrict results)
            if (request.getAirlines() != null && !request.getAirlines().isEmpty()) {
                predicates.add(root.get("airlineId").in(request.getAirlines()));
            }

            query.distinct(true);
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

}
