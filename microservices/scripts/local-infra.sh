#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MICROSERVICES_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$MICROSERVICES_DIR/.." && pwd)"
ENV_FILE="${FLIGHTHUB_ENV_FILE:-$REPO_ROOT/.env.local}"
COMPOSE_FILE="$MICROSERVICES_DIR/docker-compose/docker-compose.yml"

INFRA_SERVICES=(
  userdb airlinecoredb flightopsdb locationdb seatdb pricingdb ancillarydb
  bookingdb paymentdb subscriptiondb notificationdb redis kafka kafka-ui
)

compose() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
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
  stack-up)
    compose up -d
    ;;
  stack-stop)
    compose stop
    ;;
  stack-status)
    compose ps
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
    echo "Usage: bash microservices/scripts/local-infra.sh {up|down|status|logs [service]|stack-up|stack-stop|stack-status}" >&2
    exit 1
    ;;
esac
