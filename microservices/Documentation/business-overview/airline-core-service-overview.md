# Airline Core Service Overview

This document describes the current FlightHub `airline-core-service` business
contract, implementation boundaries, API behavior, security model, caching,
Swagger documentation, and local verification workflow.

## Business Overview

`airline-core-service` owns the airline and aircraft master data used across
FlightHub.

The service represents two related business concepts:

- Airline: the commercial carrier profile, ownership record, support contact,
  approval state, alliance, and headquarters reference.
- Aircraft: an individual aircraft belonging to an airline, including its
  capacity, cabin layout, operational status, availability, maintenance date,
  and current airport reference.

This service is the source of truth for airline identity and fleet inventory.
Other services should reference airlines and aircraft by ID instead of
duplicating their master records.

The service supports these platform capabilities:

- Airline onboarding and profile management.
- System administrator airline approval, suspension, and banning.
- Airline-owner fleet registration and maintenance.
- Flight operations aircraft assignment.
- Seat inventory initialization from aircraft capacity and cabin layout.
- Airline dropdowns used by forms and administrative tools.
- Country enrichment through the airline headquarters city.
- Production-style airline and aircraft seed data.

## Bounded Context and Ownership

The service owns:

- `airlines`
- `aircrafts`

The service does not own:

- Users and authentication.
- Cities and airports.
- Flights and flight instances.
- Seat inventory.
- Bookings or payments.

Cross-service references are stored as IDs:

- `Airline.ownerId` references a user from `user-service`.
- `Airline.headquartersCityId` references a city from `location-service`.
- `Aircraft.currentAirportId` references an airport from `location-service`.

Airline and Aircraft belong to the same bounded context, so Aircraft uses a
direct JPA relationship to Airline.

```text
Airline 1 ---- * Aircraft
```

## Core Business Roles

### Airline Owner

An authenticated user with `ROLE_AIRLINE_OWNER` can:

- Create an airline profile.
- Read airlines that they own.
- Update or delete airlines that they own.
- Create aircraft under an airline that they own.
- Read, update, or delete aircraft belonging to their airlines.

When an owner has exactly one airline, `airlineId` may be omitted from an
aircraft request. When the owner has multiple airlines, `airlineId` is required.

### System Administrator

An authenticated user with `ROLE_SYSTEM_ADMIN` can:

- Search and inspect airlines.
- Approve an airline.
- Suspend an airline.
- Ban an airline.
- Read aircraft details across airline ownership boundaries.

System administrator airline status actions are also validated inside
`AirlineController`.

### API Gateway

The API Gateway validates JWTs before forwarding Airline Core requests. It
injects trusted identity headers:

```text
X-User-Id
X-User-Email
X-User-Roles
X-Trace-Id
```

Clients must not provide or depend on these headers directly. The Gateway
removes client-supplied identity headers and creates trusted values from the
validated JWT.

## Required Services and Infrastructure

Recommended startup order for local development:

1. PostgreSQL `airlinecoredb`
2. Redis
3. `service-registry`
4. `config-server`
5. `location-service`
6. `user-service`
7. `airline-core-service`
8. `api-gateway`
9. `flighthub-web`

Required infrastructure:

- PostgreSQL
- Redis
- Eureka service registry
- Config server

Runtime service dependency:

- `location-service`, used to enrich airline responses with country data from
  the headquarters city.

`airline-core-service` handles Location Service failures gracefully during
response enrichment. The airline response is still returned, but country fields
may be absent.

## Local Ports and Database

| Component | Host port | Purpose |
| --- | ---: | --- |
| Airline Core Service | 8081 | Direct service access |
| API Gateway | 8080 | Recommended client entrypoint |
| airlinecoredb | 5433 | PostgreSQL airline core database |
| Redis | 6379 | Airline and aircraft cache |

Database:

```text
Database: airline_core_db
Username: postgres
Password: 12345678
Host port: 5433
```

