#!/usr/bin/env bash
set -euo pipefail

# Requires the target PostgreSQL containers to be running and service schemas
# to have been created by the Spring Boot services.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MICROSERVICES_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-$MICROSERVICES_DIR/docker-compose/docker-compose.yml}"
SQL_DIR="$MICROSERVICES_DIR/Documentation/sql"

POSTGRES_USER="${POSTGRES_USER:-postgres}"

USER_SEED_SQL="$SQL_DIR/2026-06-03-seed-production-users.sql"
CITY_SEED_SQL="$SQL_DIR/2026-06-03-seed-production-cities.sql"
AIRPORT_SEED_SQL="$SQL_DIR/2026-06-03-seed-production-airports.sql"
AIRLINE_CORE_SEED_SQL="$SQL_DIR/2026-06-05-seed-production-airline-core.sql"
FLIGHT_OPS_SEED_SQL="$SQL_DIR/2026-06-07-seed-production-flight-ops.sql"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required to run this seed script." >&2
  exit 1
fi

for file in "$USER_SEED_SQL" "$CITY_SEED_SQL" "$AIRPORT_SEED_SQL" "$AIRLINE_CORE_SEED_SQL" "$FLIGHT_OPS_SEED_SQL"; do
  if [[ ! -f "$file" ]]; then
    echo "Required SQL seed file not found: $file" >&2
    exit 1
  fi
done

compose() {
  docker compose -f "$COMPOSE_FILE" "$@"
}

psql_exec() {
  local service="$1"
  local database="$2"
  shift 2

  compose exec -T "$service" psql -U "$POSTGRES_USER" -d "$database" "$@"
}

run_sql_file() {
  local service="$1"
  local database="$2"
  local file="$3"
  shift 3

  echo "==> Seeding $database with $(basename "$file")"
  psql_exec "$service" "$database" -v ON_ERROR_STOP=1 "$@" < "$file"
}

run_sql_file_with_settings() {
  local service="$1"
  local database="$2"
  local file="$3"
  shift 3

  echo "==> Seeding $database with $(basename "$file")"
  {
    local setting
    for setting in "$@"; do
      printf "SET flighthub_seed.%s = '%s';\n" "${setting%%=*}" "${setting#*=}"
    done
    printf "\n"
    cat "$file"
  } | psql_exec "$service" "$database" -v ON_ERROR_STOP=1
}

query_scalar() {
  local service="$1"
  local database="$2"
  local sql="$3"

  psql_exec "$service" "$database" -At -v ON_ERROR_STOP=1 -c "$sql" | tr -d '[:space:]'
}

require_value() {
  local name="$1"
  local value="$2"

  if [[ -z "$value" ]]; then
    echo "Required seed lookup failed: $name" >&2
    exit 1
  fi
}

lookup_user_id() {
  local email="$1"
  query_scalar userdb airline_user "SELECT id FROM users WHERE email = '$email';"
}

lookup_city_id() {
  local city_code="$1"
  query_scalar locationdb airline_location_db "SELECT id FROM cities WHERE city_code = '$city_code';"
}

lookup_airport_id() {
  local iata_code="$1"
  query_scalar locationdb airline_location_db "SELECT id FROM airports WHERE iata_code = '$iata_code';"
}

echo "FlightHub production-style demo data init"
echo "Compose file: $COMPOSE_FILE"
echo

run_sql_file userdb airline_user "$USER_SEED_SQL"
run_sql_file locationdb airline_location_db "$CITY_SEED_SQL"
run_sql_file locationdb airline_location_db "$AIRPORT_SEED_SQL"

echo "==> Resolving cross-service IDs"

owner_vietnam="$(lookup_user_id owner.vietnamairlines@flighthub.local)"
owner_vietjet="$(lookup_user_id owner.vietjet@flighthub.local)"
owner_bamboo="$(lookup_user_id owner.bamboo@flighthub.local)"
owner_singapore="$(lookup_user_id owner.singaporeair@flighthub.local)"
owner_thai="$(lookup_user_id owner.thaiairways@flighthub.local)"
owner_airasia="$(lookup_user_id owner.airasia@flighthub.local)"
owner_cathay="$(lookup_user_id owner.cathay@flighthub.local)"
owner_jal="$(lookup_user_id owner.jal@flighthub.local)"
owner_emirates="$(lookup_user_id owner.emirates@flighthub.local)"
owner_qatar="$(lookup_user_id owner.qatarairways@flighthub.local)"

