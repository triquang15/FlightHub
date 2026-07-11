# FlightHub Local Full-Stack Runbook

Use this runbook to start, verify, and stop FlightHub locally.

Run commands from the repository root:

```bash
cd /Users/triquang/Project/FlightHub
```

Compose files:

- `microservices/docker-compose/docker-compose.dev.yml`: local databases, Redis,
  Kafka, Kafka UI, and seed tools for Maven-based development.
- `microservices/docker-compose/docker-compose.prod.yml`: full backend stack
  using published Docker Hub images.
- `microservices/docker-compose/docker-compose.yml`: compatibility alias for
  the dev compose file.

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

Grafana default login:

```text
admin / admin
```

Prometheus scrapes Spring services through `/actuator/prometheus`. Restart any
service after pulling observability changes so the new Prometheus registry and
actuator exposure are active. Targets for services that are not currently
running will show as `down` in Prometheus until those services are started.

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

`subscription-service` is currently an implementation scaffold and is not part
of the supported API surface. Start it only while developing the billing and
entitlement contract described in
`Documentation/business-overview/subscription-service-overview.md`.

### Start Frontend

Install dependencies on the first run or after `package.json` changes:

```bash
(cd flighthub-web && npm install)
```

Start Vite:

```bash
(cd flighthub-web && npm run dev -- --host 0.0.0.0)
```

Open:

```text
http://localhost:5173
```

### Test Payment Webhooks

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

Booking-ready demo searches after seeding:

```text
SGN -> HAN, tomorrow through the next 14 days, Economy or Premium Economy
HAN -> SGN, tomorrow through the next 14 days, Economy
SGN -> SIN, tomorrow through the next 14 days, Economy or Business
```

These routes include fare data, cabin ancillaries, and per-flight seat
inventory for seat selection in the booking review flow.

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

## 6. Docker-Only Backend

Use published backend images instead of Maven services. The script uses
`microservices/docker-compose/docker-compose.prod.yml` for this mode.

Set image tags in `.env.local` or your shell when needed:

```text
FLIGHTHUB_IMAGE_TAG=<tag>
FLIGHTHUB_PLATFORM_IMAGE_TAG=<tag>
```

```bash
bash microservices/scripts/local-infra.sh stack-up
bash microservices/scripts/local-infra.sh stack-status
```

Stop:

```bash
bash microservices/scripts/local-infra.sh stack-stop
```

Local source changes do not appear in Docker services until their images are
rebuilt.

## 7. Troubleshooting

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

## 8. Ready Checklist

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
