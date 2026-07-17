# FlightHub Local Full-Stack Runbook

Use this runbook to start, verify, and stop FlightHub locally.

Run commands from the repository root:

```bash
cd /Users/triquang/Project/FlightHub
```

Compose files:

- `microservices/docker-compose/docker-compose.dev.yml`: local databases, Redis,
  Kafka, Kafka UI, and seed tools for Maven-based development.
- `microservices/docker-compose/docker-compose.yml`: compatibility alias for
  the dev compose file.

For image-based Docker runs, use
`microservices/Documentation/guide/docker-production-runbook.md`.

## 1. Prerequisites

Required tools:

- Docker Desktop with Docker Compose
- Java 25
- Maven
- Node.js and npm

Verify:

```bash
docker compose version
java -version
mvn -version
node --version
npm --version
```

Create the local environment file once:

```bash
cp .env.local.example .env.local
```

Validate a service configuration without starting it:

```bash
FLIGHTHUB_DRY_RUN=true bash microservices/scripts/run-local-service.sh user-service
```

## 2. Daily Start

### Start Infrastructure

```bash
bash microservices/scripts/local-infra.sh up
bash microservices/scripts/local-infra.sh status
```

Wait until PostgreSQL databases, Redis, and Kafka report `healthy`.

### Start Observability Stack Optional

Use this only when you want Grafana, Prometheus, Loki, Elasticsearch, Kibana,
Alertmanager, and Kafka/Redis exporters for local debugging. It is intentionally
separated from the daily infra command because Elasticsearch and Grafana add
extra memory usage.

```bash
bash microservices/scripts/local-infra.sh observability-up
bash microservices/scripts/local-infra.sh observability-status
```

Local URLs:

```text
Grafana:       http://localhost:3001
Prometheus:    http://localhost:9090
Loki:          http://localhost:3100
Elasticsearch: http://localhost:9200
Kibana:        http://localhost:5601
Alertmanager:  http://localhost:9093
```

Grafana local login is controlled by environment variables:

```text
GRAFANA_ADMIN_USER=flighthub_admin
GRAFANA_ADMIN_PASSWORD=flighthub_admin_local
```

Set these values in `.env.local` before first startup when you want a custom
local password. If `grafana-data` already exists, Grafana keeps the existing
admin account; recreate that volume or change the password inside Grafana to
rotate credentials.

Prometheus scrapes Spring services through `/actuator/prometheus`. Restart any
service after pulling observability changes so the new Prometheus registry and
actuator exposure are active. Targets for services that are not currently
running will show as `down` in Prometheus until those services are started.

For day-to-day debugging with Grafana, Prometheus, Loki, Kibana, and
Elasticsearch, see
`microservices/Documentation/guide/observability-usage-guide.md`.

For Docker image-based local runs, use
`microservices/Documentation/guide/docker-production-runbook.md`.

For production hosting, CI/CD, SSL, backup, and rollback planning, use
`microservices/Documentation/guide/production-deployment-plan.md`.

### Start Platform Services

Run each command in a separate terminal, in this order:

```bash
cd microservices
bash mvn clean install -DskipTests
```

```bash
bash microservices/scripts/run-local-service.sh service-registry
```

```bash
bash microservices/scripts/run-local-service.sh config-server
```

```bash
bash microservices/scripts/run-local-service.sh api-gateway
```

### Start Core Services

The core stack supports authentication, System Admin, Location, and Airline
Core workflows.

Run each command in a separate terminal:

```bash
bash microservices/scripts/run-local-service.sh user-service
```

```bash
bash microservices/scripts/run-local-service.sh location-service
```

```bash
bash microservices/scripts/run-local-service.sh airline-core-service
```

### Start Full Business Services

Start these services when testing the complete booking workflow:

```bash
bash microservices/scripts/run-local-service.sh flight-ops-service
bash microservices/scripts/run-local-service.sh seat-service
bash microservices/scripts/run-local-service.sh pricing-service
bash microservices/scripts/run-local-service.sh ancillary-service
bash microservices/scripts/run-local-service.sh media-service
bash microservices/scripts/run-local-service.sh booking-service
bash microservices/scripts/run-local-service.sh payment-service
bash microservices/scripts/run-local-service.sh notification-service
```

Run one command per terminal.

Flyway is integrated but intentionally disabled by default for local development
until each service has a full baseline schema migration. Keep the default
`FLYWAY_ENABLED=false` for the normal local stack. See
`microservices/Documentation/guide/flyway-migration-guide.md` before enabling
Flyway with `FLYWAY_ENABLED=true`.

