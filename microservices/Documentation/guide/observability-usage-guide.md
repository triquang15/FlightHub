# FlightHub Observability Usage Guide

Use this guide when a page returns `500`, `502`, slow API responses, missing
Kafka events, or a service appears down.

## Local URLs

```text
Grafana:       http://localhost:3001
Prometheus:    http://localhost:9090
Loki:          http://localhost:3100
Elasticsearch: http://localhost:9200
Kibana:        http://localhost:5601
Alertmanager:  http://localhost:9093
```

Grafana local login:

```text
Username: flighthub_admin
Password: flighthub_admin_local
```

If login fails, the existing `grafana-data` volume may still hold an older
password. Change the password inside Grafana or recreate the Grafana volume.

## 1. Check from the Super Admin UI First

Open the FlightHub frontend:

```text
http://localhost:5173
```

Login as a System Admin, then use these pages before opening external tools:

| UI page | URL | Use it for |
| --- | --- | --- |
| Platform Overview | `/super-admin/dashboard` | First health snapshot: bookings, revenue, failed notifications, platform KPIs. |
| Observability | `/super-admin/operations/observability` | Tool hub with Grafana, Prometheus, Loki, Kibana, Elasticsearch, Alertmanager links and access notes. |
| Service Health | `/super-admin/operations/health` | Runtime service health from actuator endpoints. Use this before checking Prometheus targets. |
| Integrations | `/super-admin/configuration/integrations` | External dependencies and platform integration status, including observability links. |
| Notification Operations | `/super-admin/notifications` | Notification event/delivery overview and retry status. |
| Notification Delivery Logs | `/super-admin/notifications/deliveries` | Delivery attempts by channel/status. Start here when email/SMS is missing. |
| Notification Events | `/super-admin/notifications/events` | Kafka/event intake history. Start here when a booking/payment event seems missing. |
| Failed Deliveries | `/super-admin/notifications/failed` | Failed notification queue and retry actions. |
| Channel Health | `/super-admin/notifications/channels` | Email/SMS/Kafka/Redis channel health from notification-service. |

Recommended UI workflow:

1. Start at `Platform Overview`.
2. If a widget fails or a KPI looks wrong, open `Service Health`.
3. If the failing area is notifications, open `Notification Operations`.
4. If the failing area is monitoring/tool access, open `Observability`.
5. Use the external Grafana/Prometheus/Kibana links only after the UI narrows the
   issue to a service, metric, log, or integration.

## 2. Confirm the Stack Is Running

```bash
bash microservices/scripts/local-infra.sh observability-status
```

Expected core tools:

```text
gds-grafana          Up
gds-prometheus       Up
gds-loki             Up
gds-promtail         Up
gds-elasticsearch    Up healthy
gds-kibana           Up
gds-alertmanager     Up
```

If Docker reports orphan containers or a missing network, recreate only the
observability group without deleting database volumes:

```bash
docker compose --env-file .env.local \
  -f microservices/docker-compose/docker-compose.dev.yml \
  --profile observability \
  up -d --force-recreate --remove-orphans \
  redis-exporter kafka-exporter prometheus grafana loki promtail elasticsearch kibana alertmanager
```

## 3. Grafana: Service Health, Throughput, Latency

Open:

```text
http://localhost:3001
```

Recommended workflow:

1. Open the FlightHub dashboard.
2. Check `Service scrape health`.
3. If a service tile is red, confirm that service is running via Maven or Docker.
4. Check `HTTP throughput` to see whether requests reach the platform.
5. Check `Max request latency` when the UI feels slow.

Important notes:

- A red service tile usually means Prometheus cannot scrape
  `http://localhost:<service-port>/actuator/prometheus`.
- Services started before observability changes may need a restart.
- A service that is intentionally not running should be ignored for the current
  test scope.

## 4. Prometheus: Raw Metrics and Target Status

Open:

```text
http://localhost:9090
```

Useful pages:

```text
Status -> Targets
Graph
Alerts
```

Useful queries:

```promql
up
```

```promql
sum(rate(http_server_requests_seconds_count[1m])) by (application)
```

```promql
max(http_server_requests_seconds_max) by (application)
```

