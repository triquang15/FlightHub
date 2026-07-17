# FlightHub Production Deployment Plan

This checklist describes what must be prepared before deploying FlightHub to a
real hosting environment and what the CI/CD flow should do after the first
production setup is complete.

## 1. Target Architecture

Recommended first production architecture:

- One Ubuntu VPS for the first production demo.
- Docker Compose runs backend services, infrastructure, frontend, and
  observability.
- Nginx terminates HTTPS and reverse-proxies traffic.
- Let's Encrypt provides free SSL certificates.
- PostgreSQL runs in containers with persistent Docker volumes for the first
  release.
- Backups are exported daily from PostgreSQL volumes/databases.
- Docker Hub stores versioned FlightHub images.
- GitHub Actions builds and deploys images after `master` is updated.

Scale-up target after the product stabilizes:

- Move PostgreSQL to managed database or a dedicated database host.
- Move uploaded files from local media storage to S3-compatible object storage.
- Move observability to a dedicated server or managed stack.
- Add blue/green or rolling deployment.

## 2. Minimum Hosting Requirements

Small production/demo environment:

- 4 vCPU
- 8 GB RAM
- 80 GB SSD
- Ubuntu 22.04 or 24.04

Recommended if Grafana, Loki, Elasticsearch, and Kibana are enabled:

- 8 vCPU
- 16 GB RAM
- 160 GB SSD

Public ports:

- `80`: HTTP challenge and redirect to HTTPS
- `443`: HTTPS traffic
- `22`: SSH access, restricted by key and ideally IP allowlist

Internal-only services:

- PostgreSQL databases
- Redis
- Kafka
- Eureka
- Config Server
- Prometheus
- Loki
- Elasticsearch
- Kibana unless explicitly protected

## 3. Domain and DNS

Create DNS records:

```text
app.example.com      -> VPS public IP
api.example.com      -> VPS public IP
grafana.example.com  -> VPS public IP, optional
kibana.example.com   -> VPS public IP, optional
```

Recommended public routing:

- `app.example.com`: frontend
- `api.example.com`: API Gateway
- `grafana.example.com`: Grafana, protected
- `kibana.example.com`: Kibana, protected

Do not expose database, Redis, Kafka, Eureka, or Config Server publicly.

## 4. Server Bootstrap Checklist

Create a non-root deploy user:

```bash
adduser deploy
usermod -aG sudo deploy
```

Install required packages:

```bash
sudo apt update
sudo apt install -y ca-certificates curl git nginx certbot python3-certbot-nginx ufw
```

Install Docker and Compose plugin:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker deploy
docker version
docker compose version
```

Configure firewall:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

Create deployment directory:

```bash
sudo mkdir -p /opt/flighthub
sudo chown -R deploy:deploy /opt/flighthub
```

## 5. Production Environment File

Create a server-only file:

```text
/opt/flighthub/.env.prod
```

Required values:

```text
FLIGHTHUB_IMAGE_TAG=latest
FLIGHTHUB_PLATFORM_IMAGE_TAG=latest

POSTGRES_PASSWORD=change-me
JWT_SECRET=change-me
INTERNAL_SERVICE_TOKEN=change-me

GOOGLE_CLIENT_ID=...
FACEBOOK_APP_ID=...
FACEBOOK_APP_SECRET=...

STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_WEBHOOK_ID=...

SMTP_HOST=...
SMTP_PORT=587
SMTP_USERNAME=...
SMTP_PASSWORD=...
SMTP_FROM=...

MEDIA_STORAGE_PROVIDER=local
MEDIA_STORAGE_PATH=/app/uploads
MEDIA_PUBLIC_BASE_URL=https://api.example.com/api/media/files

