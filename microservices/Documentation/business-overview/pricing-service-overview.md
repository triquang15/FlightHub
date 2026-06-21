# Pricing Service Overview

## Purpose and ownership

`pricing-service` owns the commercial products sold for a flight cabin:

- **Fare**: a named sellable price product for one Flight and Cabin Class.
- **FareRules**: refund and change conditions attached to one Fare.
- **BaggagePolicy**: cabin and checked baggage allowances attached to one Fare.

It does not own Flights, Cabin Classes, Airlines, bookings, payments, or seat
inventory. Those records are referenced by cross-service IDs.

```text
Flight (Flight Ops) 1 ---- * Fare * ---- 1 Cabin Class (Seat)
                              |
                              +---- 0..1 Fare Rules
                              |
                              +---- 0..1 Baggage Policy
```

## Access model

All browser and external API traffic should enter through API Gateway. The
gateway validates the Bearer JWT and injects trusted identity headers including
`X-User-Id` and `X-User-Roles`.

- Pricing mutations require `ROLE_AIRLINE_OWNER` at the gateway.
- Fare owner list/detail/create/update/delete operations enforce airline ownership
  inside `pricing-service`. Ownership is stored on the Fare and verified against
  the selected Flight during writes.
- Fare Rule create/read/update/delete operations also enforce airline ownership
  inside `pricing-service`.
- Fare Rule ownership is derived from the authenticated owner. A client-provided
  `airlineId` is not authoritative.
- Customer-facing Fare Rule lookup by `fareId` remains available to authenticated
  booking flows.

Current hardening boundary: Baggage Policy mutations are role-protected at the
gateway, but their service methods do not yet perform the same owner-level resource
validation as Fare and Fare Rules. Do not treat direct service-port access as an
authorization boundary.

## Fare business rules

- `name`, `rbdCode`, `flightId`, `cabinClassId`, and positive `baseFare` are required.
- A Fare is unique in application logic by `(flightId, cabinClassId, name)`.
- `currentPrice` is calculated server-side as `baseFare + taxesAndFees + airlineFees`.
  A client-provided total is not authoritative.
- `totalPrice` in the response is calculated from base fare and fees. It is not a
  separately persisted source of truth.
- Seat, boarding, in-flight, flexibility, and premium benefits are embedded in
  the Fare aggregate.
- Deleting a Fare cascades to its Fare Rule and Baggage Policy through the local
  aggregate relationship.
- Lowest-fare search returns at most one Fare per Flight for the requested Cabin
  Class ID. Missing map keys mean no sellable Fare exists for that flight/cabin.

The model currently stores numeric amounts without a currency column. Existing
admin UI and demo data interpret them as INR. Multi-currency support requires an
explicit ISO 4217 currency code before production use across markets.

Before deploying owner-scoped Fare APIs over an existing database, run:

```bash
psql "$PRICING_DATABASE_URL" -v ON_ERROR_STOP=1 \
  -f microservices/Documentation/sql/2026-06-20-migrate-pricing-fare-ownership.sql
```

The migration backfills ownership from existing Fare Rules or Baggage Policies
and stops if any legacy Fare still requires manual airline mapping.

## Fare Rule business rules

- Each Fare may have at most one Fare Rule.
- `ruleName` and `fareId` are required.
- A rule cannot be moved to another Fare during update.
- Refund and change policies are independent.
- When `isRefundable` is false, `cancellationFee` and `refundDeadlineDays` are cleared.
- When `isChangeable` is false, `changeFee` and `changeDeadlineHours` are cleared.
- Fees and deadlines must be zero or positive.
- Zero fees mean the permitted action is free.
- Refund deadlines are measured in days before scheduled departure.
- Change deadlines are measured in hours before scheduled departure.

Fare Rules describe future purchase and servicing behavior. A booking workflow
should snapshot applicable commercial terms when a ticket is issued; relying on
the mutable current Fare Rule for historical tickets is not sufficient.

## Baggage Policy business rules

- Each Fare may have at most one Baggage Policy.
- Policy name and Fare ID are required.
- Cabin and checked baggage weights, dimensions, pieces, and free allowances must
  be zero or positive.
- Priority and extra-allowance flags default to false.

## Service dependencies

Runtime dependencies used by owner-scoped Fare Rules:

- `airline-core-service`: resolves the Airline owned by `X-User-Id`.
- `flight-ops-service`: verifies that the Fare's Flight belongs to that Airline.
- PostgreSQL `airline_pricing_db`: persistent source of truth.
- Redis: short-lived Fare caches.
- API Gateway: JWT validation, role enforcement, routing, and trusted headers.

Recommended local startup order:

1. PostgreSQL databases and Redis
2. Service Registry
3. Config Server
4. User, Airline Core, Seat, and Flight Ops services
5. Pricing Service
6. API Gateway
7. Web frontend

## Main API contracts

### Fares

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/fares` | Create a Fare |
| `POST` | `/api/fares/bulk` | Bulk create Fares |
| `GET` | `/api/fares/{id}` | Read one Fare |
| `GET` | `/api/fares/flight/{flightId}/cabin-class/{cabinClassId}` | List Fare options |
| `POST` | `/api/fares/search?cabinClassId={id}` | Lowest Fare per Flight |
| `GET` | `/api/fares/lowest/flight/{flightId}/cabin-class/{cabinClassId}` | Lowest single Fare |

### Fare Rules

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/fare-rules` | Create an owned Fare Rule |
| `GET` | `/api/fare-rules/airline` | List the authenticated owner's rules |
| `GET` | `/api/fare-rules/{id}` | Read an owned rule |
| `GET` | `/api/fare-rules/fare/{fareId}` | Read customer-facing terms by Fare |
| `PUT` | `/api/fare-rules/{id}` | Update an owned rule |
| `DELETE` | `/api/fare-rules/{id}` | Delete an owned rule |

### Baggage Policies

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/baggage-policies` | Create a policy |
| `POST` | `/api/baggage-policies/bulk` | Bulk create policies |
| `GET` | `/api/baggage-policies/fare/{fareId}` | Read policy by Fare |
| `PUT` | `/api/baggage-policies/{id}` | Update a policy |
| `DELETE` | `/api/baggage-policies/{id}` | Delete a policy |

## Seed and verification

The production-style seed runner resolves Flight IDs from Flight Ops and Cabin
Class IDs from Seat before writing Pricing data. It creates multiple Fare tiers
with one Fare Rule and one Baggage Policy per Fare. The SQL is safe to re-run by
the Fare natural key `(flightId, cabinClassId, name)`.

```bash
bash microservices/scripts/init-production-demo-data.sh
```

Verify Pricing directly:

```bash
psql "$PRICING_DATABASE_URL" -v ON_ERROR_STOP=1 \
  -f microservices/Documentation/sql/verify-production-pricing-service.sql
```

## Swagger

Use the shared Gateway Swagger UI and select **Pricing Service**:

```text
http://localhost:8080/swagger-ui.html
```

Useful direct documents:

```text
http://localhost:8080/docs/pricing-service/v3/api-docs
```

Use the Gateway URL for owner mutations because direct Swagger calls do not
receive trusted identity headers unless they are supplied by infrastructure.
