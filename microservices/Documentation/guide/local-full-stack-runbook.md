# FlightHub Local Full-Stack Runbook

This runbook explains how to run FlightHub locally using the following setup:

- Docker Compose runs PostgreSQL databases, Redis, and Kafka.
- Spring Boot services run locally with Maven for fast development and debugging.
- The React frontend runs with Vite.
- The API Gateway is the frontend's backend entrypoint.

Run all commands from the repository root:

```bash
cd /Users/triquang/Project/FlightHub
```

## Docker Compose File

This runbook uses the main Compose file:

```text
microservices/docker-compose/docker-compose.yml
```

The main Compose file contains all databases, Redis, Kafka, and one-shot seed
jobs.

`microservices/docker-compose/docker-compose.dev.yml` only contains Redis,
Kafka, and Kafka UI. Do not run both Compose files at the same time because
they may conflict on container names and host ports `6379`, `9092`, and `8000`.

## 1. Prerequisites

Install the following tools:

- Docker Desktop and Docker Compose.
- Java 21 or later.
- Maven.
- Node.js and npm.

Verify the local environment:

```bash
docker --version
docker compose version
java -version
mvn -version
node --version
npm --version
```

Default local database credentials:

```text
Username: postgres
Password: 12345678
```

## Local Environment File

Create the local environment file once:

```bash
cp .env.local.example .env.local
```

`.env.local` is the single source for host-based Maven development and is
ignored by Git. The local service runner maps service-specific values such as
`USER_DATASOURCE_URL` to Spring variables such as `SPRING_DATASOURCE_URL`.

Validate a service configuration without starting it:

```bash
FLIGHTHUB_DRY_RUN=true bash microservices/scripts/run-local-service.sh user-service
```

## 2. Local Architecture and Ports

### Platform and Frontend

| Component | Port | URL |
| --- | ---: | --- |
| Frontend Vite | 5173 | http://localhost:5173 |
| API Gateway | 8080 | http://localhost:8080 |
| Gateway Swagger UI | 8080 | http://localhost:8080/swagger-ui.html |
| Eureka Service Registry | 8761 | http://localhost:8761 |
| Config Server | 8888 | http://localhost:8888 |
| Kafka UI | 8000 | http://localhost:8000 |
| Redis | 6379 | localhost:6379 |
| Kafka external listener | 9092 | localhost:9092 |

### Spring Business Services

| Service | Port |
| --- | ---: |
| airline-core-service | 8081 |
| ancillary-service | 8082 |
| booking-service | 8083 |
| flight-ops-service | 8084 |
| location-service | 8085 |
| payment-service | 8086 |
| seat-service | 8087 |
| pricing-service | 8088 |
| subscription-service | 8089 |
| user-service | 8090 |
| notification-service | 8091 |

### PostgreSQL Databases

| Docker service | Host port | Database |
| --- | ---: | --- |
| userdb | 15432 | airline_user |
| airlinecoredb | 5433 | airline_core_db |
| flightopsdb | 5434 | airline_flight_db |
| locationdb | 5435 | airline_location_db |
| seatdb | 5436 | airline_seat_db |
| pricingdb | 5437 | airline_pricing_db |
| ancillarydb | 5438 | airline_ancillary_db |
| bookingdb | 5439 | airline_booking_db |
| paymentdb | 5440 | airline_payment_db |
| subscriptiondb | 5441 | airline_subscription_db |
| notificationdb | 5442 | airline_notification_db |

`userdb` uses port `15432` to avoid conflicts with a local PostgreSQL instance
that commonly uses port `5432`.

## 3. Daily Quick-Start Workflow

Use this workflow after the databases already contain their schemas and seed
data.

### Step 1: Start Docker Infrastructure and Databases

```bash
bash microservices/scripts/local-infra.sh up
```

Check all containers:

```bash
bash microservices/scripts/local-infra.sh status
```

Wait until the databases, Redis, and Kafka report `healthy`.

### Step 2: Start Platform Services

Open three separate terminals. Each command automatically loads `.env.local`.

Terminal 1 - Eureka:

```bash
bash microservices/scripts/run-local-service.sh service-registry
```

Terminal 2 - Config Server:

```bash
bash microservices/scripts/run-local-service.sh config-server
```

Terminal 3 - API Gateway:

```bash
bash microservices/scripts/run-local-service.sh api-gateway
```

Recommended startup order:

1. Eureka starts on port `8761`.
2. Config Server starts on port `8888`.
3. API Gateway starts on port `8080`.

### Step 3: Start Core Business Services

The core stack is sufficient for System Admin, User, Location, and Airline Core
development.

Terminal 4 - User Service:

```bash
bash microservices/scripts/run-local-service.sh user-service
```

Terminal 5 - Location Service:

```bash
bash microservices/scripts/run-local-service.sh location-service
```

Terminal 6 - Airline Core Service:

