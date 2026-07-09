# Ancillary Service Overview

## Purpose and ownership

`ancillary-service` owns airline ancillary and meal catalogs, their sellable
assignment to flights, and insurance coverage definitions. Flights, cabin
classes, airlines, bookings, and payments remain owned by their respective
services and are referenced by ID.

```text
Airline 1 -- * Ancillary 1 -- * Flight Cabin Ancillary * -- 1 Flight/Cabin
        \-- * Meal      1 -- * Flight Meal             * -- 1 Flight
```

## Authorization and ownership

- All external traffic enters through API Gateway with Bearer JWT.
- Create, update, availability, and delete routes require `ROLE_AIRLINE_OWNER`.
- The service resolves the owner airline from `X-User-Id`; client-provided airline
  IDs are never authoritative.
- Flight assignments verify that the Flight belongs to the owner and that the
  Cabin Class belongs to the Flight aircraft.
- Catalog and assignment updates cannot cross airline ownership boundaries.

## Commercial rules

- Currency is a normalized three-letter ISO code.
- Prices must be finite and non-negative.
- An included-in-fare ancillary is persisted with price `0` and is not charged
  again during booking.
- One Ancillary may be assigned only once per `(flight, cabin class)`.
- One Meal may be assigned only once per Flight.
- Assignment identity is immutable. To move an assignment, delete and recreate it.
- Price calculation rejects missing, duplicate, or unavailable selections instead
  of silently undercharging.
- An Ancillary or Meal already assigned to a Flight cannot be hard deleted.
- Meal code uniqueness is scoped to an Airline, not the whole platform.
- When advance booking is required, `advanceBookingHours` must be positive;
  otherwise it is cleared.
- Missing optional products such as meals, baggage upgrades, or travel
  protection should be treated as an empty catalog in the booking UI, not as a
  checkout blocker.
- Required fare-included products should be modeled as included assignments with
  price `0`, so Booking can display them without double charging.

The current Booking contract sends selected assignment IDs without quantities.
Consequently, price calculation charges one unit per selected ID. Quantity-aware
shopping requires a future request model containing assignment ID and quantity.

Booking review integration:

- `BAGGAGE`, `MEAL`, and `TRAVEL_PROTECTION` lookups are optional enhancements.
- A `404` or empty response for a flight/cabin assignment means that no product
  is configured for that specific sellable context.
- Frontend components must normalize paginated/enveloped API responses into
  arrays before rendering.
- Booking should validate selected ancillary IDs at purchase time to prevent
  stale or unavailable selections from being charged.

## Service dependencies

- `airline-core-service`: resolves the airline owned by the authenticated user.
- `flight-ops-service`: verifies Flight ownership and aircraft identity.
- `seat-service`: verifies Cabin Class membership on the Flight aircraft.
- PostgreSQL `airline_ancillary_db`: source of truth.
- API Gateway: JWT validation, owner role enforcement, routing, and Swagger proxy.

## Deployment

Run the integrity migration before deploying against an existing database:

```bash
psql "$ANCILLARY_DATABASE_URL" -v ON_ERROR_STOP=1 \
  -f microservices/Documentation/sql/2026-06-20-migrate-ancillary-commercial-integrity.sql
```

The migration adds Flight Meal currency, changes Meal code uniqueness to
`(airline_id, code)`, and protects assignment natural keys.

Seed the production-style demo catalogs and Flight assignments after Airline,
Flight Ops, and Seat data exist:

```bash
bash microservices/scripts/init-production-demo-data.sh
```

The workflow resolves Airline, Flight, Aircraft, and Cabin Class IDs from their
own databases before seeding Ancillary. Set `SEED_ANCILLARY=false` on the
Docker-network runner when Ancillary data should be skipped. The Ancillary seed
is idempotent by catalog and assignment business keys. The full demo seed covers
the main customer search routes with baggage, meal, and travel-protection
examples where configured.

Verify the resulting data:

```bash
psql "$ANCILLARY_DATABASE_URL" -v ON_ERROR_STOP=1 \
  -f microservices/Documentation/sql/verify-production-ancillary-service.sql
```

## API groups

| Group | Paths | Purpose |
| --- | --- | --- |
| Ancillary catalog | `/api/ancillaries/**` | Airline sellable ancillary definitions |
| Insurance | `/api/insurance-coverages/**` | Coverage policies attached to insurance ancillaries |
| Meal catalog | `/api/meals/**` | Airline meal definitions |
| Flight meals | `/api/flight-meals/**` | Meal availability and price per Flight |
| Flight cabin ancillaries | `/api/flight-cabin-ancillaries/**` | Ancillary availability and price per Flight/Cabin |

Swagger UI is available through Gateway at `http://localhost:8080/swagger-ui.html`.
The proxied OpenAPI document is
`http://localhost:8080/docs/ancillary-service/v3/api-docs`.
