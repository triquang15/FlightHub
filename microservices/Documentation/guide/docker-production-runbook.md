# FlightHub Docker Hub Runbook

Use this runbook when you want to run FlightHub from Docker Hub images instead
of starting each Spring service manually. This is the same image-based flow used
by CI/CD and future VPS deployments.

Run commands from the repository root:

```bash
cd /Users/triquang/Project/FlightHub
```

## 1. Goal

The target flow is:

```text
Code -> GitHub Actions -> Docker Hub images -> docker compose pull -> docker compose up
```

Use `local-full-stack-runbook.md` for Maven-based development. Use this file
when you want a realistic Docker/CI/CD rehearsal.

## 2. Prerequisites

Required locally:

- Docker Desktop
- Docker Compose

Required for publishing:

- Docker Hub account
- GitHub repository secrets for Docker Hub

Verify local Docker:

```bash
docker compose version
```

## 3. Configure GitHub For Docker Hub

Create a Docker Hub access token:

1. Open Docker Hub.
2. Go to Account Settings.
3. Open Security.
4. Create a Personal Access Token.

Add GitHub repository secrets:

```text
DOCKERHUB_USERNAME
DOCKERHUB_TOKEN
```

Optional GitHub repository variables for frontend image builds:

```text
VITE_API_BASE_URL=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=<google-web-client-id>
VITE_FACEBOOK_APP_ID=<facebook-app-id>
```

For future VPS deployment, `VITE_API_BASE_URL` should become the real API
domain, for example:

```text
VITE_API_BASE_URL=https://api.example.com
```

## 4. Publish Images

Workflow file:

```text
.github/workflows/docker-publish.yml
```

Automatic publishing:

```text
push master -> Publish Docker Images -> Docker Hub
```

Manual publishing:

1. Open GitHub Actions.
2. Select `Publish Docker Images`.
3. Click `Run workflow`.
4. Enter `image_tag`, for example `v0.1.0` or `demo-2026-07-17`.
5. Keep `push_latest=true` only when you want to move the `latest` tag.

