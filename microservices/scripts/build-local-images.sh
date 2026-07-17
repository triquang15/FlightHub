#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MICROSERVICES_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$MICROSERVICES_DIR/.." && pwd)"

IMAGE_NAMESPACE="${DOCKERHUB_NAMESPACE:-triquang15}"
IMAGE_TAG="${FLIGHTHUB_IMAGE_TAG:-local}"
VITE_API_BASE_URL="${VITE_API_BASE_URL:-http://localhost:8080}"
VITE_GOOGLE_CLIENT_ID="${VITE_GOOGLE_CLIENT_ID:-}"
VITE_FACEBOOK_APP_ID="${VITE_FACEBOOK_APP_ID:-}"

service_modules=(
  "gds-service-registry|platform/service-registry|platform/service-registry/target/service-registry-0.0.1-SNAPSHOT.jar|service-registry"
  "gds-config-server|platform/config-server|platform/config-server/target/config-server-0.0.1-SNAPSHOT.jar|config-server"
  "gds-api-gateway|platform/api-gateway|platform/api-gateway/target/api-gateway-0.0.1-SNAPSHOT.jar|api-gateway"
  "gds-user|services/user-service|services/user-service/target/user-service-0.0.1-SNAPSHOT.jar|user-service"
  "gds-airline|services/airline-core-service|services/airline-core-service/target/airline-core-service-0.0.1-SNAPSHOT.jar|airline-core-service"
  "gds-flight-ops|services/flight-ops-service|services/flight-ops-service/target/flight-ops-service-0.0.1-SNAPSHOT.jar|flight-ops-service"
  "gds-location|services/location-service|services/location-service/target/location-service-0.0.1-SNAPSHOT.jar|location-service"
  "gds-seat|services/seat-service|services/seat-service/target/seat-service-0.0.1-SNAPSHOT.jar|seat-service"
  "gds-pricing|services/pricing-service|services/pricing-service/target/pricing-service-0.0.1-SNAPSHOT.jar|pricing-service"
  "gds-ancillary|services/ancillary-service|services/ancillary-service/target/ancillary-service-0.0.1-SNAPSHOT.jar|ancillary-service"
  "gds-booking|services/booking-service|services/booking-service/target/booking-service-0.0.1-SNAPSHOT.jar|booking-service"
  "gds-payment|services/payment-service|services/payment-service/target/payment-service-0.0.1-SNAPSHOT.jar|payment-service"
  "gds-media|services/media-service|services/media-service/target/media-service-0.0.1-SNAPSHOT.jar|media-service"
  "gds-notification|services/notification-service|services/notification-service/target/notification-service-0.0.1-SNAPSHOT.jar|notification-service"
)

echo "[build] Installing backend modules"
(
  cd "$MICROSERVICES_DIR"
  mvn -B -ntp -DskipTests install
)

echo "[build] Repackaging executable Spring Boot jars"
for entry in "${service_modules[@]}"; do
  IFS='|' read -r _ module _ _ <<< "$entry"
  (
    cd "$MICROSERVICES_DIR"
    mvn -B -ntp -pl "$module" -DskipTests package org.springframework.boot:spring-boot-maven-plugin:4.0.5:repackage
  )
done

echo "[build] Building backend Docker images with tag: ${IMAGE_TAG}"
for entry in "${service_modules[@]}"; do
  IFS='|' read -r image _ jar service_name <<< "$entry"
  docker build \
    -f "$MICROSERVICES_DIR/Dockerfile.service" \
    --build-arg "JAR_FILE=$jar" \
    --build-arg "SERVICE_NAME=$service_name" \
    -t "${IMAGE_NAMESPACE}/${image}:${IMAGE_TAG}" \
    "$MICROSERVICES_DIR"
done

echo "[build] Building frontend Docker image with tag: ${IMAGE_TAG}"
docker build \
  -f "$REPO_ROOT/flighthub-web/Dockerfile" \
  --build-arg "VITE_API_BASE_URL=$VITE_API_BASE_URL" \
  --build-arg "VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID" \
  --build-arg "VITE_FACEBOOK_APP_ID=$VITE_FACEBOOK_APP_ID" \
  -t "${IMAGE_NAMESPACE}/flighthub-web:${IMAGE_TAG}" \
  "$REPO_ROOT/flighthub-web"

echo "[build] Done. Run the local Docker stack with:"
echo "       FLIGHTHUB_ENV_FILE=$REPO_ROOT/.env.docker.local bash microservices/scripts/local-infra.sh stack-up"
