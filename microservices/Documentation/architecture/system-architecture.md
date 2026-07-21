# FlightHub System Architecture

FlightHub is a microservice-based airline commerce platform. It supports
traveler search and checkout, airline-owner operations, system-admin controls,
media uploads, notification delivery, and production-style observability.

This document explains the technical architecture at a system level. For
service-by-service business ownership, see `../business-overview/README.md`.
For local Docker image startup, see `../guide/docker-production-runbook.md`.

## 1. Architecture Goals

- Keep browser traffic behind a single API Gateway.
- Keep each business domain independent with its own database.
- Use Kafka for asynchronous state propagation and notification workflows.
- Use Redis only for short-lived operational state and cache.
- Keep media storage abstracted so local disk can move to S3 or R2 later.
- Make the demo stack deployable from Docker Hub images with managed Postgres.
- Keep observability separate from business screens while still linking it from
  the super-admin workspace.

## 2. System Context

```mermaid
flowchart LR
    Traveler[Traveler]
    Owner[Airline Owner]
    Admin[System Admin]
    FE[FlightHub Web<br/>React + Vite + Nginx]
    GW[API Gateway<br/>JWT, routing, Redis rate limit]
    Services[FlightHub Microservices]
    DB[(PostgreSQL / Neon)]
    Redis[(Redis)]
    Kafka[(Kafka)]
    Providers[External Providers<br/>Google, Facebook, Stripe, PayPal, SMTP]
    Obs[Observability<br/>Grafana, Prometheus, Loki, Kibana]

    Traveler --> FE
    Owner --> FE
    Admin --> FE
    FE --> GW
    GW --> Services
    Services --> DB
    GW --> Redis
    Services --> Redis
    Services --> Kafka
    Services --> Providers
    Services --> Obs
    GW --> Obs
```

## 3. Runtime Container View

```mermaid
flowchart TB
    subgraph Client["Client Layer"]
        Browser[Browser]
        Web[flighthub-web<br/>React SPA served by Nginx]
    end

    subgraph Platform["Platform Layer"]
        Gateway[api-gateway<br/>routing, auth headers, rate limit]
        Config[config-server<br/>central runtime config]
        Eureka[service-registry<br/>Eureka discovery]
    end

    subgraph Business["Business Services"]
        User[user-service<br/>auth, users, social login, preferences]
        Airline[airline-core-service<br/>airlines, aircraft, onboarding]
        Location[location-service<br/>cities, airports, timezone]
        FlightOps[flight-ops-service<br/>flights, schedules, instances]
        Seat[seat-service<br/>seat maps, inventory, holds]
        Pricing[pricing-service<br/>fares, rules, coupons]
        Ancillary[ancillary-service<br/>bags, meals, extras]
        Booking[booking-service<br/>bookings, passengers, tickets]
        Payment[payment-service<br/>Stripe, PayPal, verification]
        Media[media-service<br/>uploads, metadata, S3-ready storage]
        Notification[notification-service<br/>email, SMS, delivery audit]
    end

    subgraph Data["Data and Integration"]
        Postgres[(Database per service<br/>Neon in Docker prod demo)]
        Redis[(Redis<br/>cache, blacklist, rate limit)]
        Kafka[(Kafka<br/>domain events)]
        FileStore[(Local disk now<br/>S3/R2 later)]
    end

    Browser --> Web --> Gateway
    Gateway --> Eureka
    Gateway --> Redis
    Gateway --> User
    Gateway --> Airline
    Gateway --> Location
    Gateway --> FlightOps
    Gateway --> Seat
    Gateway --> Pricing
    Gateway --> Ancillary
    Gateway --> Booking
    Gateway --> Payment
    Gateway --> Media
    Gateway --> Notification

    Config --> User
    Config --> Airline
    Config --> Location
    Config --> FlightOps
    Config --> Seat
    Config --> Pricing
    Config --> Ancillary
    Config --> Booking
    Config --> Payment
    Config --> Media
    Config --> Notification

    User --> Postgres
    Airline --> Postgres
    Location --> Postgres
    FlightOps --> Postgres
    Seat --> Postgres
    Pricing --> Postgres
    Ancillary --> Postgres
    Booking --> Postgres
    Payment --> Postgres
    Media --> Postgres
    Notification --> Postgres

    User --> Redis
    Airline --> Redis
    Location --> Redis
    FlightOps --> Redis
    Pricing --> Redis
    Notification --> Redis

    User --> Kafka
    FlightOps --> Kafka
    Booking --> Kafka
    Payment --> Kafka
    Kafka --> Booking
    Kafka --> Seat
    Kafka --> Notification

    Media --> FileStore
```