Images published:

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
triquang15/flighthub-web
```

Automatic publish tags:

```text
latest
master
sha-<short-sha>
<full commit sha>
```

Use a SHA or release tag for deterministic demos and rollback. Use `latest`
only for quick local checks.

## 5. Create Docker Runtime Env

Create a Docker runtime environment file:

```bash
cp .env.docker.local.example .env.docker.local
```

Set the image tag you want to run:

```text
FLIGHTHUB_IMAGE_TAG=latest
FLIGHTHUB_PLATFORM_IMAGE_TAG=latest
FLIGHTHUB_IMAGE_PLATFORM=linux/amd64
FRONTEND_HOST_PORT=5173
EUREKA_HOST_PORT=8761
CONFIG_SERVER_HOST_PORT=8888
```

For deterministic testing:

```text
FLIGHTHUB_IMAGE_TAG=sha-abc1234
FLIGHTHUB_PLATFORM_IMAGE_TAG=sha-abc1234
FLIGHTHUB_IMAGE_PLATFORM=linux/amd64
```

On Apple Silicon, keep `FLIGHTHUB_IMAGE_PLATFORM=linux/amd64` unless the Docker
Hub images were published as multi-architecture images. The publish workflow now
builds both `linux/amd64` and `linux/arm64`, so future image tags can run native
on either platform.

For the full Java stack, keep these resource defaults unless your machine has
very little RAM:

```text
FLIGHTHUB_JAVA_TOOL_OPTIONS=-Xms192m -Xmx640m -XX:+UseG1GC -XX:MaxRAMPercentage=75
FLIGHTHUB_CONFIG_JAVA_TOOL_OPTIONS=-Xms192m -Xmx640m -XX:+UseG1GC -XX:MaxRAMPercentage=75
FLIGHTHUB_PLATFORM_JAVA_TOOL_OPTIONS=-Xms192m -Xmx640m -XX:+UseG1GC -XX:MaxRAMPercentage=75
FLIGHTHUB_APP_MEM_LIMIT=1g
FLIGHTHUB_APP_MEM_RESERVATION=512m
FLIGHTHUB_APP_CPUS=1.0
FLIGHTHUB_DATASOURCE_POOL_MAXIMUM_SIZE=5
FLIGHTHUB_DATASOURCE_POOL_MINIMUM_IDLE=1
FLIGHTHUB_DATASOURCE_POOL_CONNECTION_TIMEOUT_MS=30000
```

If Docker Desktop has less than 8 GB memory assigned, increase Docker Desktop
resources first. Running all databases, Kafka, config-server, Eureka, gateway,
and all business services together is much heavier than the Maven one-service
development flow.

Fill only the credentials you need for the test:

```text
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_WEBHOOK_ID=
GOOGLE_CLIENT_ID=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
MAIL_USERNAME=
MAIL_APP_PASSWORD=
MAIL_FROM=
```

Keep `.env.docker.local` out of Git.

### Optional: Use Neon Instead Of Local Docker Postgres

This option is only for Docker production-style runs. Maven/local development
can still use the local infrastructure from `local-full-stack-runbook.md`.

Why use Neon:

- avoids starting 11 local Postgres containers
- lowers Docker Desktop memory pressure
- makes the demo closer to a managed production database setup

Recommended Neon shape:

- one Neon project
- one pooled connection endpoint
- separate databases for each service
- same Neon role/password for the demo, unless you want stricter service-level
  isolation

Create these databases in Neon:

```text
airline_user
airline_core_db
airline_flight_db
airline_location_db
airline_seat_db
airline_pricing_db
airline_ancillary_db
airline_booking_db
airline_payment_db
media_service_db
airline_notification_db
```

In `.env.docker.local`, switch Docker prod to external database mode:

```text
FLIGHTHUB_PROD_PROFILES=none
```

Then fill the JDBC URLs. Use Neon pooled URLs and keep `sslmode=require`:

```text
USER_DATABASE_URL=jdbc:postgresql://<neon-pooler-host>/airline_user?sslmode=require
AIRLINE_CORE_DATABASE_URL=jdbc:postgresql://<neon-pooler-host>/airline_core_db?sslmode=require
FLIGHT_OPS_DATABASE_URL=jdbc:postgresql://<neon-pooler-host>/airline_flight_db?sslmode=require
LOCATION_DATABASE_URL=jdbc:postgresql://<neon-pooler-host>/airline_location_db?sslmode=require
SEAT_DATABASE_URL=jdbc:postgresql://<neon-pooler-host>/airline_seat_db?sslmode=require
PRICING_DATABASE_URL=jdbc:postgresql://<neon-pooler-host>/airline_pricing_db?sslmode=require
ANCILLARY_DATABASE_URL=jdbc:postgresql://<neon-pooler-host>/airline_ancillary_db?sslmode=require
BOOKING_DATABASE_URL=jdbc:postgresql://<neon-pooler-host>/airline_booking_db?sslmode=require
PAYMENT_DATABASE_URL=jdbc:postgresql://<neon-pooler-host>/airline_payment_db?sslmode=require
MEDIA_DATABASE_URL=jdbc:postgresql://<neon-pooler-host>/media_service_db?sslmode=require
NOTIFICATION_DATABASE_URL=jdbc:postgresql://<neon-pooler-host>/airline_notification_db?sslmode=require
```

Set the shared Neon user/password:

```text
FLIGHTHUB_DATASOURCE_USERNAME=<neon-role>
FLIGHTHUB_DATASOURCE_PASSWORD=<neon-password>
```

For a demo environment, these schema settings are convenient:

```text
JPA_DDL_AUTO=update
FLYWAY_ENABLED=false
```

For production, move to:

```text
JPA_DDL_AUTO=validate
FLYWAY_ENABLED=true
```

Keep small connection pools because every service opens its own pool:

```text
FLIGHTHUB_DATASOURCE_POOL_MAXIMUM_SIZE=3
FLIGHTHUB_DATASOURCE_POOL_MINIMUM_IDLE=1
```

To return to local Docker Postgres:

```text
FLIGHTHUB_PROD_PROFILES=local-db
```

## 6. Pull Images From Docker Hub

Pull the selected image tag:

```bash
FLIGHTHUB_ENV_FILE=.env.docker.local docker compose \
  --env-file .env.docker.local \
  -f microservices/docker-compose/docker-compose.prod.yml pull
