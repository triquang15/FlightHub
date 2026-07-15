#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MICROSERVICES_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$MICROSERVICES_DIR/.." && pwd)"
ENV_FILE="${FLIGHTHUB_ENV_FILE:-$REPO_ROOT/.env.local}"

usage() {
  cat <<'EOF'
Usage:
  bash microservices/scripts/run-local-service.sh <service> [maven arguments]

Platform services:
  service-registry, config-server, api-gateway

Business services:
  user-service, airline-core-service, flight-ops-service, location-service,
  seat-service, pricing-service, ancillary-service, booking-service,
  payment-service, media-service, notification-service

Examples:
  bash microservices/scripts/run-local-service.sh user-service
  bash microservices/scripts/run-local-service.sh user-service -Dspring-boot.run.profiles=dev

Use another environment file:
  FLIGHTHUB_ENV_FILE=/path/to/.env.local bash microservices/scripts/run-local-service.sh user-service
EOF
}

require_value() {
  local name="$1"

  if [[ -z "${!name:-}" ]]; then
    echo "Missing required environment variable: $name" >&2
    exit 1
  fi
}

load_environment() {
  local line
  local key
  local value

  if [[ ! -f "$ENV_FILE" ]]; then
    echo "Environment file not found: $ENV_FILE" >&2
    exit 1
  fi

  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"

    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
    line="${line#export }"

    if [[ "$line" != *"="* ]]; then
      echo "Invalid dotenv entry in $ENV_FILE: $line" >&2
      exit 1
    fi

    key="${line%%=*}"
    value="${line#*=}"
    key="${key//[[:space:]]/}"

    if [[ ! "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
      echo "Invalid environment variable name in $ENV_FILE: $key" >&2
      exit 1
    fi

    if [[ ${#value} -ge 2 ]]; then
      if [[ "$value" == \"*\" && "$value" == *\" ]] ||
         [[ "$value" == \'*\' && "$value" == *\' ]]; then
        value="${value:1:${#value}-2}"
      fi
    fi

    export "$key=$value"
  done < "$ENV_FILE"
}

configure_business_service() {
  local prefix="$1"
  local datasource_url_name="${prefix}_DATASOURCE_URL"
  local datasource_username_name="${prefix}_DATASOURCE_USERNAME"
  local datasource_password_name="${prefix}_DATASOURCE_PASSWORD"
  local kafka_name="${prefix}_KAFKA_BOOTSTRAP_SERVERS"

  require_value "$datasource_url_name"
  require_value "FLIGHTHUB_DATASOURCE_USERNAME"
  require_value "FLIGHTHUB_DATASOURCE_PASSWORD"

  export SPRING_DATASOURCE_URL="${!datasource_url_name}"
  export SPRING_DATASOURCE_USERNAME="${!datasource_username_name:-$FLIGHTHUB_DATASOURCE_USERNAME}"
  export SPRING_DATASOURCE_PASSWORD="${!datasource_password_name:-$FLIGHTHUB_DATASOURCE_PASSWORD}"
  export SPRING_DATASOURCE_DRIVER_CLASS_NAME="${SPRING_DATASOURCE_DRIVER_CLASS_NAME:-org.postgresql.Driver}"
  export SPRING_KAFKA_BOOTSTRAP_SERVERS="${!kafka_name:-${SPRING_KAFKA_BOOTSTRAP_SERVERS:-localhost:9092}}"
  export KAFKA_BOOTSTRAP_SERVERS="${KAFKA_BOOTSTRAP_SERVERS:-$SPRING_KAFKA_BOOTSTRAP_SERVERS}"
  export SPRING_DATA_REDIS_HOST="${SPRING_DATA_REDIS_HOST:-localhost}"
  export SPRING_DATA_REDIS_PORT="${SPRING_DATA_REDIS_PORT:-6379}"
}

if [[ $# -lt 1 || "$1" == "-h" || "$1" == "--help" ]]; then
  usage
  exit 0
fi

SERVICE="$1"
shift

load_environment

case "$SERVICE" in
  service-registry|config-server|api-gateway)
    POM_FILE="$MICROSERVICES_DIR/platform/$SERVICE/pom.xml"
    ;;
  user-service)
    configure_business_service "USER"
    POM_FILE="$MICROSERVICES_DIR/services/$SERVICE/pom.xml"
    ;;
  airline-core-service)
    configure_business_service "AIRLINE_CORE"
    POM_FILE="$MICROSERVICES_DIR/services/$SERVICE/pom.xml"
    ;;
  flight-ops-service)
    configure_business_service "FLIGHT_OPS"
    POM_FILE="$MICROSERVICES_DIR/services/$SERVICE/pom.xml"
    ;;
  location-service)
    configure_business_service "LOCATION"
    POM_FILE="$MICROSERVICES_DIR/services/$SERVICE/pom.xml"
    ;;
  seat-service)
    configure_business_service "SEAT"
    POM_FILE="$MICROSERVICES_DIR/services/$SERVICE/pom.xml"
    ;;
  pricing-service)
    configure_business_service "PRICING"
    POM_FILE="$MICROSERVICES_DIR/services/$SERVICE/pom.xml"
    ;;
  ancillary-service)
    configure_business_service "ANCILLARY"
    POM_FILE="$MICROSERVICES_DIR/services/$SERVICE/pom.xml"
    ;;
  booking-service)
    configure_business_service "BOOKING"
    POM_FILE="$MICROSERVICES_DIR/services/$SERVICE/pom.xml"
    ;;
  payment-service)
    configure_business_service "PAYMENT"
    POM_FILE="$MICROSERVICES_DIR/services/$SERVICE/pom.xml"
    ;;
  media-service)
    configure_business_service "MEDIA"
    POM_FILE="$MICROSERVICES_DIR/services/$SERVICE/pom.xml"
    ;;
  notification-service)
    configure_business_service "NOTIFICATION"
    POM_FILE="$MICROSERVICES_DIR/services/$SERVICE/pom.xml"
    ;;
  *)
    echo "Unknown service: $SERVICE" >&2
    usage >&2
    exit 1
    ;;
esac

echo "Starting $SERVICE using $ENV_FILE"

if [[ "${FLIGHTHUB_DRY_RUN:-false}" == "true" ]]; then
  echo "Configuration validated for $SERVICE"
  exit 0
fi

exec mvn -f "$POM_FILE" spring-boot:run "$@"
