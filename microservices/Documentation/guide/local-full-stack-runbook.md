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
frontend contracts.

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

Profile photos now use `media-service` for new uploads while keeping the
backend contract ready for S3 later. User Service saves only media metadata on
the `users` record:

```text
avatar_url
avatar_object_key
avatar_updated_at
```

Local avatar settings:

```bash
# Media Service endpoint used by User Service for avatar uploads
MEDIA_SERVICE_BASE_URL=http://localhost:8089

# Public URL returned by Media Service through API Gateway
MEDIA_PUBLIC_BASE_URL=http://localhost:8080

# Local filesystem storage for shared media files
MEDIA_STORAGE_PATH=uploads/media

# Optional upload limits
USER_AVATAR_MAX_FILE_SIZE=5MB
USER_AVATAR_MAX_REQUEST_SIZE=6MB
MEDIA_MAX_FILE_SIZE_BYTES=5242880
```

Supported avatar formats are JPG, PNG, and WEBP up to 5MB. Existing legacy
avatar URLs under `/api/users/profile/avatar/file/**` still work for older data,
but new uploads return `/api/media/file/{storageKey}`. When moving to S3, keep
the User Service controller and database fields unchanged and replace
`MediaStorageService` with an S3-backed implementation.

### Airport route images

Airport destination images use the same local-first, S3-ready pattern. Location
Service stores only media metadata on the `airports` record:

```text
hero_image_url
hero_image_object_key
```

Local airport media settings:

```bash
# Public URL used when Location Service returns hero_image_url through API Gateway
APP_PUBLIC_BASE_URL=http://localhost:8080

# Local filesystem storage for airport route/traveler images
AIRPORT_MEDIA_STORAGE_DIR=/tmp/flighthub/airport-media
```

System Admins can upload or remove airport hero images from Airport Management.
Traveler Trending routes prefer `airport.heroImageUrl` and fall back to bundled
route imagery when no custom image exists. For S3 migration, keep the airport
DTO/API contract unchanged and replace `AirportMediaStorageService` with an
S3-backed implementation.

### Shared Media Service

New cross-module uploads should prefer `media-service` instead of adding more
file storage code to each business service. It stores metadata in
`media_files`, saves local files under `MEDIA_STORAGE_PATH`, and returns a
public URL from `/api/media/file/{storageKey}`.

Local media settings:

```bash
MEDIA_DATASOURCE_URL=jdbc:postgresql://localhost:5441/media_service_db
MEDIA_STORAGE_PATH=uploads/media
MEDIA_PUBLIC_BASE_URL=http://localhost:8080
MEDIA_MAX_FILE_SIZE_BYTES=5242880
```

Use entity metadata to attach files without coupling storage to a service:

```text
entityType=USER_PROFILE | AIRLINE | AIRPORT | ROUTE | MEAL | ANCILLARY
entityId=<business id>
purpose=AVATAR | LOGO | HERO | ICON | DOCUMENT
```

Existing avatar, airport, airline, and ancillary upload endpoints remain
supported for backward compatibility. Future work should migrate those callers
to `media-service`, then switch the `MediaStorageService` implementation from
LOCAL to S3.

### Airline logo uploads

Airline logos also use local-first storage with the same S3 migration boundary.
Airline Core Service stores only media metadata on the `airlines` record:

```text
logo_url
logo_object_key
```

Local airline logo settings:

```bash
# Public URL used when Airline Core Service returns logo_url through API Gateway
APP_PUBLIC_BASE_URL=http://localhost:8080

# Local filesystem storage for airline logos
AIRLINE_LOGO_STORAGE_DIR=/tmp/flighthub/airline-logos
```

Airline owners can upload or remove logos from the airline profile page after
the airline profile exists. Onboarding accepts a hosted logo URL only; local file
upload happens after profile creation because the storage object key is scoped to
an airline ID. For S3 migration, keep the controller/DTO contract unchanged and
replace `AirlineLogoStorageService` with an S3-backed implementation.