## 4. Service Ownership Map

| Service | Owns | Does not own |
| --- | --- | --- |
| `api-gateway` | Entry routing, role checks, JWT propagation, logout blacklist, rate limit | Business state |
| `user-service` | Accounts, roles, social login, profile, preferences, avatar ownership links | Booking lifecycle |
| `airline-core-service` | Airlines, aircraft, ownership, onboarding status | Flight instance inventory |
| `location-service` | Cities, airports, timezone/reference geography | Fares or routes as commercial products |
| `flight-ops-service` | Flights, schedules, instances, route operations | Payments or tickets |
| `seat-service` | Cabin classes, seat maps, seat instances, holds and confirmations | Fare pricing |
| `pricing-service` | Fares, fare rules, baggage policies, coupons | Payment provider verification |
| `ancillary-service` | Meals, baggage extras, insurance, flight-cabin extras | Booking totals as source of truth |
| `booking-service` | Bookings, passengers, tickets, checkout state, booking analytics | Card/PayPal provider ownership |
| `payment-service` | Stripe/PayPal checkout sessions, provider verification, payment events | Seat confirmation |
| `media-service` | Media metadata, file validation, storage adapter | Business approval rules |
| `notification-service` | Email/SMS templates, event delivery, delivery audit, DLQ visibility | Source business decisions |

## 5. Data Ownership

Each business service owns its own database schema. In the Docker production demo,
the databases can be hosted on Neon to reduce Docker memory usage.

```mermaid
erDiagram
    USER_SERVICE_DB ||--o{ USER : owns
    AIRLINE_CORE_DB ||--o{ AIRLINE : owns
    LOCATION_DB ||--o{ AIRPORT : owns
    FLIGHT_OPS_DB ||--o{ FLIGHT_INSTANCE : owns
    SEAT_DB ||--o{ SEAT_INSTANCE : owns
    PRICING_DB ||--o{ FARE : owns
    ANCILLARY_DB ||--o{ ANCILLARY_ITEM : owns
    BOOKING_DB ||--o{ BOOKING : owns
    PAYMENT_DB ||--o{ PAYMENT : owns
    MEDIA_DB ||--o{ MEDIA_ASSET : owns
    NOTIFICATION_DB ||--o{ NOTIFICATION_EVENT : owns
```

Cross-service references use IDs and snapshots. For example, booking stores the
selected flight, fare, passenger, seat, coupon, and payment identifiers needed
to reconstruct the booking later without making mutable upstream data the
historical ticket contract.

## 6. Traveler Search and Checkout Flow

```mermaid
sequenceDiagram
    autonumber
    actor Traveler
    participant Web as flighthub-web
    participant GW as api-gateway
    participant Location as location-service
    participant FlightOps as flight-ops-service
    participant Pricing as pricing-service
    participant Seat as seat-service
    participant Booking as booking-service
    participant Payment as payment-service
    participant Kafka as Kafka
    participant Notification as notification-service

    Traveler->>Web: Search route/date/cabin
    Web->>GW: GET /api/flights/search
    GW->>FlightOps: Route search request
    FlightOps-->>Web: Flight instances
    Web->>GW: GET fares, seats, ancillaries
    GW->>Pricing: Fare and coupon data
    GW->>Seat: Cabin and seat inventory
    Traveler->>Web: Select fare, passenger, seat
    Web->>GW: POST /api/bookings
    GW->>Booking: Create pending booking
    Booking->>Seat: Hold selected seats
    Booking->>Pricing: Validate fare/coupon
    Booking->>Payment: Create payment session
    Payment-->>Web: Checkout URL/client secret
    Traveler->>Payment: Complete Stripe/PayPal payment
    Payment->>Kafka: payment.completed
    Kafka->>Booking: Mark paid, issue ticket
    Booking->>Kafka: booking.confirmed
    Kafka->>Seat: Confirm held seats
    Kafka->>Notification: Send email/SMS
```