`media-service` is the shared upload and media metadata service. It stores files
locally under `MEDIA_STORAGE_PATH` for development and keeps S3-ready storage
keys so the implementation can migrate to object storage later without changing
frontend contracts. Detailed upload policy and S3 migration notes live in
`microservices/Documentation/guide/media-storage-guide.md`.

### Start Frontend

Option A: run Vite directly on the host.

Install dependencies on the first run or after `package.json` changes:

```bash
(cd flighthub-web && npm install)
```

Start Vite:

```bash
(cd flighthub-web && npm run dev -- --host 0.0.0.0)
```

Option B: run the Vite dev server through Docker Compose DEV.

```bash
bash microservices/scripts/local-infra.sh frontend-up
bash microservices/scripts/local-infra.sh frontend-status
```

Follow frontend logs:

```bash
bash microservices/scripts/local-infra.sh logs flighthub-web
```

Stop only the frontend container:

```bash
bash microservices/scripts/local-infra.sh frontend-down
```

The Docker frontend service mounts `flighthub-web` into a Node container, keeps
`node_modules` in a named Docker volume, and serves Vite on
`http://localhost:${FRONTEND_HOST_PORT:-5173}`. Vite still reads
`flighthub-web/.env.local`, so Google/Facebook login variables do not need to be
duplicated in Docker Compose.

Google sign-in is optional. To enable it locally, create an OAuth 2.0 Web
Client in Google Cloud Console with `http://localhost:5173` as an authorized
JavaScript origin. Then set the same client id for both backend token
verification and frontend Google Identity Services:

```bash
# Backend user-service, read by microservices/scripts/run-local-service.sh
GOOGLE_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com

# Frontend Vite, export before running npm run dev or place in flighthub-web/.env.local
VITE_GOOGLE_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
```

If these values are empty, password login still works and the Google button
shows a clear configuration warning.

Facebook login is optional. To enable it locally, create a Facebook app in Meta
for Developers, add Facebook Login for web, and allow this site URL/domain:

```text
http://localhost:5173
localhost
```

Then set the frontend app id plus backend app id/secret for Graph API token
verification:

```bash
# Backend user-service, read by microservices/scripts/run-local-service.sh
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# Frontend Vite, export before running npm run dev or place in flighthub-web/.env.local
VITE_FACEBOOK_APP_ID=your-facebook-app-id
```

If these values are empty, the Facebook button stays visible but reports that
Facebook login is not configured.

Open:

```text
http://localhost:5173
```

### Test Payment Webhooks

Use only sandbox/test credentials in local and demo environments.

Stripe test card:

```text
Card number: 4242 4242 4242 4242
Expiry:      Any future MM/YY
CVC:         Any 3 digits
ZIP:         Any valid ZIP/postal code
```

PayPal Sandbox test accounts:

| Account | Password | Notes |
| --- | --- | --- |
| `flight-01@business.com` | `Admin@123` | Sandbox business account |
| `flight-02@business.com` | `Admin@123` | Sandbox business account |
| `flight-03@business.com` | `Admin@123` | Sandbox business account |
| `admin@business.flighthub.com` | `Admin@123` | FlightHub sandbox business/admin account |

For Stripe local testing, start the Payment Service and API Gateway, then run:

```bash
stripe listen --forward-to http://localhost:8080/api/payments/webhooks/stripe
```

Copy the emitted `whsec_...` value into `STRIPE_WEBHOOK_SECRET` in
`.env.local`, then restart Payment Service. The browser return URL and webhook
are both idempotent; receiving both must still confirm a payment only once.

For PayPal Sandbox, expose API Gateway through an HTTPS tunnel and register:

```text
https://<public-host>/api/payments/webhooks/paypal
```

Subscribe to checkout order and payment capture events, then set the PayPal
webhook identifier as `PAYPAL_WEBHOOK_ID` in `.env.local`. Payment Service
rejects PayPal callbacks unless PayPal's signature verification API returns
`SUCCESS`.

Pending checkouts expire after 30 minutes. The reconciliation job runs every
five minutes by default and can be disabled locally with:

```text
PAYMENT_RECONCILIATION_ENABLED=false
```

## 3. First Run and Seed

PostgreSQL containers initially contain empty databases. Start the relevant
Spring services first so Hibernate creates their tables, then seed demo data:

```bash
bash microservices/scripts/init-production-demo-data.sh
```