GRAFANA_ADMIN_USER=flighthub_admin
GRAFANA_ADMIN_PASSWORD=change-me
```

Rules:

- Never commit `.env.prod`.
- Store the same sensitive values in GitHub Actions secrets if deployment needs
  to generate the file.
- Rotate any secret that has been pasted into chat, logs, or screenshots.

## 6. Docker Compose Production Checklist

Before first deploy, verify:

- `docker-compose.prod.yml` includes every runtime service required for prod.
- Frontend image is included and routed through Nginx.
- PostgreSQL services use named volumes.
- Media service uses a named upload volume or S3-compatible storage.
- Database, Redis, Kafka, Eureka, Config Server, and observability ports are not
  public unless intentionally protected.
- `JPA_DDL_AUTO=validate` in prod.
- `FLYWAY_ENABLED=true` only after migration scripts are complete and tested.
- Healthchecks exist for critical services.
- Service memory limits are realistic for the VPS size.

Validate compose config:

```bash
docker compose --env-file /opt/flighthub/.env.prod \
  -f microservices/docker-compose/docker-compose.prod.yml config --quiet
```

## 7. Nginx and SSL Checklist

Create Nginx server blocks:

- `app.example.com` proxies to frontend container.
- `api.example.com` proxies to `api-gateway:8080`.
- Optional protected routes for Grafana/Kibana.

Enable SSL:

```bash
sudo certbot --nginx -d app.example.com -d api.example.com
```

Recommended headers:

- `X-Forwarded-Proto`
- `X-Forwarded-Host`
- `X-Real-IP`
- `X-Forwarded-For`

Verify HTTPS:

```bash
curl -I https://app.example.com
curl -I https://api.example.com/actuator/health
```

## 8. GitHub Secrets and Variables

Repository secrets:

```text
DOCKERHUB_USERNAME
DOCKERHUB_TOKEN

PROD_HOST
PROD_USER
PROD_SSH_KEY
PROD_DEPLOY_PATH

POSTGRES_PASSWORD
JWT_SECRET
INTERNAL_SERVICE_TOKEN

GOOGLE_CLIENT_ID
FACEBOOK_APP_ID
FACEBOOK_APP_SECRET

STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
PAYPAL_CLIENT_ID
PAYPAL_CLIENT_SECRET
PAYPAL_WEBHOOK_ID

SMTP_HOST
SMTP_PORT
SMTP_USERNAME
SMTP_PASSWORD
SMTP_FROM
```

Repository variables:

```text
VITE_API_BASE_URL=https://api.example.com
VITE_GOOGLE_CLIENT_ID=...
VITE_FACEBOOK_APP_ID=...
```

## 9. CI/CD Target Flow

Current branch model:

```text
dev -> master
```

Recommended flow:

1. Developer pushes to `dev`.
2. GitHub Actions CI runs backend package, frontend build, and compose
   validation.
3. Merge `dev` into `master` after CI is green.
4. GitHub Actions builds Docker images and pushes:

```text
triquang15/gds-api-gateway:<commit-sha>
triquang15/gds-user:<commit-sha>
...
triquang15/flighthub-web:<commit-sha>
```

5. GitHub Actions SSHs into the VPS.
6. Deployment script updates `FLIGHTHUB_IMAGE_TAG=<commit-sha>`.
7. Server pulls new images.
8. Server runs:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d
```

9. Healthchecks run against:

```text
https://api.example.com/actuator/health
https://app.example.com
```

10. If healthchecks fail, rollback to the previous image tag.

## 9.1 Local Docker CI/CD Rehearsal

Before wiring production deploys, run the same image-based flow locally.
Detailed commands live in
`microservices/Documentation/guide/docker-production-runbook.md`.

Short version:

```bash
cp .env.docker.local.example .env.docker.local
bash microservices/scripts/build-local-images.sh
FLIGHTHUB_ENV_FILE=.env.docker.local bash microservices/scripts/local-infra.sh stack-up
```

This proves that:

- Spring Boot jars can be packaged.
- Backend Docker images can be built.
- Frontend Docker image can be built.
- `docker-compose.prod.yml` can run from images instead of Maven terminals.
- The local environment can exercise the same deploy model as CI/CD.

Seed data:

