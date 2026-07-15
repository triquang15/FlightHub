#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MICROSERVICES_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$MICROSERVICES_DIR/.." && pwd)"
ENV_FILE="${FLIGHTHUB_ENV_FILE:-$REPO_ROOT/.env.local}"
DEV_COMPOSE_FILE="${FLIGHTHUB_DEV_COMPOSE_FILE:-$MICROSERVICES_DIR/docker-compose/docker-compose.dev.yml}"
PROD_COMPOSE_FILE="${FLIGHTHUB_PROD_COMPOSE_FILE:-$MICROSERVICES_DIR/docker-compose/docker-compose.prod.yml}"

INFRA_SERVICES=(
  userdb airlinecoredb flightopsdb locationdb seatdb pricingdb ancillarydb
  bookingdb paymentdb mediadb notificationdb redis kafka kafka-ui
)

OBSERVABILITY_SERVICES=(
  redis-exporter kafka-exporter prometheus grafana loki promtail elasticsearch kibana alertmanager
)

FRONTEND_SERVICES=(
  flighthub-web
)

compose() {
  docker compose --env-file "$ENV_FILE" -f "$DEV_COMPOSE_FILE" "$@"
}

compose_prod() {
  docker compose --env-file "$ENV_FILE" -f "$PROD_COMPOSE_FILE" "$@"
}

case "${1:-}" in
  up)
    compose up -d "${INFRA_SERVICES[@]}"
    ;;
  down)
    compose stop "${INFRA_SERVICES[@]}"
    ;;
  status|ps)
    compose ps "${INFRA_SERVICES[@]}"
    ;;
  observability-up)
    compose --profile observability up -d "${OBSERVABILITY_SERVICES[@]}"
    ;;
  observability-down)
    compose --profile observability stop "${OBSERVABILITY_SERVICES[@]}"
    ;;
  observability-status)
    compose --profile observability ps "${OBSERVABILITY_SERVICES[@]}"
    ;;
  frontend-up)
    compose --profile frontend up -d "${FRONTEND_SERVICES[@]}"
    ;;
  frontend-down)
    compose --profile frontend stop "${FRONTEND_SERVICES[@]}"
    ;;
  frontend-status)
    compose --profile frontend ps "${FRONTEND_SERVICES[@]}"
    ;;
  stack-up)
    compose_prod up -d
    ;;
  stack-stop)
    compose_prod stop
    ;;
  stack-status)
    compose_prod ps
    ;;
  logs)
    shift
    if [[ $# -gt 0 ]]; then
      compose logs -f "$@"
    else
      compose logs -f "${INFRA_SERVICES[@]}"
    fi
    ;;
  *)
    echo "Usage: bash microservices/scripts/local-infra.sh {up|down|status|logs [service]|frontend-up|frontend-down|frontend-status|observability-up|observability-down|observability-status|stack-up|stack-stop|stack-status}" >&2
    exit 1
    ;;
esac