```bash
bash microservices/scripts/run-local-service.sh airline-core-service
```

### Step 4: Start the Frontend

Install dependencies the first time or after `package.json` changes:

```bash
(cd flighthub-web && npm install)
```

Start the frontend:

```bash
(cd flighthub-web && npm run dev -- --host 0.0.0.0)
```

Open:

```text
http://localhost:5173
```

Seeded System Admin account:

```text
Email: admin@flighthub.local
Password: Password@123
```

## 4. Start the Full Business Stack

Start the following services when testing flights, seats, pricing, ancillary
services, bookings, payments, subscriptions, and notifications.

Run each service in a separate terminal.

### Flight Ops Service

```bash
bash microservices/scripts/run-local-service.sh flight-ops-service
```

### Seat Service

```bash
bash microservices/scripts/run-local-service.sh seat-service
```

### Pricing Service

```bash
bash microservices/scripts/run-local-service.sh pricing-service
```

### Ancillary Service

```bash
bash microservices/scripts/run-local-service.sh ancillary-service
```

### Booking Service

```bash
bash microservices/scripts/run-local-service.sh booking-service
```

### Payment Service

The payment service reads payment-provider variables from the root
`.env.local` file.

```bash
bash microservices/scripts/run-local-service.sh payment-service
```

### Subscription Service

```bash
bash microservices/scripts/run-local-service.sh subscription-service
```

### Notification Service

```bash
bash microservices/scripts/run-local-service.sh notification-service
```

## Run All Backend Services with Docker

Use Docker Compose when you want the published backend images instead of local
source debugging:

```bash
bash microservices/scripts/local-infra.sh stack-up
```

Docker services communicate through Compose service names such as `userdb`,
`redis`, and `kafka`. Values containing `localhost` in `.env.local` are intended
for Maven services running on the host and must not replace those internal
Docker hostnames.

Check or stop the Docker stack:

```bash
bash microservices/scripts/local-infra.sh stack-status
bash microservices/scripts/local-infra.sh stack-stop
```

The Docker stack uses the images configured in `docker-compose.yml`. Rebuild or
publish those images before expecting local source changes to appear inside the
containers.

## 5. Initialize Schemas and Seed Data

### When to Run the Seed Script

Run the seed script when:

- The databases are newly created and do not contain demo data.
- Production-style demo data needs to be reset or updated.
- Users, cities, airports, airlines, aircraft, flights, schedules, or flight
  instance records are missing.

The seed scripts are safe to run repeatedly because they use upsert and
conflict-handling logic.

### First Run When Database Tables Do Not Exist

PostgreSQL containers only create empty databases. They do not create JPA
tables.

1. Start the databases, Redis, and Kafka.
2. Start `service-registry` and `config-server`.
3. Start at least `user-service`, `location-service`, `airline-core-service`,
   and `flight-ops-service`.
4. Wait for the services to start successfully so Hibernate can create the
   schemas.
5. Run the seed script.

### Recommended Seed Command

```bash
bash microservices/scripts/init-production-demo-data.sh
```

The script performs the following actions:

1. Seeds users into `airline_user`.
2. Seeds cities and airports into `airline_location_db`.
3. Resolves user, city, and airport IDs across service databases.
4. Seeds airlines and aircraft into `airline_core_db`.
5. Resolves airline, aircraft, and airport IDs across service databases.
6. Seeds flights, recurring schedules, operating days, and the next 30 days of
   flight instances into `airline_flight_db`.

Do not run this file directly:

```text
microservices/Documentation/sql/2026-06-05-seed-production-airline-core.sql
```

The airline-core and flight-ops seed files require `flighthub_seed.*` session
settings created by `init-production-demo-data.sh`. Running either file
directly in a SQL editor causes a missing seed context error.

### Run the Seed as a Docker One-Shot Job

After the database schemas exist, run:

```bash
docker compose \
  -f microservices/docker-compose/docker-compose.yml \
  --profile tools \
  run --rm seed-production-demo-data
```

To seed only airline-core data when users and location data already exist:

```bash
docker compose \
  -f microservices/docker-compose/docker-compose.yml \
  --profile tools \
  run --rm seed-airline-core-data
```

## 6. Verify the System

### Gateway Health

```bash
curl http://localhost:8080/actuator/health
```

Expected result:

```json
{"status":"UP"}
```

The detailed health response may contain additional components, but the
top-level status must be `UP`.

### Eureka Registrations

Open:

```text
http://localhost:8761
```

A full stack should register the following applications:

```text
API-GATEWAY
CONFIG-SERVER
USER-SERVICE
AIRLINE-CORE-SERVICE
LOCATION-SERVICE
FLIGHT-OPS-SERVICE
SEAT-SERVICE
PRICING-SERVICE
ANCILLARY-SERVICE
BOOKING-SERVICE
PAYMENT-SERVICE
SUBSCRIPTION-SERVICE
NOTIFICATION-SERVICE
```