The seed command is safe to run repeatedly.
After `down -v`, run the Spring services once before seeding; otherwise the
seed script will fail because Hibernate has not recreated tables yet.

Do not put demo seed SQL into Flyway migrations. Flyway is reserved for durable
schema changes; demo data stays in `init-production-demo-data.sh`.

Booking-ready demo searches after seeding use a rolling future schedule. Pick any
date from tomorrow through the next 90 days for these route pairs:

```text
SGN -> HAN, Economy or Premium Economy
HAN -> SGN, Economy
SGN -> SIN, Economy or Business
SIN -> SGN, Economy
SGN -> BKK, Economy
BKK -> SGN, Economy
SGN -> KUL, Economy
KUL -> SGN, Economy
SGN -> HKG, Economy
HKG -> SGN, Economy
SGN -> DXB, Economy
DXB -> SGN, Economy
SGN -> DOH, Economy
DOH -> SGN, Economy
SGN -> HND, Economy
HND -> SGN, Economy
```

These routes include fare data, cabin ancillaries, and per-flight seat
inventory for seat selection in the booking review flow.

To inspect exact future search dates after a reset, run:

```bash
docker compose -f microservices/docker-compose/docker-compose.dev.yml exec -T flightopsdb \
  psql -U postgres -d airline_flight_db \
  -c "SELECT f.flight_number, fi.departure_airport_id AS from_airport_id, fi.arrival_airport_id AS to_airport_id, fi.departure_date_time::date AS depart_date FROM flight_instances fi JOIN flights f ON f.id = fi.flight_id WHERE fi.departure_date_time >= CURRENT_DATE AND fi.status = 'SCHEDULED' ORDER BY fi.departure_date_time LIMIT 20;"
```

Seeded System Admin:

```text
Email: admin@flighthub.local
Password: Password@123
```

Do not run individual airline-core, seat-service, flight-ops, or pricing seed SQL files directly.
They require seed context prepared by `init-production-demo-data.sh`.

## 4. Verify

### Infrastructure

```bash
bash microservices/scripts/local-infra.sh status
docker exec gds-redis redis-cli ping
```

Expected Redis response:

```text
PONG
```

Redis production boundaries and troubleshooting keys are documented in
`microservices/Documentation/guide/redis-production-usage.md`.

Kafka topic ownership, retry/DLQ policy, and local recovery commands are
documented in `microservices/Documentation/guide/kafka-production-usage.md`.

### Platform

Open Eureka and confirm the services you started are registered:

```text
http://localhost:8761
```

Check API Gateway:

```bash
curl http://localhost:8080/actuator/health
curl http://localhost:8080/actuator/prometheus
```

Expected top-level result:

```json
{"status":"UP"}
```

### API Gateway Route Policy

All browser and external API traffic should enter through API Gateway. The
gateway removes spoofed identity headers and injects trusted `X-User-Id`,
`X-User-Email`, `X-User-Roles`, and `X-Trace-Id`.

Public routes:

- Payment webhooks: `/api/payments/webhooks/stripe`,
  `/api/payments/webhooks/paypal`
- Auth and recovery: `/api/auth/**`, forgot/reset password
- Public search/reference reads: airports, cities, flight search, airline
  dropdown, public fare lookup, public coupons
- Public media file rendering: `/api/media/file/**`

Protected route groups:

- `ROLE_SYSTEM_ADMIN`: OpenAPI docs proxies, platform booking analytics,
  payment list/refund, notification operations, media search/entity/delete,
  city and airport mutations.
- `ROLE_AIRLINE_OWNER`: airline/aircraft mutations, flight/schedule/instance
  mutations, seat map/cabin/inventory mutations, ancillary/pricing mutations,
  airline booking and owner analytics, ticket mark-as-used.
- Authenticated traveler/customer: booking create/update/read/cancel/history,
  payment initiate/verify/cancel, seat hold flows, profile/preferences/session
  management, own avatar upload through media policy.

If a route appears in both a specific protected group and a broader fallback,
the specific route must have a lower `@Order` value so its role check runs
first.

### Authentication

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -H 'X-Device-Id: local-dev-check' \
  -d '{"email":"admin@flighthub.local","password":"Password@123"}'
