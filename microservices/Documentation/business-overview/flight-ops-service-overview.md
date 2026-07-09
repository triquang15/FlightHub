# Flight Ops Service Overview

## Purpose and ownership

`flight-ops-service` owns the operational flight catalog:

- **Flight**: an airline-owned reusable flight number, aircraft assignment, and route.
- **FlightSchedule**: an airline-owned recurrence rule using each airport's local wall-clock time.
- **FlightInstance**: one dated departure generated from a schedule and the source of truth for operational status.

It does not own airline/aircraft/airport details, cabin inventory, fares, bookings, or payments. Cross-service IDs are validated but not duplicated as writable business data.

## Current production-demo readiness

The current local production-demo dataset is designed for end-to-end customer
search, booking review, seat hold, payment, booking history, ticket, and super
admin analytics tests.

- 38 reusable Flight definitions are seeded across 9 active airlines.
- 29 commercial route pairs are covered, including Vietnam domestic routes,
  ASEAN routes, and long-haul demo routes.
- Schedules generate a rolling 90-day future instance window.
- The seed is idempotent and can be re-run after `docker compose ... down -v`.
- Search supports one-way, round-trip, and multi-city frontend flows. Flight Ops
  returns sellable dated instances; Booking owns the final itinerary/payment
  record.

## Access model

All writes must enter through API Gateway. The gateway removes spoofed identity headers and injects trusted `X-User-Id`, `X-User-Roles`, and `X-Trace-Id`.

- Airline owners may mutate only flights belonging to their airline.
- System administrators may use dedicated administrative workflows, but do not bypass airline ownership in the current public mutation API.
- Read APIs used by Seat, Pricing, and Booking remain available through authenticated gateway routes.
- Services must still enforce ownership; gateway role checks are defense in depth, not authorization by themselves.

## Business rules

### Flight

- Flight number is normalized to uppercase and unique.
- Departure and arrival airports must differ and exist in Location.
- Aircraft must exist and belong to the owner's airline.
- Client-provided `airlineId` and status are not authoritative.
- A master Flight uses `SCHEDULED` or `CANCELLED`; dated operational lifecycle belongs to FlightInstance.
- Deleting a Flight is a soft business cancellation so schedules and operational history remain intact.

### Schedule

- Schedule route must match its Flight route.
- `startDate <= endDate`, operating days must not be empty, and airport references must exist.
- Departure and arrival times are local wall-clock times at their respective airports.
- Generation compares departure and arrival instants using both airports' IANA timezones, then advances the
  arrival local date until its instant is after departure. This handles overnight and westbound date changes.
- Generation is idempotent by `(flight_id, departure_date_time)`.
- Updating a schedule creates missing instances. It never overwrites an existing operational instance.
- Deleting a schedule deactivates it; it does not erase operational history.

The current model stores `LocalDateTime`. Consumers must interpret departure using the departure airport timezone and arrival using the arrival airport timezone. A future UTC migration should add explicit instants without changing these local display values.

### Flight instance lifecycle

Canonical transitions:

```text
SCHEDULED -> BOARDING -> DEPARTED -> ARRIVED
     |           |           |
     +-----------+-----------+-> CANCELLED
```

`ARRIVED` and `CANCELLED` are terminal and inactive. Legacy enum values (`DELAYED`, `IN_AIR`, `LANDED`, `DIVERTED`, `COMPLETED`) remain readable for old data but new transition APIs reject them.

An instance with sold/held seats (`availableSeats < totalSeats`) cannot be deleted. Status changes must use the dedicated status endpoint.

## Service contracts

### Seat

- Flight Ops publishes `FlightInstanceCreatedEvent { flightInstanceId, aircraftId, flightId }` once for a newly-created instance.
- Seat creates cabin inventory from the aircraft cabin layout.
- Search resolves cabin classes by aircraft. It caches each aircraft lookup within a request.
- Booking-time cabin availability is authoritative in Seat; aggregate `FlightInstance.availableSeats` is only a coarse search guard.

### Pricing

