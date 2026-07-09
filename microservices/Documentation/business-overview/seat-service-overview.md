# Seat Service Overview

This document describes the FlightHub `seat-service` business contract,
ownership boundaries, lifecycle rules, cross-service contracts, seed data, and
verification workflow.

## Business Overview

`seat-service` owns aircraft cabin definitions, seat map templates, and
per-flight-instance seat inventory.

The service converts an aircraft's configured cabin layout into seat instances
when `flight-ops-service` creates a flight instance. Booking and checkout flows
then use those seat instances to hold, release, and confirm seats.

Core capabilities:

- Manage cabin classes for aircraft.
- Manage seat maps and generated physical seat templates.
- Generate seat inventory for each flight instance.
- Hold one or more selected seats during checkout.
- Release expired or abandoned holds.
- Confirm booked seats after booking/payment succeeds.
- Expose availability by `flightInstanceId`.

## Ownership

The service owns:

- `cabin_classes`
- `seat_maps`
- `seats`
- `flight_instance_cabins`
- `seat_instances`

The service does not own:

- Aircraft master data, owned by `airline-core-service`.
- Flight lifecycle and schedules, owned by `flight-ops-service`.
- Fare pricing, owned by `pricing-service`.
- Booking/payment lifecycle, owned by `booking-service` and `payment-service`.

Cross-service references are stored as IDs:

- `CabinClass.aircraftId` references Airline Core `Aircraft.id`.
- `SeatMap.airlineId` references Airline Core `Airline.id`.
- `SeatInstance.flightId` references Flight Ops `Flight.id`.
- `SeatInstance.flightInstanceId` references Flight Ops `FlightInstance.id`.

## Seat Lifecycle

Seat instances use this production lifecycle:

```text
AVAILABLE -> HELD -> BOOKED
AVAILABLE -> BLOCKED
HELD -> AVAILABLE
HELD -> BOOKED
BLOCKED -> AVAILABLE
```

Rules:

- `AVAILABLE`: bookable by customers.
- `HELD`: temporarily reserved during checkout. It has a `holdToken`,
  optional `heldByUserId`, and `holdExpiresAt`.
- `BOOKED`: confirmed by booking/payment and no longer available.
- `BLOCKED`: airline/admin operational block.
- `OCCUPIED`: kept for backward compatibility, but new booking flows should use
  `BOOKED`.

Hold duration defaults to 10 minutes and is capped by API validation.

Expired holds are released when availability, count, or hold operations are
performed for the same flight instance.

Production booking behavior:

- Customers may book multiple seats in one checkout when passenger count is
  greater than one.
- Each selected seat must belong to the requested flight instance.
- A seat already `HELD` by another valid token or already `BOOKED` must not be
  shown as selectable by the UI and must be rejected by the hold endpoint.
- A checkout may continue without seat selection only when the business product
  allows automatic seat assignment. In that case Booking must not send seat IDs.
- Once payment confirms a booking, selected seats become `BOOKED` and are no
  longer returned as available for later customers.

## API Contract

Primary customer/booking endpoints:

```http
GET  /api/seat-instances/flight-instance/{flightInstanceId}
GET  /api/seat-instances/flight-instance/{flightInstanceId}/available
GET  /api/seat-instances/flight-instance/{flightInstanceId}/available/count
POST /api/seat-instances/hold
POST /api/seat-instances/release
POST /api/seat-instances/confirm
```

Compatibility endpoints by `flightId` remain available, but new clients should
prefer `flightInstanceId` because a flight definition can have many dated
instances.

### Hold Seats

Request:

```json
{
  "flightInstanceId": 1001,
  "seatInstanceIds": [501, 502],
  "userId": 42,
  "holdMinutes": 10
}
```

Response includes:

- `holdToken`
- `holdExpiresAt`
- held seat instance responses

The booking frontend must store the `holdToken` for release/confirm calls.

### Release Seats

```json
{
  "seatInstanceIds": [501, 502],
  "holdToken": "uuid-token"
}
```

Release returns the seats to `AVAILABLE` unless they are already `BOOKED`.

### Confirm Seats

```json
{
  "seatInstanceIds": [501, 502],
  "holdToken": "uuid-token",
  "bookingReference": "FH-20260618-0001"
}
```

`booking-service` may also confirm seats through the existing
`BookingConfirmedEvent`. That event path is trusted and remains compatible with
current booking flows that do not yet call hold first.