```bash
FLIGHTHUB_ENV_FILE=.env.docker.local docker compose \
  --env-file .env.docker.local \
  -f microservices/docker-compose/docker-compose.prod.yml \
  --profile tools run --rm seed-production-demo-data
```

Verify:

```bash
curl -I http://localhost:8080/actuator/health
curl -I http://localhost:5173
```

Only move to VPS deployment after this local Docker rehearsal is stable.

## 10. First Manual Deployment Runbook

On local machine:

```bash
git checkout master
git pull
```

Run Docker publish from GitHub Actions manually with:

```text
image_tag=v0.1.0
push_latest=true
```

On server:

```bash
cd /opt/flighthub
git clone https://github.com/triquang15/FlightHub.git repo
cd repo
docker compose --env-file /opt/flighthub/.env.prod \
  -f microservices/docker-compose/docker-compose.prod.yml pull
docker compose --env-file /opt/flighthub/.env.prod \
  -f microservices/docker-compose/docker-compose.prod.yml up -d
```

Verify:

```bash
docker compose -f microservices/docker-compose/docker-compose.prod.yml ps
curl -I https://api.example.com/actuator/health
curl -I https://app.example.com
```

## 11. Rollback Checklist

Keep the last known good image tag:

```text
FLIGHTHUB_PREVIOUS_IMAGE_TAG=v0.1.0
```

Rollback:

```bash
cd /opt/flighthub/repo
sed -i 's/FLIGHTHUB_IMAGE_TAG=.*/FLIGHTHUB_IMAGE_TAG=v0.1.0/' /opt/flighthub/.env.prod
docker compose --env-file /opt/flighthub/.env.prod \
  -f microservices/docker-compose/docker-compose.prod.yml up -d
```

Then verify:

```bash
curl -I https://api.example.com/actuator/health
curl -I https://app.example.com
```

## 12. Database Backup Checklist

Initial acceptable backup:

- Nightly `pg_dump` per service database.
- Store backups outside the container volume.
- Keep at least 7 daily backups and 4 weekly backups.
- Test restore monthly.

Example:

```bash
mkdir -p /opt/flighthub/backups/postgres
docker exec userdb pg_dump -U postgres airline_user \
  > /opt/flighthub/backups/postgres/userdb-$(date +%F).sql
```

Production-ready backup target:

- Push encrypted backups to S3-compatible storage.
- Alert if backup fails.
- Document restore time objective.

## 13. Observability Checklist

Required:

- Gateway and services expose `/actuator/health`.
- Gateway and services expose `/actuator/prometheus`.
- Logs include `traceId`.
- Gateway forwards `X-Trace-Id`.
- Feign and RestClient propagate `X-Trace-Id`.

Recommended:

- Grafana dashboard for health, latency, and throughput.
- Loki or Elasticsearch log search by `traceId`.
- Alertmanager notification for service down and high error rate.
- Restricted access for Grafana/Kibana.

Search a production request:

```text
traceId:"<trace-id>"
```

or in Loki:

```logql
{job="flighthub"} |= "traceId=<trace-id>"
```

## 14. Security Checklist

Before public launch:

- Rotate all secrets that were shared during development.
- Disable default local passwords.
- Use SSH key login only.
- Disable root SSH login.
- Enforce HTTPS.
- Restrict observability endpoints.
- Keep database ports private.
- Configure CORS for the real frontend domain.
- Configure Google/Facebook OAuth production origins.
- Configure Stripe/PayPal production webhook URLs.
- Use strong JWT and internal service tokens.
- Confirm gateway removes spoofed identity headers.

## 15. Deployment Readiness Definition

FlightHub is ready for first production deploy when:

- CI passes on `master`.
- Docker images publish successfully.
- Production compose starts from Docker Hub images.
- Frontend can reach API Gateway through HTTPS.
- Login works with password and social providers.
- Search and booking happy path works.
- Payment sandbox or live mode is intentionally configured.
- Email notification is delivered.
- Super Admin can access health and observability pages.
- Logs can be searched by `traceId`.
- Backup and rollback have been tested once.