- Search groups candidate flights by resolved `cabinClassId`.
- For each cabin class it calls `POST /api/fares/search?cabinClassId=...` once with distinct flight IDs.
- Pricing returns `Map<flightId, lowestFare>`. Missing keys mean that flight is not sellable for that cabin.
- Pricing owns fare and currency; Flight Ops does not persist them.

### Booking

- Booking reads immutable route/timing snapshots from FlightInstance.
- Booking/Seat must lock their own inventory during purchase. Flight Ops lifecycle changes do not replace booking transaction guarantees.
- Multi-leg booking uses FlightInstance IDs from each selected leg. Flight Ops
  does not create a separate itinerary aggregate.

## Search behavior

Database filters cover route, date, active lifecycle, airline, aggregate seats, and future departure. Duration/time-bucket filtering is applied in Java to remain PostgreSQL portable. Seat lookups are deduplicated by aircraft and Pricing lookups are batched by cabin class.

Price/cabin filters happen after the Flight Ops page query, so `totalElements` can be an upper bound. For exact cross-service pagination at high scale, project Flight Ops, Seat, and Pricing events into a dedicated search index.

Frontend query compatibility:

- Canonical query params are `from`, `to`, `depart`, `return`, `passengers`,
  `cabinClass`, and `trip`.
- Legacy params such as `departureAirportId`, `arrivalAirportId`,
  `departureDate`, and `tripType` are normalized by the frontend utility layer.
- Round-trip search performs two one-way searches and pairs the selected fares
  before sending a multi-leg booking request.
- Multi-city search uses ordered one-way segments. The backend supports up to 5
  booking legs in one Booking request.

## Seed and verification

Run production demo seed through `scripts/init-production-demo-data.sh`, then run:

The demo dataset provides 38 flight definitions across 9 airlines and 29 route
pairs. Schedules generate a rolling 90-day set of future instances and the seed
is safe to re-run without duplicating flights, schedules, or instances.

Useful search examples after seeding:

```text
/search?from=1&to=2&depart=2026-07-10&passengers=1&cabinClass=ECONOMY&trip=oneway
/search?from=1&to=2&depart=2026-07-10&return=2026-07-13&passengers=1&cabinClass=ECONOMY&trip=round
/search?from=1&to=7&depart=2026-07-10&return=2026-07-12&passengers=1&cabinClass=ECONOMY&trip=round
```

```bash
psql "$FLIGHT_OPS_DATABASE_URL" -v ON_ERROR_STOP=1 \
  -f Documentation/sql/verify-production-flight-ops.sql
```

The verifier checks duplicate natural keys, invalid routes/times/capacity, schedule linkage, and canonical active statuses.

## Frontend smoke test

After the full stack and demo seed are running:

1. Sign in as an airline owner and open `/airline/flights`.
2. Create a Flight using an aircraft owned by that airline and two different airports.
3. Create a daily or weekly Schedule and confirm generated instances appear under `/airline/instances`.
4. Submit the same Schedule update again and confirm it does not create duplicate instances.
5. Inspect an overnight or cross-timezone schedule and confirm arrival is after departure.
6. Move one instance through `SCHEDULED -> BOARDING -> DEPARTED -> ARRIVED`.
7. Confirm invalid skipped transitions and transitions from terminal statuses are rejected.
8. Confirm a booked or non-Scheduled instance cannot be permanently deleted.
9. Deactivate a Schedule and confirm existing instances remain as operational history.
10. Sign in as System Admin, open `/super-admin/flights`, and confirm inventory is read-only.

## Swagger and API testing

Use the shared API Gateway Swagger UI:

```text
http://localhost:8080/swagger-ui.html
```

Select **Flight Operations Service**, click **Authorize**, and enter a valid
Bearer JWT. Test owner mutations through the gateway because it validates the
JWT and injects trusted identity headers.

Useful OpenAPI endpoints:

```text
http://localhost:8080/docs/flight-ops-service/v3/api-docs
http://localhost:8084/swagger-ui.html
http://localhost:8084/v3/api-docs
```