## Gateway Routing and Authentication

The API Gateway routes:

```http
/api/airlines/**  -> airline-core-service
/api/aircrafts/** -> airline-core-service
```

All Airline Core routes through the Gateway require a valid Bearer JWT.

```http
Authorization: Bearer <access-token>
```

The Gateway also applies Redis-backed rate limiting.

Swagger documentation is routed separately without the Airline Core JWT route:

```http
/docs/airline-core-service/** -> airline-core-service
```

Direct service calls are intended for development and internal diagnostics.
They bypass Gateway JWT validation. Owner/admin endpoints called directly still
require the expected internal identity headers.

## Swagger and OpenAPI

Use the Gateway Swagger UI as the main entrypoint:

```text
http://localhost:8080/swagger-ui.html
```

Select:

```text
Airline Core Service
```

Gateway OpenAPI JSON:

```text
http://localhost:8080/docs/airline-core-service/v3/api-docs
```

Direct Airline Core Swagger endpoints:

```text
http://localhost:8081/swagger-ui.html
http://localhost:8081/v3/api-docs
http://localhost:8081/v3/api-docs/airlines
http://localhost:8081/v3/api-docs/aircrafts
```

OpenAPI groups:

- `airlines`
- `aircrafts`

Swagger defines a JWT Bearer authentication scheme. Internal headers such as
`X-User-Id` and `X-User-Roles` are hidden from the documented controller
parameters because the Gateway injects them automatically.

## Airline Domain

### Airline Data

An Airline contains:

- Unique two-character IATA code.
- Unique three-character ICAO code.
- Name and optional alias.
- Logo URL and website.
- Airline status.
- Alliance.
- Embedded support contact information.
- Headquarters city ID.
- Owner user ID.
- Last updater user ID.
- Created and updated timestamps.

Airline statuses:

```text
ACTIVE
INACTIVE
BANNED
```

New airline profiles are always created with `INACTIVE` status. The status sent
in `AirlineRequest` does not activate a new airline. A System Administrator must
approve the airline.

### Airline Normalization and Validation

Current business rules:

- `name` is required and cannot be blank.
- `iataCode` is required and must contain exactly two characters.
- `icaoCode` is required and must contain exactly three characters.
- IATA and ICAO codes are trimmed and normalized to uppercase.
- Name, alias, alliance, and support fields are trimmed.
- `ownerId` is created from the authenticated Gateway identity.
- `ownerId` cannot be updated after airline creation.
- Airline owners can update or delete only their own airlines.
- Update requests do not change airline status.
- Status changes are handled by System Administrator actions.

The database enforces unique IATA and ICAO codes.

### Headquarters City Enrichment

`headquartersCityId` is stored as a cross-service ID.

When returning airline data, Airline Core calls:

```http
GET /api/cities/{id}
```

through the `location-service` Feign client. It enriches the response with:

- `countryCode`
- `countryName`

For airline pages, the service preloads distinct city IDs to reduce repeated
Location Service calls.

## Airline API

Base path:

```http
/api/airlines
```