### Meal catalog images

Meal images use the same local-first storage pattern. Ancillary Service keeps
display URL and object key metadata on the `meals` record:

```text
image_url
image_object_key
```

Local meal image settings:

```bash
# Public URL used when Ancillary Service returns image_url through API Gateway
APP_PUBLIC_BASE_URL=http://localhost:8080

# Local filesystem storage for uploaded meal catalog images
MEAL_IMAGE_STORAGE_DIR=/tmp/flighthub/meal-images

# Optional upload limits
MEAL_IMAGE_MAX_FILE_SIZE=8MB
MEAL_IMAGE_MAX_REQUEST_SIZE=9MB
```

Airline owners can upload or remove JPG, PNG, or WEBP meal images from the meal
catalog edit page after the meal exists. Hosted image URLs still work for seed
data or external CDN images. For S3 migration, keep the controller/DTO contract
unchanged and replace `MealImageStorageService` with an S3-backed
implementation.

### Ancillary catalog icons

Master ancillary icons/images use the same Ancillary Service local-first
storage boundary. The `ancillaries` record stores:

```text
icon_url
icon_object_key
```

Local ancillary icon settings:

```bash
# Public URL used when Ancillary Service returns icon_url through API Gateway
APP_PUBLIC_BASE_URL=http://localhost:8080

# Local filesystem storage for uploaded ancillary icons
ANCILLARY_ICON_STORAGE_DIR=/tmp/flighthub/ancillary-icons

# Optional shared upload limits for ancillary media
ANCILLARY_MEDIA_MAX_FILE_SIZE=8MB
ANCILLARY_MEDIA_MAX_REQUEST_SIZE=9MB
```

Airline owners can upload or remove JPG, PNG, WEBP, or SVG visuals from the
Master Ancillaries edit page after the catalog item exists. For S3 migration,
keep the API/DTO contract unchanged and replace `AncillaryIconStorageService`
with an S3-backed implementation.

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

## 7. CI/CD

GitHub Actions are split into two workflows:

- `.github/workflows/ci.yml`: runs automatically on push and pull request.
- `.github/workflows/docker-publish.yml`: runs manually when you want to publish
  Docker Hub images.

The CI workflow checks:

```text
backend: mvn -B -ntp -DskipTests package
frontend: npm ci && npm run build -- --logLevel error
compose: docker compose config validation for dev and prod compose files
```

Docker publishing requires these GitHub repository secrets:

```text
DOCKERHUB_USERNAME
DOCKERHUB_TOKEN
```

Optional GitHub repository variables used while building the frontend image:

```text
VITE_API_BASE_URL=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=<google-web-client-id>
VITE_FACEBOOK_APP_ID=<facebook-app-id>
```

To publish images:

1. Open GitHub Actions.
2. Select `Publish Docker Images`.
3. Click `Run workflow`.
4. Enter an image tag, for example `2026-07-14-01` or `latest`.

The workflow publishes these backend images:

```text
triquang15/gds-service-registry
triquang15/gds-config-server
triquang15/gds-api-gateway
triquang15/gds-user
triquang15/gds-airline
triquang15/gds-flight-ops
triquang15/gds-location
triquang15/gds-seat
triquang15/gds-pricing
triquang15/gds-ancillary
triquang15/gds-booking
triquang15/gds-payment
triquang15/gds-media
triquang15/gds-notification
```

It also publishes the frontend image:

```text
triquang15/flighthub-web
```

After publishing, run the Docker-only stack with the same tag:

```bash
FLIGHTHUB_IMAGE_TAG=2026-07-14-01 bash microservices/scripts/local-infra.sh stack-up
```

The production compose file includes `flighthub-web` and exposes it on
`${FRONTEND_HOST_PORT:-5173}`.

## 8. Troubleshooting

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

## 9. Ready Checklist

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