city_sgn="$(lookup_city_id SGN)"
city_han="$(lookup_city_id HAN)"
city_sin="$(lookup_city_id SIN)"
city_bkk="$(lookup_city_id BKK)"
city_kul="$(lookup_city_id KUL)"
city_hkg="$(lookup_city_id HKG)"
city_tyo="$(lookup_city_id TYO)"
city_dxb="$(lookup_city_id DXB)"
city_doh="$(lookup_city_id DOH)"

apt_sgn="$(lookup_airport_id SGN)"
apt_han="$(lookup_airport_id HAN)"
apt_dad="$(lookup_airport_id DAD)"
apt_sin="$(lookup_airport_id SIN)"
apt_bkk="$(lookup_airport_id BKK)"
apt_kul="$(lookup_airport_id KUL)"
apt_hkg="$(lookup_airport_id HKG)"
apt_hnd="$(lookup_airport_id HND)"
apt_dxb="$(lookup_airport_id DXB)"
apt_doh="$(lookup_airport_id DOH)"

require_value owner_vietnam "$owner_vietnam"
require_value owner_vietjet "$owner_vietjet"
require_value owner_bamboo "$owner_bamboo"
require_value owner_singapore "$owner_singapore"
require_value owner_thai "$owner_thai"
require_value owner_airasia "$owner_airasia"
require_value owner_cathay "$owner_cathay"
require_value owner_jal "$owner_jal"
require_value owner_emirates "$owner_emirates"
require_value owner_qatar "$owner_qatar"
require_value city_sgn "$city_sgn"
require_value city_han "$city_han"
require_value city_sin "$city_sin"
require_value city_bkk "$city_bkk"
require_value city_kul "$city_kul"
require_value city_hkg "$city_hkg"
require_value city_tyo "$city_tyo"
require_value city_dxb "$city_dxb"
require_value city_doh "$city_doh"
require_value apt_sgn "$apt_sgn"
require_value apt_han "$apt_han"
require_value apt_dad "$apt_dad"
require_value apt_sin "$apt_sin"
require_value apt_bkk "$apt_bkk"
require_value apt_kul "$apt_kul"
require_value apt_hkg "$apt_hkg"
require_value apt_hnd "$apt_hnd"
require_value apt_dxb "$apt_dxb"
require_value apt_doh "$apt_doh"

run_sql_file_with_settings \
  airlinecoredb \
  airline_core_db \
  "$AIRLINE_CORE_SEED_SQL" \
  owner_vietnam="$owner_vietnam" \
  owner_vietjet="$owner_vietjet" \
  owner_bamboo="$owner_bamboo" \
  owner_singapore="$owner_singapore" \
  owner_thai="$owner_thai" \
  owner_airasia="$owner_airasia" \
  owner_cathay="$owner_cathay" \
  owner_jal="$owner_jal" \
  owner_emirates="$owner_emirates" \
  owner_qatar="$owner_qatar" \
  city_sgn="$city_sgn" \
  city_han="$city_han" \
  city_sin="$city_sin" \
  city_bkk="$city_bkk" \
  city_kul="$city_kul" \
  city_hkg="$city_hkg" \
  city_tyo="$city_tyo" \
  city_dxb="$city_dxb" \
  city_doh="$city_doh" \
  apt_sgn="$apt_sgn" \
  apt_han="$apt_han" \
  apt_dad="$apt_dad" \
  apt_sin="$apt_sin" \
  apt_bkk="$apt_bkk" \
  apt_kul="$apt_kul" \
  apt_hkg="$apt_hkg" \
  apt_hnd="$apt_hnd" \
  apt_dxb="$apt_dxb" \
  apt_doh="$apt_doh"

echo "==> Resolving airline-core IDs for flight-ops"

airline_vn="$(query_scalar airlinecoredb airline_core_db "SELECT id FROM airlines WHERE iata_code = 'VN';")"
airline_vj="$(query_scalar airlinecoredb airline_core_db "SELECT id FROM airlines WHERE iata_code = 'VJ';")"
airline_ak="$(query_scalar airlinecoredb airline_core_db "SELECT id FROM airlines WHERE iata_code = 'AK';")"
airline_sq="$(query_scalar airlinecoredb airline_core_db "SELECT id FROM airlines WHERE iata_code = 'SQ';")"
airline_tg="$(query_scalar airlinecoredb airline_core_db "SELECT id FROM airlines WHERE iata_code = 'TG';")"
airline_cx="$(query_scalar airlinecoredb airline_core_db "SELECT id FROM airlines WHERE iata_code = 'CX';")"
airline_jl="$(query_scalar airlinecoredb airline_core_db "SELECT id FROM airlines WHERE iata_code = 'JL';")"
airline_ek="$(query_scalar airlinecoredb airline_core_db "SELECT id FROM airlines WHERE iata_code = 'EK';")"
airline_qr="$(query_scalar airlinecoredb airline_core_db "SELECT id FROM airlines WHERE iata_code = 'QR';")"