For multi-leg itineraries, the current public seat selection UI should only send
seat IDs for the leg whose `flightInstanceId` owns those seats. Booking validates
the seat scope before creating the payment intent.

## Swagger / OpenAPI

Seat Service is published through the API Gateway Swagger UI:

```text
http://localhost:8080/swagger-ui.html
```

Select **Seat Service**, click **Authorize**, and enter a valid Bearer JWT.
Use the gateway for manual testing because it validates the token and injects
trusted identity headers such as `X-User-Id`.

Useful OpenAPI endpoints:

```text
http://localhost:8080/docs/seat-service/v3/api-docs
http://localhost:8080/docs/seat-service/v3/api-docs/cabin-classes
http://localhost:8080/docs/seat-service/v3/api-docs/seat-maps
http://localhost:8080/docs/seat-service/v3/api-docs/seats
http://localhost:8080/docs/seat-service/v3/api-docs/seat-instances
http://localhost:8080/docs/seat-service/v3/api-docs/flight-instance-cabins
```

## Event Contracts

### FlightInstanceCreatedEvent

Published by `flight-ops-service`.

`seat-service` consumes the event and generates:

- one `FlightInstanceCabin` per active/bookable cabin class
- one `SeatInstance` per physical seat in the cabin's seat map

Generation is idempotent. If inventory already exists for the
`flightInstanceId`, duplicate Kafka deliveries are ignored.

### BookingConfirmedEvent

Published by `booking-service`.

`seat-service` confirms all `seatInstanceIds` as `BOOKED` and stores the booking
reference on each seat instance.

## Concurrency

Seat state changes lock selected `SeatInstance` rows with pessimistic write
locks. This protects against two customers holding or confirming the same seat
at the same time.

Production concurrency expectations:

- Two browser sessions selecting the same seat should result in one successful
  hold and one business error.
- Releasing an already booked seat must not make it available again.
- Repeating a hold with the same valid token should not create duplicate seat
  state.
- Expired holds are cleaned up before new availability and hold checks.

The database also has natural uniqueness for:

- `(flight_instance_id, cabin_class_id)` on `flight_instance_cabins`
- `(flight_instance_id, seat_id)` on `seat_instances`

## Seat Map Zones

Production layouts are represented with `SeatMapZone` row ranges. A seat map can
have one or more zones:

```text
SeatMap 1 ---- * SeatMapZone
```

Each zone defines:

- `startRow`
- `endRow`
- `leftSeatsPerRow`
- `rightSeatsPerRow`
- optional `seatsInLastRow`
- `displayOrder`

`seatsInLastRow` supports exact cabin capacity when the final row is partial.
For example, a 29-seat business cabin with a 2-4 row layout can be modeled as
four full six-seat rows plus one partial five-seat final row:

```text
4 full rows * 6 seats + 1 partial row * 5 seats = 29 seats
```

The legacy `SeatMap.totalRows`, `leftSeatsPerRow`, and `rightSeatsPerRow` fields
remain as the default/fallback layout for older clients. New production flows
should send zones when a cabin has mixed row ranges, partial final rows, suites,
blocked crew rests, bassinet zones, or other non-uniform layouts.

## Seed Data

The production-style demo seed creates:

- cabin classes for seeded aircraft
- one seat map per cabin class
- seat map zones with row ranges and partial final rows
- generated physical seats for each map
- hold lifecycle columns and natural uniqueness constraints if missing
- booking-ready seat instances for the generated Flight Ops schedule window
- inventory for the added one-way and round-trip demo routes used by customer
  search and super admin analytics

Seed file:

```text
Documentation/sql/2026-06-08-seed-production-seat-service.sql
```

Verification file:

```text
Documentation/sql/verify-production-seat-service.sql
```

Run through:

```bash
microservices/scripts/init-production-demo-data.sh
```

Expected local demo characteristics after a full reset and seed:

- Seat maps exist for all aircraft/cabin classes used by seeded flights.
- Upcoming flight instances have corresponding seat inventory.
- Customer search results can open seat selection for seeded routes.
- Already booked seats remain unavailable after successful checkout.

## Production Checklist

- Prefer `flightInstanceId` APIs in frontend and booking service.
- Call `hold` before checkout/payment.
- Call `release` on checkout cancellation or timeout.
- Confirm via booking/payment success only.
- Never allow public clients to patch arbitrary statuses.
- Use seat map zones for exact real-world airline layouts.
- Monitor duplicate event skips and hold expiration rates.