### Endpoint Summary

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/airlines` | Create an airline for the authenticated owner |
| GET | `/api/airlines/admin` | List airlines owned by the authenticated owner |
| GET | `/api/airlines/{id}` | Get an airline by ID |
| GET | `/api/airlines` | Search and paginate airlines |
| GET | `/api/airlines/dropdown` | List active airline dropdown options |
| PUT | `/api/airlines/{id}` | Update an owned airline |
| DELETE | `/api/airlines/{id}` | Delete an owned airline |
| POST | `/api/airlines/{id}/approve` | Activate an airline as System Admin |
| POST | `/api/airlines/{id}/suspend` | Mark an airline inactive as System Admin |
| POST | `/api/airlines/{id}/ban` | Ban an airline as System Admin |

### Search Airlines

```http
GET /api/airlines?page=0&size=20&sortBy=name&sortDirection=asc
```

Optional filters:

```text
keyword
status
```

The keyword search checks:

- Name
- Alias
- IATA code
- ICAO code
- Alliance
- Website
- Support email
- Support phone

Example:

```http
GET /api/airlines?keyword=Vietnam&status=ACTIVE&page=0&size=20
```

The current controller accepts a Spring Data property in `sortBy`. Clients
should use known Airline properties such as:

```text
id, name, alias, iataCode, icaoCode, status, alliance, createdAt, updatedAt
```

### Airline Dropdown

```http
GET /api/airlines/dropdown
```

Only `ACTIVE` airlines are included.

Dropdown response fields:

```text
id
name
iataCode
icaoCode
logoUrl
```

### Example Airline Create Request

```json
{
  "iataCode": "VN",
  "icaoCode": "HVN",
  "name": "Vietnam Airlines",
  "alias": "Vietnam Airlines",
  "logoUrl": "https://cdn.flighthub.local/airlines/vn.png",
  "website": "https://www.vietnamairlines.com",
  "alliance": "SkyTeam",
  "headquartersCityId": 1,
  "supportEmail": "support@vietnamairlines.flighthub.local",
  "supportPhone": "+842438320320",
  "supportHours": "24/7 operations desk"
}
```

## Aircraft Domain

### Aircraft Data

An Aircraft contains:

- Unique aircraft code.
- Model and manufacturer.
- Total seating capacity.
- Economy, premium economy, business, and first class seat counts.
- Range, cruising speed, and maximum altitude.
- Year of manufacture.
- Registration and next maintenance dates.
- Operational status.
- Availability flag.
- Owning airline.
- Current airport ID.
- Created and updated timestamps.

Aircraft statuses:

```text
ACTIVE
MAINTENANCE
INACTIVE
RETIRED
```

### Aircraft Business Validation

Current validation rules:

- Aircraft code is required and unique.
- Model is required.
- Manufacturer is required.
- Seating capacity is required and must be positive.
- Cabin seat counts must be zero or positive.
- The sum of cabin seat counts cannot exceed seating capacity.
- Year of manufacture is required by service validation.
- Year of manufacture must be between `1950` and the current year.
- Range must be positive when provided.
- Cruising speed must be positive when provided.
- Maximum altitude must be positive when provided by request validation.
- Status is required.
- Availability is required.
- `airlineId` must identify an airline owned by the authenticated owner.
- `currentAirportId` is stored as a cross-service reference.

When an owner has multiple airlines and omits `airlineId`, the request is
rejected because the target airline is ambiguous.

### Computed Aircraft Fields

Aircraft responses include:

`totalSeats`
: Sum of all cabin seat counts.

`isOperational`
: `true` only when status is `ACTIVE` and `isAvailable` is `true`.

`requiresMaintenance`
: `true` when `nextMaintenanceDate` is earlier than two weeks from the current
date.

Aircraft responses also include the owning airline's:

- ID
- Name
- IATA code

Airport name/code enrichment is not currently performed by Airline Core. The
response currently provides `currentAirportId`; other airport response fields
remain unset until airport enrichment is implemented.

## Aircraft API

Base path:

```http
/api/aircrafts
```

### Endpoint Summary

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/aircrafts` | Create an aircraft under an owned airline |
| GET | `/api/aircrafts/{id}` | Get an authorized aircraft by ID |
| GET | `/api/aircrafts` | List aircraft belonging to owned airlines |
| PUT | `/api/aircrafts/{id}` | Update an owned aircraft |
| DELETE | `/api/aircrafts/{id}` | Delete an owned aircraft |

### Aircraft Access Rules

Create:

- Resolves the target airline from the authenticated owner.
- Rejects an airline owned by another user.
- Rejects duplicate aircraft codes.

Read by ID:

- System Administrators may read any aircraft.
- Airline owners may read aircraft belonging to their airlines.

List:

