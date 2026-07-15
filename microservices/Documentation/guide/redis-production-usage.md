# Redis Production Usage

Redis is used in FlightHub for short-lived operational state and read-through
caches. It is not the source of truth for bookings, payments, users, fares,
seats, or notifications.

## Redis responsibilities

| Area | Owner | Purpose | Production policy |
| --- | --- | --- | --- |
| Gateway rate limit | `api-gateway` | Per user/IP and route request throttling | Fail-closed by default |
| Access-token blacklist | `api-gateway` | Reject logged-out JWTs until token expiry | Fail-closed by default |
| Notification idempotency | `notification-service` | Skip duplicate Kafka delivery attempts | Required for safe retry |
| Airline cache | `airline-core-service` | Airline and aircraft read cache | Fail-safe cache errors |
| Location cache | `location-service` | Airport, city, timezone read cache | Fail-safe cache errors |
| Pricing cache | `pricing-service` | Short-lived Fare lookups | Fail-safe cache errors |
| Flight Ops cache | `flight-ops-service` | Flight instances and reference data | Fail-safe cache errors |

## What should not use Redis

- Durable booking state.
- Durable payment state.
- Seat ownership after payment.
- Coupon redemption history.
- User identity or refresh token source of truth.
- Notification delivery audit.
- Uploaded file metadata.

Those records belong in PostgreSQL. Redis can cache or coordinate them, but
PostgreSQL remains authoritative.

## Gateway security policy

Default production values:

```bash
GATEWAY_RATE_LIMIT_FAIL_OPEN=false
GATEWAY_TOKEN_BLACKLIST_FAIL_OPEN=false
```

This means:

- If Redis is unavailable during rate-limit enforcement, protected traffic gets
  `503` instead of bypassing throttling.
- If Redis is unavailable during blacklist checks, protected routes get `503`
  instead of accepting a token that may have been revoked.

For local troubleshooting only, either setting can be temporarily changed to
`true`.

## Cache behavior

Service caches use Spring Cache with Redis TTLs and fail-safe
`CacheErrorHandler` implementations. If Redis is temporarily unavailable,
primary database operations should continue and logs should show cache warnings
instead of failing the business request.

Current TTL intent:

- Airline profile and ownership cache: hours.
- Aircraft and stable reference cache: hours.
- Location and timezone cache: hours to one day.
- Flight instance and cross-service reference cache: minutes.
- Fare cache: minutes because prices can change.

## Notification idempotency

Notification idempotency uses two key groups:

- `notification:processing:*` prevents concurrent duplicate work.
- `notification:sent:*` suppresses replayed Kafka events after successful
  delivery.

If Redis is unavailable, notification consumers should not pretend the event was
processed. The failure should be visible through retry/DLQ behavior.

## Operational checks

```bash
docker exec gds-redis redis-cli ping
docker exec gds-redis redis-cli --scan --pattern 'rl:*' | head
docker exec gds-redis redis-cli --scan --pattern 'jwt:blacklist:*' | head
docker exec gds-redis redis-cli --scan --pattern 'notification:*' | head
```

Prometheus scrapes `redis-exporter` in local observability mode, and Grafana can
be used to watch Redis availability, memory use, and key churn.