```

If a pull fails with `manifest not found`, the selected tag has not been
published yet. Use `latest`, `master`, or an existing `sha-*` tag from Docker
Hub.

## 7. Start Full Docker Stack

Run the image-based stack:

```bash
FLIGHTHUB_ENV_FILE=.env.docker.local bash microservices/scripts/local-infra.sh stack-up
```

Run the same stack with Neon/managed Postgres instead of local DB containers:

```bash
FLIGHTHUB_ENV_FILE=.env.docker.local \
FLIGHTHUB_PROD_PROFILES=none \
bash microservices/scripts/local-infra.sh stack-up
```

The first boot can take 2-4 minutes because Eureka and config-server start
before the business services. The compose file uses health checks so application
containers wait for config-server and service-registry to become ready.

Check containers:

```bash
FLIGHTHUB_ENV_FILE=.env.docker.local bash microservices/scripts/local-infra.sh stack-status
```

Open:

```text
Frontend:    http://localhost:5173
API Gateway: http://localhost:8080
Kafka UI:    http://localhost:8000
Eureka:      http://localhost:8761
Config:      http://localhost:8888
```

## 8. Seed Demo Data

Seed the Docker databases when using local Postgres containers:

```bash
FLIGHTHUB_ENV_FILE=.env.docker.local docker compose \
  --env-file .env.docker.local \
  -f microservices/docker-compose/docker-compose.prod.yml \
  --profile local-db \
  --profile tools \
  run --rm seed-production-demo-data
```

Seed Neon/managed Postgres when `FLIGHTHUB_PROD_PROFILES=none` and the
`*_DATABASE_URL` values are filled:

```bash
FLIGHTHUB_ENV_FILE=.env.docker.local docker compose \
  --env-file .env.docker.local \
  -f microservices/docker-compose/docker-compose.prod.yml \
  --profile tools \
  run --rm seed-production-demo-data
```

Then test:

```text
http://localhost:5173/traveler
http://localhost:5173/search
http://localhost:5173/super-admin/dashboard
```

## 9. Health Checks

Gateway:

```bash
curl -i http://localhost:8080/actuator/health
```

Frontend:

```bash
curl -I http://localhost:5173
```

Eureka:

```bash
curl -s http://localhost:8761/eureka/apps
```

Config-server:

```bash
curl -i http://localhost:8888/actuator/health
curl -s http://localhost:8888/api-gateway/default
```

Kafka UI:

```text
http://localhost:8000
```

## 10. View Logs

All service logs are Docker logs:

```bash
docker logs gds-api-gateway --tail=200
docker logs gds-user-service --tail=200
docker logs gds-booking-service --tail=200
```

Follow a service:

```bash
docker logs -f gds-api-gateway
```

Search a trace:

```bash
docker logs gds-api-gateway 2>&1 | grep "traceId=<trace-id>"
docker logs gds-user-service 2>&1 | grep "traceId=<trace-id>"
```

## 11. Stop Stack

Stop services without deleting volumes:

```bash
FLIGHTHUB_ENV_FILE=.env.docker.local bash microservices/scripts/local-infra.sh stack-stop
```

Stop and remove containers:

```bash
FLIGHTHUB_ENV_FILE=.env.docker.local docker compose \
  --env-file .env.docker.local \
  -f microservices/docker-compose/docker-compose.prod.yml down
```

Delete local Docker databases and media uploads only when you want a clean
environment:

```bash
FLIGHTHUB_ENV_FILE=.env.docker.local docker compose \
  --env-file .env.docker.local \
  -f microservices/docker-compose/docker-compose.prod.yml down -v
```

## 12. Optional Local Image Build

Docker Hub publish is the primary flow. Local image builds are useful before
pushing when you want to catch Dockerfile issues on your machine.

Build all backend jars and Docker images locally:

```bash
bash microservices/scripts/build-local-images.sh
```

The script builds local images with:

```text
FLIGHTHUB_IMAGE_TAG=local
```

To run local images, set:

```text
FLIGHTHUB_IMAGE_TAG=local
FLIGHTHUB_PLATFORM_IMAGE_TAG=local
```

inside `.env.docker.local`, then run stack-up.

## 13. CI/CD Relationship

This Docker Hub runbook mirrors future VPS deploys:

```text
master -> GitHub Actions -> Docker Hub images -> compose pull/up
```

Future VPS deployment will use the same idea:

1. SSH into the VPS.
2. Pull the selected image tag.
3. Run `docker compose up -d`.
4. Health-check frontend and API Gateway.
5. Roll back by setting the previous image tag and running compose again.