- Returns aircraft across all airlines owned by the authenticated owner.
- Returns `AIRLINE_NOT_FOUND` when the owner has no airline.

Update:

- Validates current aircraft ownership.
- Validates the requested target airline ownership.
- Allows moving an aircraft only between airlines owned by the same owner.
- Rejects duplicate aircraft codes when the code changes.

Delete:

- Allows deletion only when the aircraft belongs to an airline owned by the
  authenticated owner.

### Example Aircraft Create Request

```json
{
  "code": "VN-A359-01",
  "model": "Airbus A350-900",
  "manufacturer": "Airbus",
  "seatingCapacity": 305,
  "economySeats": 231,
  "premiumEconomySeats": 45,
  "businessSeats": 29,
  "firstClassSeats": 0,
  "rangeKm": 15000,
  "cruisingSpeedKmh": 905,
  "maxAltitudeFt": 43100,
  "yearOfManufacture": 2019,
  "registrationDate": "2019-06-18",
  "nextMaintenanceDate": "2026-07-18",
  "status": "ACTIVE",
  "isAvailable": true,
  "airlineId": 1,
  "currentAirportId": 1
}
```

## Database Design

### Airlines Table

Table:

```text
airlines
```

Important constraints and indexes:

- Primary key on `id`.
- Unique constraint on `iata_code`.
- Unique constraint on `icao_code`.
- Index on `owner_id`.
- Index on `status`.
- Index on `headquarters_city_id`.

The support contact is embedded into the airline table using:

```text
email
phone
hours
```

### Aircrafts Table

Table:

```text
aircrafts
```

Important constraints and indexes:

- Primary key on `id`.
- Unique constraint on `aircraft_code`.
- Index on `aircraft_code`.
- Index on `model`.
- Index on `airline_id`.
- Foreign key relationship from `airline_id` to Airline.

## Redis Caching

Caching is enabled through Spring Cache and Redis.

Configured cache TTLs:

| Cache | TTL |
| --- | ---: |
| `airlines` | 2 hours |
| `airlinesByOwner` | 2 hours |
| `airlinesByIata` | 2 hours |
| `airlinesByAlliance` | 2 hours |
| `airlinesDropdown` | Default 2 hours |
| `aircrafts` | 6 hours |

Current cached operations:

- Airline by ID.
- Airlines by owner.
- Active airline dropdown.

Cache eviction occurs when:

- An airline is updated.
- An airline is deleted.
- An administrator changes airline status.
- An aircraft is updated.
- An aircraft is deleted.

Redis failures are handled by a custom `CacheErrorHandler`. Cache read, write,
eviction, or clear failures are logged and do not terminate the primary
database operation.

## Error Contract

Relevant business error codes:

| Error code | HTTP status | Meaning |
| --- | ---: | --- |
| `ALN_001` | 404 | Airline not found |
| `AIR_001` | 404 | Aircraft not found |
| `AIR_002` | 400 | Aircraft already exists |
| `AIR_003` | 400 | Invalid aircraft data |

The service also uses shared errors such as:

- Invalid input.
- Forbidden.
- Validation errors.
- External service errors.

All API responses use the shared FlightHub `ApiResponse` contract.

## Production-Style Seed Data

Airline Core seed file:

```text
microservices/Documentation/sql/2026-06-05-seed-production-airline-core.sql
```

Recommended command:

```bash
bash microservices/scripts/init-production-demo-data.sh
```

The Airline Core seed depends on cross-service IDs from:

- Seeded airline-owner users in `user-service`.
- Seeded cities and airports in `location-service`.

Do not run the Airline Core SQL file directly in a SQL editor. It requires
`flighthub_seed.*` session settings created by the initialization script.

The current seed creates:

```text
Airlines: 10
Aircrafts: 12
```

Seed behavior:

- Airlines are idempotent by `iata_code`.
- Aircraft are idempotent by `aircraft_code`.
- Airline owner IDs are resolved by owner email.
- Headquarters city IDs are resolved by city code.
- Current airport IDs are resolved by airport IATA code.
- Table sequences are updated after seeding.