```promql
sum(rate(http_server_requests_seconds_count{status=~"5.."}[5m])) by (application, uri)
```

Use Prometheus when you need to know whether a service is scrapeable and which
API route is producing errors.

## 5. Loki in Grafana: Logs by Service or Trace ID

Grafana has a Loki datasource. Open:

```text
Grafana -> Explore -> Loki
```

Useful LogQL queries:

```logql
{container_name=~"gds-.*|.*service.*"}
```

```logql
{container_name="gds-prometheus"} |= "error"
```

For Maven-run Spring services, logs are usually in the terminal where the
service is running. Use the `traceId` printed by API Gateway to correlate logs:

```text
traceId=<copy-from-api-gateway-log>
```

Search that same trace ID in the relevant service terminal log first, then in
Grafana Explore if the service runs in Docker and Promtail is collecting it.

## 6. Follow a Service Call Flow by Trace ID

FlightHub uses `X-Trace-Id` for request correlation.

Flow rules:

- API Gateway creates or accepts `X-Trace-Id`.
- API Gateway forwards `X-Trace-Id` to downstream services.
- Common Feign propagation forwards the same `X-Trace-Id` across service-to-service calls.
- RestClient propagation forwards the same `X-Trace-Id` for direct internal HTTP calls.
- Kafka events should include business identifiers such as `bookingId`,
  `paymentId`, and booking reference; use those together with timestamps when
  following asynchronous flow.

Important distinction:

```text
GET /actuator/prometheus
```

is an observability scrape, not a user journey. Its flow is:

```text
Prometheus -> service /actuator/prometheus
```

For business debugging, start with a UI/API request such as:

```text
POST /api/bookings
POST /api/auth/facebook
GET /api/flights/search
POST /api/payments/verify
```

Example booking flow:

```text
Browser
  -> api-gateway
  -> booking-service
  -> flight-ops-service
  -> pricing-service
  -> seat-service
  -> ancillary-service
  -> payment-service
  -> Stripe/PayPal
  -> Kafka payment event
  -> booking-service payment consumer
  -> Kafka booking event
  -> notification-service
  -> email/SMS provider
```

How to follow it:

1. Open DevTools Network and click the failing or important API request.
2. Copy the `X-Trace-Id` response header or the `traceId` field in the API response.
3. Search the same trace ID in API Gateway logs.
4. Search the same trace ID in downstream service logs.
5. For async Kafka steps, switch from `traceId` to the business identifier
   emitted in logs or events, for example booking reference, `bookingId`, or
   `paymentId`.

Terminal examples:

```bash
grep "traceId=<trace-id>" api-gateway.log
grep "traceId=<trace-id>" booking-service.log
grep "traceId=<trace-id>" payment-service.log
```

Grafana Loki example:

```logql
{container_name=~".*"} |= "<trace-id>"
```

Kibana query examples:

```text
traceId : "<trace-id>"
```

```text
message : "<booking-reference>"
```

## 7. Kibana and Elasticsearch: Indexed Operational Logs

Open:

```text
Kibana:        http://localhost:5601
Elasticsearch: http://localhost:9200
```

Use Kibana for longer log search and filtering when data is indexed into
Elasticsearch. Typical flow:

1. Open `Discover`.
2. Select or create a data view for the indexed logs.
3. Filter by service name, `traceId`, status code, or error keyword.
4. Narrow the time range to the minute when the UI error happened.

Quick Elasticsearch health check:

```bash
curl -s http://localhost:9200/_cluster/health?pretty
```

Quick index list:

```bash
curl -s http://localhost:9200/_cat/indices?v
```

## 8. Debug Checklist for a UI Error

When the browser shows a failed API call:

1. Open `Service Health` in Super Admin and confirm the target service is up.
2. Open the browser DevTools Network tab and copy the failing URL and status.
3. Check API Gateway log and copy the `traceId`.
4. Check Grafana `HTTP throughput` and `Max request latency`.
5. Check Prometheus `Status -> Targets` for the service.
6. Search the service terminal log by `traceId`.
7. If the service runs in Docker, search Loki or Kibana by `traceId`.
8. Fix the service error, restart that service, and retry the UI flow.