aircraft_vn_a359="$(query_scalar airlinecoredb airline_core_db "SELECT id FROM aircrafts WHERE aircraft_code = 'VN-A359-01';")"
aircraft_vn_b789="$(query_scalar airlinecoredb airline_core_db "SELECT id FROM aircrafts WHERE aircraft_code = 'VN-B789-02';")"
aircraft_vj_a321="$(query_scalar airlinecoredb airline_core_db "SELECT id FROM aircrafts WHERE aircraft_code = 'VJ-A321-01';")"
aircraft_ak_a320="$(query_scalar airlinecoredb airline_core_db "SELECT id FROM aircrafts WHERE aircraft_code = 'AK-A320-01';")"
aircraft_sq_a359="$(query_scalar airlinecoredb airline_core_db "SELECT id FROM aircrafts WHERE aircraft_code = 'SQ-A359-01';")"
aircraft_tg_b77w="$(query_scalar airlinecoredb airline_core_db "SELECT id FROM aircrafts WHERE aircraft_code = 'TG-B77W-01';")"
aircraft_cx_a35k="$(query_scalar airlinecoredb airline_core_db "SELECT id FROM aircrafts WHERE aircraft_code = 'CX-A35K-01';")"
aircraft_jl_b789="$(query_scalar airlinecoredb airline_core_db "SELECT id FROM aircrafts WHERE aircraft_code = 'JL-B789-01';")"
aircraft_ek_a388="$(query_scalar airlinecoredb airline_core_db "SELECT id FROM aircrafts WHERE aircraft_code = 'EK-A388-01';")"
aircraft_qr_a359="$(query_scalar airlinecoredb airline_core_db "SELECT id FROM aircrafts WHERE aircraft_code = 'QR-A359-01';")"

for required in \
  airline_vn airline_vj airline_ak airline_sq airline_tg airline_cx airline_jl airline_ek airline_qr \
  aircraft_vn_a359 aircraft_vn_b789 aircraft_vj_a321 aircraft_ak_a320 aircraft_sq_a359 aircraft_tg_b77w \
  aircraft_cx_a35k aircraft_jl_b789 aircraft_ek_a388 aircraft_qr_a359; do
  require_value "$required" "${!required}"
done

run_sql_file_with_settings \
  flightopsdb \
  airline_flight_db \
  "$FLIGHT_OPS_SEED_SQL" \
  airline_vn="$airline_vn" \
  airline_vj="$airline_vj" \
  airline_ak="$airline_ak" \
  airline_sq="$airline_sq" \
  airline_tg="$airline_tg" \
  airline_cx="$airline_cx" \
  airline_jl="$airline_jl" \
  airline_ek="$airline_ek" \
  airline_qr="$airline_qr" \
  aircraft_vn_a359="$aircraft_vn_a359" \
  aircraft_vn_b789="$aircraft_vn_b789" \
  aircraft_vj_a321="$aircraft_vj_a321" \
  aircraft_ak_a320="$aircraft_ak_a320" \
  aircraft_sq_a359="$aircraft_sq_a359" \
  aircraft_tg_b77w="$aircraft_tg_b77w" \
  aircraft_cx_a35k="$aircraft_cx_a35k" \
  aircraft_jl_b789="$aircraft_jl_b789" \
  aircraft_ek_a388="$aircraft_ek_a388" \
  aircraft_qr_a359="$aircraft_qr_a359" \
  apt_sgn="$apt_sgn" \
  apt_han="$apt_han" \
  apt_dad="$apt_dad" \
  apt_sin="$apt_sin" \
  apt_bkk="$apt_bkk" \
  apt_kul="$apt_kul" \
  apt_hkg="$apt_hkg" \
  apt_hnd="$apt_hnd" \
  apt_dxb="$apt_dxb" \
  apt_doh="$apt_doh"

echo
echo "Seed complete."
echo "Default seeded password for local users: Password@123"
echo "Admin login: admin@flighthub.local"