## Local Run Commands

Start required Docker infrastructure:

```bash
docker compose -f microservices/docker-compose/docker-compose.yml up -d \
  airlinecoredb locationdb userdb redis kafka
```

Start Airline Core locally:

```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5433/airline_core_db \
SPRING_DATASOURCE_USERNAME=postgres \
SPRING_DATASOURCE_PASSWORD=12345678 \
SPRING_DATASOURCE_DRIVER_CLASS_NAME=org.postgresql.Driver \
SPRING_DATA_REDIS_HOST=localhost \
SPRING_DATA_REDIS_PORT=6379 \
mvn -f microservices/services/airline-core-service/pom.xml spring-boot:run
```

For the complete startup workflow, see:

```text
microservices/Documentation/local-full-stack-runbook.md
```

## Smoke Test Workflow

### 1. Verify Health

Direct service:

```bash
curl http://localhost:8081/actuator/health
```

Gateway:

```bash
curl http://localhost:8080/actuator/health
```

### 2. Login as System Administrator

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -H 'X-Device-Id: airline-core-smoke-test' \
  -d '{"email":"admin@flighthub.local","password":"Password@123"}'
```

Copy the returned `accessToken`.

### 3. Search Airlines

```bash
curl 'http://localhost:8080/api/airlines?page=0&size=20&sortBy=name&sortDirection=asc' \
  -H 'Authorization: Bearer <access-token>'
```

### 4. Get Active Airline Dropdown

```bash
curl http://localhost:8080/api/airlines/dropdown \
  -H 'Authorization: Bearer <access-token>'
```

### 5. Read Aircraft as System Administrator

```bash
curl http://localhost:8080/api/aircrafts/1 \
  -H 'Authorization: Bearer <access-token>'
```

### 6. Verify OpenAPI

```bash
curl http://localhost:8080/docs/airline-core-service/v3/api-docs
```

## Verification Checklist

- `airline-core-service` is registered in Eureka.
- `location-service` is registered in Eureka.
- API Gateway health status is `UP`.
- Airline Core direct health status is `UP`.
- Gateway Swagger UI shows `Airline Core Service`.
- Airline Swagger group lists all `/api/airlines/**` endpoints.
- Aircraft Swagger group lists all `/api/aircrafts/**` endpoints.
- Swagger hides internal identity headers.
- New airlines are created with `INACTIVE` status.
- Only System Administrators can approve, suspend, or ban airlines.
- Airline owners can modify only their own airlines.
- Airline owners can modify only aircraft belonging to their airlines.
- System Administrators can read aircraft across ownership boundaries.
- Airline dropdown returns only `ACTIVE` airlines.
- Airline responses are enriched with headquarters country data when Location
  Service is available.
- Redis failures do not block primary database operations.
- Production-style seed creates airlines and aircraft.

## Build Verification

Build Airline Core:

```bash
mvn -f microservices/services/airline-core-service/pom.xml package -DskipTests
```

Build API Gateway:

```bash
mvn -f microservices/platform/api-gateway/pom.xml package -DskipTests
```

Check Markdown and source formatting:

```bash
git diff --check
```

## Current Limitations and Follow-Up Areas

- Direct service endpoints do not apply JWT validation; production clients
  should always use the API Gateway.
- Airline search currently accepts Spring Data property names directly for
  `sortBy`; a safe sort allowlist should be added.
- Airline create/update currently relies on database constraints for duplicate
  IATA and ICAO handling.
- Aircraft list currently returns all owned aircraft without pagination.
- Aircraft create does not currently evict the `aircrafts` cache.
- Airport response enrichment is not yet implemented for Aircraft.
- Location Service failures are logged and tolerated, so airline country fields
  may be absent.
- Automated context tests require a dedicated test datasource or test profile.

