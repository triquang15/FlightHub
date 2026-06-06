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

## 2. Local Architecture and Ports

### Platform and Frontend

| Component | Port | URL |
| --- | ---: | --- |
| Frontend Vite | 5173 | http://localhost:5173 |
| API Gateway | 8080 | http://localhost:8080 |
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
docker compose -f microservices/docker-compose/docker-compose.yml up -d \
  userdb airlinecoredb flightopsdb locationdb seatdb pricingdb ancillarydb \
  bookingdb paymentdb subscriptiondb notificationdb redis kafka
```

Check all containers:

```bash
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
```

Wait until the databases, Redis, and Kafka report `healthy`.

### Step 2: Start Platform Services

Open three separate terminals.

Terminal 1 - Eureka:

```bash
mvn -f microservices/platform/service-registry/pom.xml spring-boot:run
```

Terminal 2 - Config Server:

```bash
mvn -f microservices/platform/config-server/pom.xml spring-boot:run
```

Terminal 3 - API Gateway:

```bash
SPRING_DATA_REDIS_HOST=localhost \
SPRING_DATA_REDIS_PORT=6379 \
mvn -f microservices/platform/api-gateway/pom.xml spring-boot:run
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
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:15432/airline_user \
SPRING_DATASOURCE_USERNAME=postgres \
SPRING_DATASOURCE_PASSWORD=12345678 \
SPRING_DATASOURCE_DRIVER_CLASS_NAME=org.postgresql.Driver \
SPRING_KAFKA_BOOTSTRAP_SERVERS=localhost:9092 \
SPRING_DATA_REDIS_HOST=localhost \
SPRING_DATA_REDIS_PORT=6379 \
mvn -f microservices/services/user-service/pom.xml spring-boot:run
```

Terminal 5 - Location Service:

```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5435/airline_location_db \
SPRING_DATASOURCE_USERNAME=postgres \
SPRING_DATASOURCE_PASSWORD=12345678 \
SPRING_DATASOURCE_DRIVER_CLASS_NAME=org.postgresql.Driver \
SPRING_DATA_REDIS_HOST=localhost \
SPRING_DATA_REDIS_PORT=6379 \
mvn -f microservices/services/location-service/pom.xml spring-boot:run
```

Terminal 6 - Airline Core Service:

```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5433/airline_core_db \
SPRING_DATASOURCE_USERNAME=postgres \
SPRING_DATASOURCE_PASSWORD=12345678 \
SPRING_DATASOURCE_DRIVER_CLASS_NAME=org.postgresql.Driver \
SPRING_DATA_REDIS_HOST=localhost \
SPRING_DATA_REDIS_PORT=6379 \
mvn -f microservices/services/airline-core-service/pom.xml spring-boot:run
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
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5434/airline_flight_db \
SPRING_DATASOURCE_USERNAME=postgres \
SPRING_DATASOURCE_PASSWORD=12345678 \
SPRING_DATASOURCE_DRIVER_CLASS_NAME=org.postgresql.Driver \
SPRING_KAFKA_BOOTSTRAP_SERVERS=localhost:9092 \
SPRING_DATA_REDIS_HOST=localhost \
SPRING_DATA_REDIS_PORT=6379 \
mvn -f microservices/services/flight-ops-service/pom.xml spring-boot:run
```

### Seat Service

```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5436/airline_seat_db \
SPRING_DATASOURCE_USERNAME=postgres \
SPRING_DATASOURCE_PASSWORD=12345678 \
SPRING_DATASOURCE_DRIVER_CLASS_NAME=org.postgresql.Driver \
SPRING_KAFKA_BOOTSTRAP_SERVERS=localhost:9092 \
SPRING_DATA_REDIS_HOST=localhost \
SPRING_DATA_REDIS_PORT=6379 \
mvn -f microservices/services/seat-service/pom.xml spring-boot:run
```

### Pricing Service

```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5437/airline_pricing_db \
SPRING_DATASOURCE_USERNAME=postgres \
SPRING_DATASOURCE_PASSWORD=12345678 \
SPRING_DATASOURCE_DRIVER_CLASS_NAME=org.postgresql.Driver \
SPRING_KAFKA_BOOTSTRAP_SERVERS=localhost:9092 \
SPRING_DATA_REDIS_HOST=localhost \
SPRING_DATA_REDIS_PORT=6379 \
mvn -f microservices/services/pricing-service/pom.xml spring-boot:run
```

### Ancillary Service

```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5438/airline_ancillary_db \
SPRING_DATASOURCE_USERNAME=postgres \
SPRING_DATASOURCE_PASSWORD=12345678 \
SPRING_DATASOURCE_DRIVER_CLASS_NAME=org.postgresql.Driver \
SPRING_KAFKA_BOOTSTRAP_SERVERS=localhost:9092 \
mvn -f microservices/services/ancillary-service/pom.xml spring-boot:run
```

### Booking Service

```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5439/airline_booking_db \
SPRING_DATASOURCE_USERNAME=postgres \
SPRING_DATASOURCE_PASSWORD=12345678 \
SPRING_DATASOURCE_DRIVER_CLASS_NAME=org.postgresql.Driver \
SPRING_KAFKA_BOOTSTRAP_SERVERS=localhost:9092 \
mvn -f microservices/services/booking-service/pom.xml spring-boot:run
```

### Payment Service

The payment service may require additional payment-provider environment
variables in `microservices/services/payment-service/.env`.

```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5440/airline_payment_db \
SPRING_DATASOURCE_USERNAME=postgres \
SPRING_DATASOURCE_PASSWORD=12345678 \
SPRING_DATASOURCE_DRIVER_CLASS_NAME=org.postgresql.Driver \
SPRING_KAFKA_BOOTSTRAP_SERVERS=localhost:9092 \
KAFKA_BOOTSTRAP_SERVERS=localhost:9092 \
mvn -f microservices/services/payment-service/pom.xml spring-boot:run
```

### Subscription Service

```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5441/airline_subscription_db \
SPRING_DATASOURCE_USERNAME=postgres \
SPRING_DATASOURCE_PASSWORD=12345678 \
SPRING_DATASOURCE_DRIVER_CLASS_NAME=org.postgresql.Driver \
mvn -f microservices/services/subscription-service/pom.xml spring-boot:run
```

### Notification Service

```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5442/airline_notification_db \
SPRING_DATASOURCE_USERNAME=postgres \
SPRING_DATASOURCE_PASSWORD=12345678 \
SPRING_DATASOURCE_DRIVER_CLASS_NAME=org.postgresql.Driver \
SPRING_KAFKA_BOOTSTRAP_SERVERS=localhost:9092 \
SPRING_DATA_REDIS_HOST=localhost \
SPRING_DATA_REDIS_PORT=6379 \
mvn -f microservices/services/notification-service/pom.xml spring-boot:run
```

## 5. Initialize Schemas and Seed Data

### When to Run the Seed Script

Run the seed script when:

- The databases are newly created and do not contain demo data.
- Production-style demo data needs to be reset or updated.
- Users, cities, airports, airlines, or aircraft records are missing.

The seed scripts are safe to run repeatedly because they use upsert and
conflict-handling logic.

### First Run When Database Tables Do Not Exist

PostgreSQL containers only create empty databases. They do not create JPA
tables.

1. Start the databases, Redis, and Kafka.
2. Start `service-registry` and `config-server`.
3. Start at least `user-service`, `location-service`, and
   `airline-core-service`.
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

Do not run this file directly:

```text
microservices/Documentation/sql/2026-06-05-seed-production-airline-core.sql
```

The airline-core seed file requires `flighthub_seed.*` session settings created
by `init-production-demo-data.sh`. Running it directly in a SQL editor causes a
missing seed context error.

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
