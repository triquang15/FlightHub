# FlightHub Business Overview

This folder is the business and production-contract map for the FlightHub
microservice platform. Each document explains what a service owns, what it does
not own, how it participates in the booking lifecycle, and which integration
rules matter for production behavior.

## Active business services

| Service | Document | Primary ownership |
| --- | --- | --- |
| Airline Core | `airline-core-service-overview.md` | Airlines, aircraft, airline ownership |
| Location | `location-service-overview.md` | Cities, airports, search geography |
| Flight Ops | `flight-ops-service-overview.md` | Flights, schedules, flight instances |
| Seat | `seat-service-overview.md` | Cabin classes, seat maps, seat inventory and holds |
| Pricing | `pricing-service-overview.md` | Fares, fare rules, baggage policies, coupons |
| Ancillary | `ancillary-service-overview.md` | Ancillary catalog, meals, flight-cabin sellable extras |
| Booking | `booking-service-overview.md` | Booking lifecycle, passengers, tickets, analytics |
| Payment | `payment-service-overview.md` | Stripe/PayPal checkout, verification, payment events |
| User | `user-service-overview.md` | Auth, sessions, users, social identity, preferences |
| Notification | `notification-service-overview.md` | Email/SMS delivery, Kafka consumers, retry/DLQ audit |
| Media | `media-service-overview.md` | Upload metadata, local/S3-ready file storage |

## Platform services

| Service | Role |
| --- | --- |
| API Gateway | JWT validation, route authorization, Redis rate limiting, logout blacklist, Swagger aggregation |

Kafka is the platform event bus for payment, booking, seat inventory, security,
and notification workflows. Production topic ownership and DLQ rules are tracked
in `../guide/kafka-production-usage.md`.
| Config Server | Runtime config source for active services |
| Service Registry | Eureka service discovery |
| Observability stack | Prometheus, Grafana, Loki, Promtail, Alertmanager, Elasticsearch, Kibana for local diagnostics |

## Core production flows

### Traveler search and checkout

1. Location and Flight Ops expose searchable airports, routes, flights, schedules,
   and flight instances.
2. Seat exposes cabin classes and bookable seat inventory.
3. Pricing exposes sellable Fares, fare terms, baggage rules, and coupon
   validation.
4. Ancillary exposes baggage, meals, and protection options for a flight/cabin.
5. Booking creates a pending booking, validates selected legs, holds seats,
   calculates totals, applies coupons, and initiates payment.
6. Payment creates Stripe or PayPal checkout and verifies provider completion.
7. Booking listens for payment success, confirms the booking, issues tickets,
   confirms seats, redeems coupons, and emits notification events.
8. Notification sends booking confirmation email/SMS and records delivery state.

### Airline owner operations

1. System admin creates or approves airline-owner users.
2. Airline owner completes onboarding and manages airline profile/assets.
3. Owner manages aircraft, cabins, seat maps, flights, schedules, fares,
   ancillaries, and bookings.
4. Owner analytics are derived from confirmed booking data and route/airport
   aggregates.

### System admin operations

1. Admin manages users, airlines, airports, operational data, integrations, and
   notification operations.
2. Admin analytics read cross-airline booking, route, airline, airport, and
   notification aggregates.
3. Observability tools remain separate operational consoles, linked from the
   admin workspace instead of being embedded as application logs.

## Cross-service rules

- Browser traffic should enter through API Gateway.
- Gateway injects trusted identity headers after JWT validation.
- Services should not trust client-supplied identity headers.
- Direct service ports are for local diagnostics and service-to-service calls.
- Money is currently standardized to USD across demo data and checkout.
- Booking snapshots selected commercial data; mutable fare rules should not be
  treated as historical ticket terms.
- Uploaded files are represented by portable media metadata, so storage can move
  from local disk to S3 without changing frontend contracts.
- Secrets belong in environment variables or a secret manager, not in this repo.

## Deprecated or removed areas

- `subscription-service` is not part of the current active runtime. Its config
  was removed from `flight-hub-config-server` because the platform now uses
  `media-service` on port `8089`.
