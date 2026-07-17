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
```

For deterministic testing:

```text
FLIGHTHUB_IMAGE_TAG=sha-abc1234
FLIGHTHUB_PLATFORM_IMAGE_TAG=sha-abc1234
```

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

Check containers:

```bash
FLIGHTHUB_ENV_FILE=.env.docker.local bash microservices/scripts/local-infra.sh stack-status
```

Open:

```text
Frontend:    http://localhost:5173
API Gateway: http://localhost:8080
Kafka UI:    http://localhost:8000
```

## 8. Seed Demo Data

Seed the Docker databases:

```bash
FLIGHTHUB_ENV_FILE=.env.docker.local docker compose \
  --env-file .env.docker.local \
  -f microservices/docker-compose/docker-compose.prod.yml \
  --profile tools run --rm seed-production-demo-data
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