### Swagger and OpenAPI

Open the shared Gateway Swagger UI:

```text
http://localhost:8080/swagger-ui.html
```

Select `Airline Core Service` from the API definition selector.

Airline Core OpenAPI JSON through the Gateway:

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

### Test Login Through the API Gateway

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -H 'X-Device-Id: local-dev-check' \
  -d '{"email":"admin@flighthub.local","password":"Password@123"}'
```

The expected result is HTTP `200` with an `accessToken` in the response.

### Verify Seed Data

Users:

```bash
docker compose -f microservices/docker-compose/docker-compose.yml exec -T userdb \
  psql -U postgres -d airline_user -c 'SELECT COUNT(*) FROM users;'
```

Cities and airports:

```bash
docker compose -f microservices/docker-compose/docker-compose.yml exec -T locationdb \
  psql -U postgres -d airline_location_db \
  -c 'SELECT (SELECT COUNT(*) FROM cities) AS cities, (SELECT COUNT(*) FROM airports) AS airports;'
```

Airlines and aircraft:

```bash
docker compose -f microservices/docker-compose/docker-compose.yml exec -T airlinecoredb \
  psql -U postgres -d airline_core_db \
  -c 'SELECT (SELECT COUNT(*) FROM airlines) AS airlines, (SELECT COUNT(*) FROM aircrafts) AS aircrafts;'
```

Expected production-style seed counts:

```text
Users: 27 or more if user-service creates an additional default admin
Cities: 84
Airports: 67
Airlines: 10
Aircrafts: 12
Flights: 12
Flight schedules: 12
Flight instances: varies by operating day; approximately 230 for the next 30 days
```

Flights, schedules, and instances:

```bash
docker compose -f microservices/docker-compose/docker-compose.yml exec -T flightopsdb \
  psql -U postgres -d airline_flight_db \
  -c 'SELECT (SELECT COUNT(*) FROM flights) AS flights, (SELECT COUNT(*) FROM flight_schedules) AS schedules, (SELECT COUNT(*) FROM flight_instances) AS instances;'
```

## 7. Stop the System

Stop the frontend and local Maven services with `Ctrl+C` in their running
terminals.

Stop Docker infrastructure while preserving database data:

```bash
docker compose -f microservices/docker-compose/docker-compose.yml down
```

Stop Docker infrastructure and delete database volumes:

```bash
docker compose -f microservices/docker-compose/docker-compose.yml down -v
```

Warning: `down -v` deletes all local database data. The schemas must be created
again and the seed script must be rerun afterward.

## 8. Troubleshooting

### Gateway Health Is DOWN Because of Redis

Common error:

```text
Unable to connect to Redis
```

Check Redis:

```bash
docker ps --filter name=gds-redis
docker exec gds-redis redis-cli ping
```

Expected result:

```text
PONG
```

Redis in the main Compose file must publish `localhost:6379`.

### Login Hangs or Kafka Connection Is Refused

Common error:

```text
Bootstrap broker localhost:9092 disconnected
```

Check Kafka:

```bash
docker ps --filter name=kafka
lsof -nP -iTCP:9092 -sTCP:LISTEN
```

Kafka in the main Compose file provides an external listener at
`localhost:9092`.

### A Port Is Already in Use

Check commonly used ports:

```bash
lsof -nP -iTCP:8080 -sTCP:LISTEN
lsof -nP -iTCP:5173 -sTCP:LISTEN
lsof -nP -iTCP:6379 -sTCP:LISTEN
lsof -nP -iTCP:9092 -sTCP:LISTEN
```

Stop the old process or change the host port in Docker Compose when necessary.

### Seed Script Reports Missing Tables

If the error contains `relation ... does not exist`, the database schema has
not been created.

Start the corresponding Spring service first so Hibernate creates its tables,
then run:

```bash
bash microservices/scripts/init-production-demo-data.sh
```

### Airline-Core Seed Reports Missing Context

If the error contains:

```text
Missing seed context
```

Do not run the airline-core SQL file directly. Run:

```bash
bash microservices/scripts/init-production-demo-data.sh
```

### Inspect Container Logs

```bash
docker compose -f microservices/docker-compose/docker-compose.yml logs -f redis
docker compose -f microservices/docker-compose/docker-compose.yml logs -f kafka
docker compose -f microservices/docker-compose/docker-compose.yml logs -f userdb
```

## 9. Quick-Start Checklist

```text
[ ] Docker Desktop is running
[ ] All databases are healthy
[ ] Redis is healthy and localhost:6379 is listening
[ ] Kafka is healthy and localhost:9092 is listening
[ ] Eureka is running on port 8761
[ ] Config Server is running on port 8888
[ ] Core or full business services are registered with Eureka
[ ] API Gateway health is UP on port 8080
[ ] Frontend returns HTTP 200 on port 5173
[ ] Admin login through the API Gateway succeeds
```
