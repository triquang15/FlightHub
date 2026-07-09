# Flyway Migration Guide

## Current integration mode

Flyway is integrated into the business-service Maven parent and each service can
load versioned migrations from:

```text
src/main/resources/db/migration
```

The current rollout is intentionally opt-in:

```text
FLYWAY_ENABLED=false
```

This keeps the local developer stack compatible with the existing Hibernate
schema-generation flow. Set `FLYWAY_ENABLED=true` only for a database that
already has the base Hibernate schema or after a service has a full baseline
schema migration.

## Why Flyway is opt-in for now

Most existing SQL files are incremental migrations such as:

- add currency columns
- add checkout integrity columns
- add indexes
- add uniqueness constraints
- migrate legacy catalog money to USD

They are not full `CREATE TABLE` baseline migrations for every service. Flyway
runs before Hibernate, so an incremental `ALTER TABLE bookings ...` migration
will fail on a completely empty database if `bookings` does not exist yet.

The safe production path is:

1. Keep seed scripts outside Flyway.
2. Add service-owned baseline migrations for fresh databases.
3. Change service config to `FLYWAY_ENABLED=true`.
4. Change `JPA_DDL_AUTO=validate`.
5. Deploy through CI with `flyway_schema_history` tracked per service database.

## What Flyway owns

Flyway should own durable schema changes:

- tables
- columns
- indexes
- constraints
- enum/check constraint changes
- backfills required by a schema contract

Flyway should not own local demo data or verification scripts.

## What remains in demo seed

The full demo data runner remains:

```bash
microservices/scripts/init-production-demo-data.sh
```

That script is still responsible for:

- users
- cities and airports
- airlines and aircraft
- flights, schedules, and flight instances
- cabin classes, seat maps, seats, and seat inventory
- fares, rules, baggage policies, coupons
- ancillary catalogs and assignments
- demo bookings for analytics

## Service migration locations

Current Flyway migration folders:

```text
services/user-service/src/main/resources/db/migration
services/airline-core-service/src/main/resources/db/migration
services/pricing-service/src/main/resources/db/migration
services/ancillary-service/src/main/resources/db/migration
services/booking-service/src/main/resources/db/migration
services/payment-service/src/main/resources/db/migration
```

Services with no migration files yet still have Flyway config available and can
add migrations later.

## Local opt-in test

For an existing database created by the current local stack:

```bash
export FLYWAY_ENABLED=true
export JPA_DDL_AUTO=validate
microservices/scripts/run-local-service.sh pricing-service
```

If validation fails, switch only that service back temporarily:

```bash
export JPA_DDL_AUTO=update
```

Then fix the missing migration instead of relying on Hibernate update long term.

## Naming convention

Use:

```text
VyyyyMMdd_NNN__short_description.sql
```

Examples:

```text
V20260620_001__checkout_integrity.sql
V20260704_001__create_coupons.sql
```

Rules:

- Never edit an already-applied migration.
- Add a new higher version for changes.
- Do not include `psql` meta commands such as `\set`.
- Avoid `BEGIN` and `COMMIT`; Flyway manages transactions.
- Keep each migration scoped to one service database.

## Rollout checklist

- Confirm each service uses its own database.
- Start with a non-production database copy.
- Enable Flyway for one service at a time.
- Verify `flyway_schema_history` is created.
- Run the service smoke tests.
- Only then enable `JPA_DDL_AUTO=validate`.
- Keep demo seed as a manual/local operation.