```

Expected result: HTTP `200` with an `accessToken`.

### Swagger

```text
http://localhost:8080/swagger-ui.html
```

Select a service definition and confirm its OpenAPI document loads.

### Backend Build and Focused Tests

Compile every backend module after changing a shared DTO or event contract:

```bash
(cd microservices && mvn -DskipTests compile)
```

Run the production-critical payment, booking-event, notification-delivery and
gateway authorization tests:

```bash
(cd microservices && mvn \
  -pl services/payment-service,services/booking-service,services/notification-service,platform/api-gateway \
  -am \
  -Dtest=PaymentServiceImplTest,PaymentEventListenerTest,NotificationTrackingServiceTest,RouteConfigSecurityTest \
  -Dsurefire.failIfNoSpecifiedTests=false test)
```

Provider E2E remains a separate check: Stripe has been verified locally;
PayPal Sandbox checkout creation is configured, while browser approval and
webhook completion should be rerun after the stack and seed data are restored.

### Frontend

```bash
curl -I http://localhost:5173
```

Expected result: HTTP `200`.

### Seed Data

```bash
docker compose -f microservices/docker-compose/docker-compose.dev.yml exec -T userdb \
  psql -U postgres -d airline_user -c 'SELECT COUNT(*) FROM users;'
```

```bash
docker compose -f microservices/docker-compose/docker-compose.dev.yml exec -T locationdb \
  psql -U postgres -d airline_location_db \
  -c 'SELECT (SELECT COUNT(*) FROM cities) AS cities, (SELECT COUNT(*) FROM airports) AS airports;'
```

```bash
docker compose -f microservices/docker-compose/docker-compose.dev.yml exec -T airlinecoredb \
  psql -U postgres -d airline_core_db \
  -c 'SELECT (SELECT COUNT(*) FROM airlines) AS airlines, (SELECT COUNT(*) FROM aircrafts) AS aircrafts;'
```

```bash
docker compose -f microservices/docker-compose/docker-compose.dev.yml exec -T flightopsdb \
  psql -U postgres -d airline_flight_db \
  -c 'SELECT (SELECT COUNT(*) FROM flights) AS flights, (SELECT COUNT(*) FROM flight_schedules) AS schedules, (SELECT COUNT(*) FROM flight_instances) AS instances;'
```

## 5. Stop

Stop Vite and local Maven services with `Ctrl+C` in their terminals.

Stop Docker infrastructure while preserving database data:

```bash
bash microservices/scripts/local-infra.sh down
```

Delete containers and database volumes only when a clean reset is required:

```bash
docker compose -f microservices/docker-compose/docker-compose.dev.yml down -v
```

Warning: `down -v` deletes all local database data. Start services to recreate
schemas and rerun the seed command afterward.

## 6. Troubleshooting

### Service Does Not Start

Check that its database, Redis, Kafka, Eureka, and Config Server are running:

```bash
bash microservices/scripts/local-infra.sh status
curl http://localhost:8761
curl http://localhost:8888/actuator/health
```

### Port Is Already in Use

```bash
lsof -nP -iTCP:8080 -sTCP:LISTEN
lsof -nP -iTCP:5173 -sTCP:LISTEN
lsof -nP -iTCP:6379 -sTCP:LISTEN
lsof -nP -iTCP:9092 -sTCP:LISTEN
```

### Seed Reports Missing Tables

Start the corresponding Spring service so Hibernate creates its tables, then
run:

```bash
bash microservices/scripts/init-production-demo-data.sh
```

### Inspect Infrastructure Logs

```bash
docker compose -f microservices/docker-compose/docker-compose.dev.yml logs -f redis
docker compose -f microservices/docker-compose/docker-compose.dev.yml logs -f kafka
docker compose -f microservices/docker-compose/docker-compose.dev.yml logs -f userdb
```

## 7. Ready Checklist

```text
[ ] Infrastructure containers are healthy
[ ] Eureka is available on port 8761
[ ] Config Server is available on port 8888
[ ] Required business services are registered in Eureka
[ ] API Gateway health is UP on port 8080
[ ] Login through API Gateway returns an access token
[ ] Swagger loads through API Gateway
[ ] Focused backend lifecycle and authorization tests pass
[ ] Frontend returns HTTP 200 on port 5173
```

## Business References

Service ownership, business rules, API usage, and detailed smoke tests belong
in the business overview documents:

- `microservices/Documentation/business-overview/flight-ops-service-overview.md`
- `microservices/Documentation/business-overview/seat-service-overview.md`
- `microservices/Documentation/business-overview/airline-core-service-overview.md`
- `microservices/Documentation/business-overview/location-service-overview.md`
- `microservices/Documentation/business-overview/pricing-service-overview.md`