## 7. Airline Owner Operations Flow

```mermaid
flowchart LR
    Owner[Airline Owner] --> Web[Owner Workspace]
    Web --> Gateway[API Gateway]
    Gateway --> Airline[Airline Core<br/>profile, aircraft, onboarding]
    Gateway --> FlightOps[Flight Ops<br/>flights, schedules, instances]
    Gateway --> Seat[Seat<br/>cabins, seat maps, inventory]
    Gateway --> Pricing[Pricing<br/>fares, baggage, coupons]
    Gateway --> Ancillary[Ancillary<br/>meals and extras]
    Gateway --> Booking[Booking<br/>customer operations and analytics]
    Airline --> Media[Media<br/>logos and assets]
    Ancillary --> Media
```

The owner workspace is operational, not marketing-oriented: it manages inventory,
commercial rules, seat maps, customer bookings, and owner-level analytics.

## 8. Admin and Operations Flow

```mermaid
flowchart TB
    Admin[System Admin] --> SA[Super Admin Workspace]
    SA --> Users[User Management]
    SA --> Airlines[Airline Registry]
    SA --> Airports[Network Data]
    SA --> Analytics[Analytics]
    SA --> Notifications[Notification Operations]
    SA --> Integrations[Integrations]
    SA --> Observability[Observability Tool Hub]

    Users --> UserService[user-service]
    Airlines --> AirlineService[airline-core-service]
    Airports --> LocationService[location-service]
    Analytics --> BookingService[booking-service analytics APIs]
    Notifications --> NotificationService[notification-service]
    Integrations --> PaymentService[payment-service]
    Observability --> Grafana[Grafana / Prometheus / Loki / Kibana]
```

## 9. Kafka Event Topology

Kafka carries events after durable business state has been saved in PostgreSQL.
It is not the system of record.

```mermaid
flowchart LR
    Payment[payment-service] -->|payment.completed| Kafka[(Kafka)]
    Payment -->|payment.failed| Kafka
    Payment -->|payment.refunded| Kafka
    Booking[booking-service] -->|booking.confirmed| Kafka
    FlightOps[flight-ops-service] -->|flight-instance-created| Kafka
    User[user-service] -->|user.password-reset-requested| Kafka
    User -->|security.suspicious-login| Kafka

    Kafka --> Booking
    Kafka --> Seat[seat-service]
    Kafka --> Notification[notification-service]

    Kafka -. failed records .-> DLQ[*.DLQ topics]
```

Production rules are detailed in `../guide/kafka-production-usage.md`.

## 10. Redis Usage

Redis is used for short-lived operational state:

- Gateway rate limiting.
- Gateway JWT logout blacklist.
- Notification idempotency keys.
- Read-through caches for reference or frequently read data.

Redis does not own bookings, payments, seats, users, uploaded media metadata, or
notification delivery audit records. Details are in
`../guide/redis-production-usage.md`.

## 11. Media Storage Architecture

```mermaid
flowchart LR
    FE[Frontend upload] --> GW[API Gateway]
    GW --> Media[media-service]
    Media --> Meta[(media_service_db)]
    Media --> Local[(Local file storage)]
    Media -. future adapter .-> S3[(S3 or Cloudflare R2)]
    User[user-service] --> Media
    Airline[airline-core-service] --> Media
    Ancillary[ancillary-service] --> Media
```

The rest of the system stores media references, not raw files. This keeps future
S3/R2 migration contained inside `media-service`.

## 12. Security Architecture

```mermaid
flowchart TB
    Browser[Browser] -->|JWT / OAuth result| Gateway[API Gateway]
    Gateway -->|Validate token| User[user-service]
    Gateway -->|Check blacklist and rate limit| Redis[(Redis)]
    Gateway -->|Trusted identity headers| Services[Business services]
    Services -->|Do not trust browser-supplied identity headers| DB[(PostgreSQL)]
```

Security boundaries:

- Browser calls should enter through `api-gateway`.
- Gateway owns route authorization and propagates trusted identity headers.
- Services should treat client-supplied identity headers as untrusted.
- Logout uses Redis-backed token blacklist until token expiry.
- Google and Facebook login are validated by `user-service`.
- Secrets belong in env files, GitHub Actions secrets, or a secret manager.

## 13. Observability Architecture

```mermaid
flowchart LR
    Services[Spring services<br/>/actuator/prometheus] --> Prometheus
    Redis[(Redis)] --> RedisExporter[redis-exporter]
    Kafka[(Kafka)] --> KafkaExporter[kafka-exporter]
    Prometheus --> Grafana

    DockerLogs[Docker logs] --> Promtail
    Promtail --> Loki
    Loki --> Grafana

    DockerLogs --> Elasticsearch
    Elasticsearch --> Kibana

    Alertmanager --> Grafana
```

Primary usage:

- Grafana: dashboards for service health, throughput, latency, Redis, Kafka.
- Prometheus: raw metrics and target scrape status.
- Loki/Grafana Explore: service logs and trace ID search.
- Elasticsearch/Kibana: indexed operational log exploration.
- Super Admin UI: links to the tool hub and selected operational summaries.

See `../guide/observability-usage-guide.md` for day-to-day usage.

## 14. Docker Production Demo Topology

```mermaid
flowchart TB
    Dev[Developer machine or VPS] --> Compose[docker-compose.prod.yml]
    Compose --> Web[flighthub-web:latest]
    Compose --> Gateway[api-gateway:latest]
    Compose --> Platform[config-server + service-registry]
    Compose --> Business[Business service images]
    Compose --> Infra[Redis + Kafka + Kafka UI]
    Business --> Neon[(Neon managed Postgres)]
    Gateway --> Neon
    Business --> Providers[Google/Facebook/Stripe/PayPal/SMTP]
```

The production-like Docker demo uses Docker Hub images and can avoid local
PostgreSQL containers by setting:

```text
FLIGHTHUB_PROD_PROFILES=none
```

Then service databases point to Neon JDBC URLs from `.env.docker.local`.

## 15. CI/CD Image Flow

```mermaid
flowchart LR
    Dev[Developer commits code] --> GitHub[GitHub repository]
    GitHub --> Actions[GitHub Actions]
    Actions --> Build[Build frontend and service images]
    Build --> DockerHub[Docker Hub<br/>triquang15/gds-*]
    DockerHub --> Pull[docker compose pull]
    Pull --> Recreate[docker compose up -d --force-recreate]
    Recreate --> Demo[Local/VPS demo stack]
```

For local production-style testing after a code fix:

1. Commit and push code.
2. Wait for GitHub Actions Docker publish success.
3. Pull images.
4. Recreate the changed services.
5. Wait for gateway health and Eureka registration before testing UI flows.

## 16. Core Runtime Endpoints

| Component | Local URL |
| --- | --- |
| Web app | `http://localhost:5173` |
| API Gateway | `http://localhost:8080` |
| Eureka | `http://localhost:8761` |
| Config Server | `http://localhost:8888` |
| Kafka UI | `http://localhost:8000` |
| Grafana | `http://localhost:3001` |
| Prometheus | `http://localhost:9090` |
| Loki | `http://localhost:3100` |
| Elasticsearch | `http://localhost:9200` |
| Kibana | `http://localhost:5601` |

## 17. Production Readiness Notes

Already production-shaped:

- Gateway entrypoint and route-level role controls.
- Service discovery and central config.
- Database-per-service ownership.
- Kafka event integration with DLQ design.
- Redis short-lived state usage.
- Docker Hub image publishing.
- Docker production runbook with Neon option.
- Media-service abstraction for future S3/R2.
- Observability stack and trace ID logging.

Next hardening areas:

- Move secrets to a secret manager on real hosting.
- Add TLS and reverse proxy for public domains.
- Use managed Redis/Kafka/Postgres for long-running production.
- Add stronger service readiness gates before exposing UI traffic.
- Add automated smoke tests after Docker image deploy.
- Add backup and restore procedures for each database.
- Add S3/R2 storage adapter and CDN for public media.

