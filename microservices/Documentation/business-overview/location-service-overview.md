# Location Service Overview

This document summarizes the FlightHub `location-service` contract after the City and Airport API review.

The service owns location reference data used by search, flight operations, airport management, and dropdowns across the platform.

## Business Overview

`location-service` is the source of truth for the geographic reference data that FlightHub uses to build travel products.

In the business flow, users rarely think in raw airport IDs. They search by origin city, destination city, airport code, country, and travel region. FlightHub therefore needs a stable location layer that can translate business-friendly location concepts into normalized backend records.

The service supports these core business capabilities:

- Flight search: lets customers search by city or airport, such as Ho Chi Minh City, Singapore, SGN, or SIN.
- Flight operations: gives flight schedules and flight instances reliable departure and arrival airport references.
- Airline administration: lets admin and airline teams manage airport records, city mappings, and timezone metadata.
- Booking and ticketing: provides consistent airport/city names in booking summaries, tickets, invoices, and notifications.
- Pricing and route planning: supports future route, fare, market, and region-based pricing logic.
- Reporting: enables country, region, city, and airport-level traffic or operational reporting.

The business contract is intentionally split into two levels:

- City: the market or destination users understand, for example `Ho Chi Minh City`, `Tokyo`, or `London`.
- Airport: the operational airport used by schedules and flights, for example `SGN`, `HND`, `NRT`, `LHR`, or `LGW`.

This distinction matters because one city can have multiple airports. For example, Tokyo maps to both Haneda and Narita, London maps to Heathrow and Gatwick, and New York maps to JFK and Newark. Keeping City and Airport separate lets the product support city-level search while still keeping flight operations precise.

Timezone data is also business-critical. It affects:

- Flight departure and arrival display.
- Schedule calculations.
- Booking confirmation messages.
- Notification timing.
- Future disruption and delay workflows.

Because of this, city and airport data should be treated as reference data, not casual UI content. In production, changes should be reviewed carefully, seeded consistently, and protected behind admin permissions.

## Scope

`location-service` currently covers:

- City reference data
- Airport reference data
- City dropdown data for frontend forms
- Airport timezone detection by coordinates
- Timezone option lookup
- Redis caching for frequently read location data
- Swagger/OpenAPI documentation for City and Airport APIs
- Production-style seed SQL for cities and airports

## Required Services

Start services in this order for local testing:

1. `service-registry`
2. `config-server`
3. `location-service`
4. `api-gateway`
5. `flighthub-web`

Required infrastructure:

- PostgreSQL
- Redis
- Eureka service registry
- Config server

## Swagger URLs

Use the gateway Swagger UI as the main entry point:

```text
http://localhost:8080/swagger-ui.html
```

The gateway Swagger UI should include:

- `API Gateway`
- `User Service`
- `Notification Service`
- `Location Service`

Gateway OpenAPI docs:

```text
http://localhost:8080/docs/location-service/v3/api-docs
```

Direct service Swagger URL:

```text
http://localhost:<location-service-port>/swagger-ui.html
```

## Gateway Routing

Public gateway routes for location APIs:

```http
GET /api/cities/**
GET /api/airports/**
```

Secured write APIs require a valid JWT. Admin write routes are protected with `ROLE_SYSTEM_ADMIN` through the gateway.

```http
POST /api/cities/**
POST /api/airports/**
```

Location-service Swagger docs are proxied through:

```http
GET /docs/location-service/**
```

## City API

Base path:

```http
/api/cities
```

Endpoints:

```http
GET    /api/cities
GET    /api/cities/{id}
GET    /api/cities/dropdown
GET    /api/cities/search
GET    /api/cities/country/{countryCode}
GET    /api/cities/timezones
POST   /api/cities
PUT    /api/cities/{id}
DELETE /api/cities/{id}
```

Business rules:

- `cityCode` is normalized to uppercase.
- `cityCode` must be unique.
- `countryCode` is normalized to uppercase.
- `timeZone` must be a valid IANA timezone ID.
- List APIs support pagination and safe sorting.
- `GET /api/cities` supports advanced filters: `keyword`, `country`, `timezone`, `region`.
- City dropdown data is cached and sorted by city name.

Safe sort fields for `GET /api/cities`:

```text
id, name, cityCode, countryCode, countryName, regionCode, timeZoneId
```

## Airport API

Base path:

```http
/api/airports
```

Endpoints:

```http
GET    /api/airports
GET    /api/airports/{id}
GET    /api/airports/timezone/detect
POST   /api/airports
POST   /api/airports/bulk
PUT    /api/airports/{id}
DELETE /api/airports/{id}
```

Business rules:

- `iataCode` is normalized to uppercase.
- `iataCode` must be exactly three letters.
- `iataCode` must be unique.
- `cityId` must point to an existing city.
- If airport timezone is not provided, the service attempts detection from latitude/longitude.
- If geo timezone detection cannot resolve a value, the service falls back to the city timezone.
- Bulk create skips airports whose IATA code already exists.
- List APIs support pagination and safe sorting.
- `GET /api/airports` supports filters: `keyword`, `country`, `cityId`.

Safe sort fields for `GET /api/airports`:

```text
id, name, iataCode, timeZoneId
```

## Data Seed Scripts

Production-style seed scripts live in:

```text
microservices/Documentation/sql
```

Recommended order:

1. `2026-06-03-seed-production-cities.sql`
2. `2026-06-03-seed-production-airports.sql`

Optional user seed for full admin UI testing:

```text
2026-06-03-seed-production-users.sql
```

Seed behavior:

- City seed is idempotent by `city_code`.
- Airport seed is idempotent by `iata_code`.
- Airport seed maps `city_id` by `city_code`, so it does not depend on auto-generated IDs.
- Both scripts reset their table sequence after insert/update.

## Quick Smoke Test

Use gateway Swagger or curl.

List cities:

```http
GET /api/cities?page=0&size=20&sortBy=name&sortDirection=asc
```

Search cities:

```http
GET /api/cities?keyword=Ho%20Chi&country=VN
```

City dropdown:

```http
GET /api/cities/dropdown
```

List airports:

```http
GET /api/airports?page=0&size=20&sortBy=name&sortDirection=asc
```

Search airport by IATA:

```http
GET /api/airports?keyword=SGN
```

Filter airports by country:

```http
GET /api/airports?country=VN
```

Detect timezone:

```http
GET /api/airports/timezone/detect?lat=10.8188&lng=106.6519
```

Expected timezone for Tan Son Nhat coordinates:

```text
Asia/Ho_Chi_Minh
```

## Verification Checklist

- `location-service` is registered in Eureka.
- `api-gateway` is registered in Eureka.
- Gateway Swagger UI shows `Location Service`.
- `GET /docs/location-service/v3/api-docs` returns OpenAPI JSON.
- City and Airport Swagger groups show all reviewed endpoints.
- Seed cities run before seed airports.
- `GET /api/cities` returns seeded city rows.
- `GET /api/airports` returns seeded airport rows.
- Invalid `sortBy` falls back safely instead of causing a server error.
- Write APIs require a valid `ROLE_SYSTEM_ADMIN` token through the gateway.

## Build Verification

Compile location-service:

```bash
mvn -pl services/location-service -am -DskipTests package
```

Compile api-gateway:

```bash
mvn -pl platform/api-gateway -am -DskipTests package
```
