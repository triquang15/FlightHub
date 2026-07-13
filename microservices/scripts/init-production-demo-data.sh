#!/usr/bin/env bash
set -euo pipefail

# Requires the target PostgreSQL containers to be running and service schemas
# to have been created by the Spring Boot services.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MICROSERVICES_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-$MICROSERVICES_DIR/docker-compose/docker-compose.dev.yml}"
SQL_DIR="$MICROSERVICES_DIR/Documentation/sql"

POSTGRES_USER="${POSTGRES_USER:-postgres}"

USER_SEED_SQL="$SQL_DIR/2026-06-03-seed-production-users.sql"
CITY_SEED_SQL="$SQL_DIR/2026-06-03-seed-production-cities.sql"
AIRPORT_SEED_SQL="$SQL_DIR/2026-06-03-seed-production-airports.sql"
AIRLINE_CORE_MIGRATION_SQL="$SQL_DIR/2026-07-02-migrate-airline-status-pending.sql"
AIRLINE_CORE_SEED_SQL="$SQL_DIR/2026-06-05-seed-production-airline-core.sql"
SEAT_SERVICE_SEED_SQL="$SQL_DIR/2026-06-08-seed-production-seat-service.sql"
FLIGHT_OPS_SEED_SQL="$SQL_DIR/2026-06-07-seed-production-flight-ops.sql"
BOOKING_SEAT_INVENTORY_SEED_SQL="$SQL_DIR/2026-06-28-seed-booking-seat-inventory.sql"
PRICING_SEED_SQL="$SQL_DIR/2026-06-20-seed-production-pricing-service.sql"
BOOKING_MIGRATION_SQL="$SQL_DIR/2026-06-20-migrate-booking-checkout-integrity.sql"
SUPER_ADMIN_ANALYTICS_SEED_SQL="$SQL_DIR/2026-07-08-seed-super-admin-analytics.sql"
PAYMENT_MIGRATION_SQL="$SQL_DIR/2026-06-20-migrate-payment-idempotency.sql"
ANCILLARY_MIGRATION_SQL="$SQL_DIR/2026-06-20-migrate-ancillary-commercial-integrity.sql"
ANCILLARY_SEED_SQL="$SQL_DIR/2026-06-20-seed-production-ancillary-service.sql"
NOTIFICATION_SEED_SQL="$SQL_DIR/2026-07-10-seed-notification-operations.sql"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required to run this seed script." >&2
  exit 1
fi

for file in "$USER_SEED_SQL" "$CITY_SEED_SQL" "$AIRPORT_SEED_SQL" "$AIRLINE_CORE_MIGRATION_SQL" "$AIRLINE_CORE_SEED_SQL" \
  "$SEAT_SERVICE_SEED_SQL" "$FLIGHT_OPS_SEED_SQL" "$BOOKING_SEAT_INVENTORY_SEED_SQL" "$PRICING_SEED_SQL"; do
  if [[ ! -f "$file" ]]; then
    echo "Required SQL seed file not found: $file" >&2
    exit 1
  fi
done

for file in "$BOOKING_MIGRATION_SQL" "$SUPER_ADMIN_ANALYTICS_SEED_SQL" "$PAYMENT_MIGRATION_SQL" "$ANCILLARY_MIGRATION_SQL" "$ANCILLARY_SEED_SQL" "$NOTIFICATION_SEED_SQL"; do
  if [[ ! -f "$file" ]]; then
    echo "Required demo SQL file not found: $file" >&2
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

require_table() {
  local service="$1"
  local database="$2"
  local table="$3"
  local found

  found="$(query_scalar "$service" "$database" "SELECT COALESCE(to_regclass('public.$table')::text, '');")"
  if [[ -z "$found" ]]; then
    echo "Required table not found: $database.$table" >&2
    echo "Start the Spring services first so Hibernate creates schemas, then rerun this seed script." >&2
    exit 1
  fi
}

require_service_schemas() {
  require_table userdb airline_user users
  require_table locationdb airline_location_db cities
  require_table locationdb airline_location_db airports
  require_table airlinecoredb airline_core_db airlines
  require_table seatdb airline_seat_db cabin_classes
  require_table flightopsdb airline_flight_db flights
  require_table pricingdb airline_pricing_db fares
  require_table ancillarydb airline_ancillary_db ancillaries
  require_table bookingdb airline_booking_db bookings
  require_table paymentdb airline_payment_db payments
  require_table notificationdb airline_notification_db notification_events
  require_table notificationdb airline_notification_db notification_deliveries
}

lookup_user_id() {
  local email="$1"
  query_scalar userdb airline_user "SELECT id FROM users WHERE email = '$email';"
}

lookup_fare_id() {
  local flight_id="$1"
  local fare_name="$2"
  query_scalar pricingdb airline_pricing_db "SELECT id FROM fares WHERE flight_id = $flight_id AND name = '$fare_name';"
}

lookup_city_id() {
  local city_code="$1"
  query_scalar locationdb airline_location_db "SELECT id FROM cities WHERE city_code = '$city_code';"
}

lookup_airport_id() {
  local iata_code="$1"
  query_scalar locationdb airline_location_db "SELECT id FROM airports WHERE iata_code = '$iata_code';"
}

lookup_upcoming_flight_instance_ids() {
  local flight_number="$1"
  local limit_count="${2:-14}"

  query_scalar flightopsdb airline_flight_db "
    SELECT COALESCE(string_agg(id::text, ',' ORDER BY departure_date_time), '')
    FROM (
      SELECT fi.id, fi.departure_date_time
      FROM flight_instances fi
      JOIN flights f ON f.id = fi.flight_id
      WHERE f.flight_number = '$flight_number'
        AND fi.departure_date_time >= CURRENT_DATE
        AND fi.status = 'SCHEDULED'
        AND fi.is_active = true
      ORDER BY fi.departure_date_time
      LIMIT $limit_count
    ) upcoming_instances;"
}

echo "FlightHub production-style demo data init"
echo "Compose file: $COMPOSE_FILE"
echo

echo "==> Checking service schemas"
require_service_schemas

run_sql_file userdb airline_user "$USER_SEED_SQL"
run_sql_file locationdb airline_location_db "$CITY_SEED_SQL"
run_sql_file locationdb airline_location_db "$AIRPORT_SEED_SQL"
run_sql_file airlinecoredb airline_core_db "$AIRLINE_CORE_MIGRATION_SQL"

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
customer_minhanh="$(lookup_user_id minhanh.nguyen@example.com)"
customer_quocbao="$(lookup_user_id quocbao.tran@example.com)"
customer_hoangphuc="$(lookup_user_id hoangphuc.le@example.com)"
customer_giahan="$(lookup_user_id giahan.pham@example.com)"
customer_thanhdat="$(lookup_user_id thanhdat.vo@example.com)"
customer_ngoclinh="$(lookup_user_id ngoclinh.dang@example.com)"
customer_tuankiet="$(lookup_user_id tuankiet.bui@example.com)"
customer_phuongthao="$(lookup_user_id phuongthao.do@example.com)"
customer_duchuy="$(lookup_user_id duchuy.hoang@example.com)"
customer_khanhvy="$(lookup_user_id khanhvy.mai@example.com)"
customer_giabao="$(lookup_user_id giabao.nguyen@example.com)"
customer_minhthu="$(lookup_user_id minhthu.tran@example.com)"
customer_baochau="$(lookup_user_id baochau.le@example.com)"
customer_anhtuan="$(lookup_user_id anhtuan.pham@example.com)"
customer_myduyen="$(lookup_user_id myduyen.vo@example.com)"

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
require_value customer_minhanh "$customer_minhanh"
require_value customer_quocbao "$customer_quocbao"
require_value customer_hoangphuc "$customer_hoangphuc"
require_value customer_giahan "$customer_giahan"
require_value customer_thanhdat "$customer_thanhdat"
require_value customer_ngoclinh "$customer_ngoclinh"
require_value customer_tuankiet "$customer_tuankiet"
require_value customer_phuongthao "$customer_phuongthao"
require_value customer_duchuy "$customer_duchuy"
require_value customer_khanhvy "$customer_khanhvy"
require_value customer_giabao "$customer_giabao"
require_value customer_minhthu "$customer_minhthu"
require_value customer_baochau "$customer_baochau"
require_value customer_anhtuan "$customer_anhtuan"
require_value customer_myduyen "$customer_myduyen"
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
  seatdb \
  airline_seat_db \
  "$SEAT_SERVICE_SEED_SQL" \
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
  aircraft_qr_a359="$aircraft_qr_a359"

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

echo "==> Resolving Flight and Cabin Class IDs for pricing"

flight_vn210="$(query_scalar flightopsdb airline_flight_db "SELECT id FROM flights WHERE flight_number = 'VN210';")"
flight_vn211="$(query_scalar flightopsdb airline_flight_db "SELECT id FROM flights WHERE flight_number = 'VN211';")"
flight_vn218="$(query_scalar flightopsdb airline_flight_db "SELECT id FROM flights WHERE flight_number = 'VN218';")"
flight_vn136="$(query_scalar flightopsdb airline_flight_db "SELECT id FROM flights WHERE flight_number = 'VN136';")"
flight_vn117="$(query_scalar flightopsdb airline_flight_db "SELECT id FROM flights WHERE flight_number = 'VN117';")"
flight_vn135="$(query_scalar flightopsdb airline_flight_db "SELECT id FROM flights WHERE flight_number = 'VN135';")"
flight_vn651="$(query_scalar flightopsdb airline_flight_db "SELECT id FROM flights WHERE flight_number = 'VN651';")"
flight_vn650="$(query_scalar flightopsdb airline_flight_db "SELECT id FROM flights WHERE flight_number = 'VN650';")"
flight_vn652="$(query_scalar flightopsdb airline_flight_db "SELECT id FROM flights WHERE flight_number = 'VN652';")"
flight_vj122="$(query_scalar flightopsdb airline_flight_db "SELECT id FROM flights WHERE flight_number = 'VJ122';")"
flight_vj123="$(query_scalar flightopsdb airline_flight_db "SELECT id FROM flights WHERE flight_number = 'VJ123';")"
flight_vj504="$(query_scalar flightopsdb airline_flight_db "SELECT id FROM flights WHERE flight_number = 'VJ504';")"
flight_vj505="$(query_scalar flightopsdb airline_flight_db "SELECT id FROM flights WHERE flight_number = 'VJ505';")"
flight_vj803="$(query_scalar flightopsdb airline_flight_db "SELECT id FROM flights WHERE flight_number = 'VJ803';")"
flight_vj804="$(query_scalar flightopsdb airline_flight_db "SELECT id FROM flights WHERE flight_number = 'VJ804';")"
flight_ak520="$(query_scalar flightopsdb airline_flight_db "SELECT id FROM flights WHERE flight_number = 'AK520';")"
flight_ak521="$(query_scalar flightopsdb airline_flight_db "SELECT id FROM flights WHERE flight_number = 'AK521';")"
flight_ak512="$(query_scalar flightopsdb airline_flight_db "SELECT id FROM flights WHERE flight_number = 'AK512';")"
flight_ak513="$(query_scalar flightopsdb airline_flight_db "SELECT id FROM flights WHERE flight_number = 'AK513';")"
flight_sq185="$(query_scalar flightopsdb airline_flight_db "SELECT id FROM flights WHERE flight_number = 'SQ185';")"
flight_sq186="$(query_scalar flightopsdb airline_flight_db "SELECT id FROM flights WHERE flight_number = 'SQ186';")"
flight_sq176="$(query_scalar flightopsdb airline_flight_db "SELECT id FROM flights WHERE flight_number = 'SQ176';")"
flight_sq175="$(query_scalar flightopsdb airline_flight_db "SELECT id FROM flights WHERE flight_number = 'SQ175';")"
flight_tg551="$(query_scalar flightopsdb airline_flight_db "SELECT id FROM flights WHERE flight_number = 'TG551';")"
flight_tg550="$(query_scalar flightopsdb airline_flight_db "SELECT id FROM flights WHERE flight_number = 'TG550';")"
flight_tg560="$(query_scalar flightopsdb airline_flight_db "SELECT id FROM flights WHERE flight_number = 'TG560';")"
flight_tg561="$(query_scalar flightopsdb airline_flight_db "SELECT id FROM flights WHERE flight_number = 'TG561';")"
flight_cx764="$(query_scalar flightopsdb airline_flight_db "SELECT id FROM flights WHERE flight_number = 'CX764';")"
flight_cx765="$(query_scalar flightopsdb airline_flight_db "SELECT id FROM flights WHERE flight_number = 'CX765';")"
flight_cx743="$(query_scalar flightopsdb airline_flight_db "SELECT id FROM flights WHERE flight_number = 'CX743';")"
flight_cx742="$(query_scalar flightopsdb airline_flight_db "SELECT id FROM flights WHERE flight_number = 'CX742';")"
flight_ek393="$(query_scalar flightopsdb airline_flight_db "SELECT id FROM flights WHERE flight_number = 'EK393';")"
flight_ek392="$(query_scalar flightopsdb airline_flight_db "SELECT id FROM flights WHERE flight_number = 'EK392';")"
flight_qr971="$(query_scalar flightopsdb airline_flight_db "SELECT id FROM flights WHERE flight_number = 'QR971';")"
flight_qr970="$(query_scalar flightopsdb airline_flight_db "SELECT id FROM flights WHERE flight_number = 'QR970';")"
flight_jl752="$(query_scalar flightopsdb airline_flight_db "SELECT id FROM flights WHERE flight_number = 'JL752';")"
flight_jl751="$(query_scalar flightopsdb airline_flight_db "SELECT id FROM flights WHERE flight_number = 'JL751';")"
flight_jl753="$(query_scalar flightopsdb airline_flight_db "SELECT id FROM flights WHERE flight_number = 'JL753';")"

cabin_vn_a359_eco="$(query_scalar seatdb airline_seat_db "SELECT id FROM cabin_classes WHERE aircraft_id = $aircraft_vn_a359 AND code = 'ECO';")"
cabin_vn_a359_bus="$(query_scalar seatdb airline_seat_db "SELECT id FROM cabin_classes WHERE aircraft_id = $aircraft_vn_a359 AND code = 'BUS';")"
cabin_vn_b789_eco="$(query_scalar seatdb airline_seat_db "SELECT id FROM cabin_classes WHERE aircraft_id = $aircraft_vn_b789 AND code = 'ECO';")"
cabin_vj_a321_eco="$(query_scalar seatdb airline_seat_db "SELECT id FROM cabin_classes WHERE aircraft_id = $aircraft_vj_a321 AND code = 'ECO';")"
cabin_vj_a321_pre="$(query_scalar seatdb airline_seat_db "SELECT id FROM cabin_classes WHERE aircraft_id = $aircraft_vj_a321 AND code = 'PRE';")"
cabin_ak_a320_eco="$(query_scalar seatdb airline_seat_db "SELECT id FROM cabin_classes WHERE aircraft_id = $aircraft_ak_a320 AND code = 'ECO';")"
cabin_sq_a359_eco="$(query_scalar seatdb airline_seat_db "SELECT id FROM cabin_classes WHERE aircraft_id = $aircraft_sq_a359 AND code = 'ECO';")"
cabin_sq_a359_bus="$(query_scalar seatdb airline_seat_db "SELECT id FROM cabin_classes WHERE aircraft_id = $aircraft_sq_a359 AND code = 'BUS';")"
cabin_tg_b77w_eco="$(query_scalar seatdb airline_seat_db "SELECT id FROM cabin_classes WHERE aircraft_id = $aircraft_tg_b77w AND code = 'ECO';")"
cabin_cx_a35k_eco="$(query_scalar seatdb airline_seat_db "SELECT id FROM cabin_classes WHERE aircraft_id = $aircraft_cx_a35k AND code = 'ECO';")"
cabin_ek_a388_eco="$(query_scalar seatdb airline_seat_db "SELECT id FROM cabin_classes WHERE aircraft_id = $aircraft_ek_a388 AND code = 'ECO';")"
cabin_qr_a359_eco="$(query_scalar seatdb airline_seat_db "SELECT id FROM cabin_classes WHERE aircraft_id = $aircraft_qr_a359 AND code = 'ECO';")"
cabin_jl_b789_eco="$(query_scalar seatdb airline_seat_db "SELECT id FROM cabin_classes WHERE aircraft_id = $aircraft_jl_b789 AND code = 'ECO';")"

for required in flight_vn210 flight_vn211 flight_vn218 flight_vn136 flight_vn117 flight_vn135 \
  flight_vn651 flight_vn650 flight_vn652 flight_vj122 flight_vj123 flight_vj504 flight_vj505 \
  flight_vj803 flight_vj804 flight_ak520 flight_ak521 flight_ak512 flight_ak513 \
  flight_sq185 flight_sq186 flight_sq176 flight_sq175 flight_tg551 flight_tg550 flight_tg560 flight_tg561 \
  flight_cx764 flight_cx765 flight_cx743 flight_cx742 flight_ek393 flight_ek392 flight_qr971 flight_qr970 \
  flight_jl752 flight_jl751 flight_jl753 \
  cabin_vn_a359_eco cabin_vn_a359_bus cabin_vn_b789_eco cabin_vj_a321_eco \
  cabin_vj_a321_pre cabin_ak_a320_eco cabin_sq_a359_eco cabin_sq_a359_bus \
  cabin_tg_b77w_eco cabin_cx_a35k_eco cabin_ek_a388_eco cabin_qr_a359_eco cabin_jl_b789_eco; do
  require_value "$required" "${!required}"
done

echo "==> Resolving upcoming FlightInstance IDs for booking seat inventory"

flight_instances_vn210="$(lookup_upcoming_flight_instance_ids VN210 30)"
flight_instances_vn211="$(lookup_upcoming_flight_instance_ids VN211 30)"
flight_instances_vn218="$(lookup_upcoming_flight_instance_ids VN218 30)"
flight_instances_vn136="$(lookup_upcoming_flight_instance_ids VN136 30)"
flight_instances_vn117="$(lookup_upcoming_flight_instance_ids VN117 30)"
flight_instances_vn135="$(lookup_upcoming_flight_instance_ids VN135 30)"
flight_instances_vn651="$(lookup_upcoming_flight_instance_ids VN651 30)"
flight_instances_vn650="$(lookup_upcoming_flight_instance_ids VN650 30)"
flight_instances_vn652="$(lookup_upcoming_flight_instance_ids VN652 30)"
flight_instances_vj122="$(lookup_upcoming_flight_instance_ids VJ122 30)"
flight_instances_vj123="$(lookup_upcoming_flight_instance_ids VJ123 30)"
flight_instances_vj504="$(lookup_upcoming_flight_instance_ids VJ504 30)"
flight_instances_vj505="$(lookup_upcoming_flight_instance_ids VJ505 30)"
flight_instances_vj803="$(lookup_upcoming_flight_instance_ids VJ803 30)"
flight_instances_vj804="$(lookup_upcoming_flight_instance_ids VJ804 30)"
flight_instances_ak520="$(lookup_upcoming_flight_instance_ids AK520 30)"
flight_instances_ak521="$(lookup_upcoming_flight_instance_ids AK521 30)"
flight_instances_ak512="$(lookup_upcoming_flight_instance_ids AK512 30)"
flight_instances_ak513="$(lookup_upcoming_flight_instance_ids AK513 30)"
flight_instances_sq185="$(lookup_upcoming_flight_instance_ids SQ185 30)"
flight_instances_sq186="$(lookup_upcoming_flight_instance_ids SQ186 30)"
flight_instances_sq176="$(lookup_upcoming_flight_instance_ids SQ176 30)"
flight_instances_sq175="$(lookup_upcoming_flight_instance_ids SQ175 30)"
flight_instances_tg551="$(lookup_upcoming_flight_instance_ids TG551 30)"
flight_instances_tg550="$(lookup_upcoming_flight_instance_ids TG550 30)"
flight_instances_tg560="$(lookup_upcoming_flight_instance_ids TG560 30)"
flight_instances_tg561="$(lookup_upcoming_flight_instance_ids TG561 30)"
flight_instances_cx764="$(lookup_upcoming_flight_instance_ids CX764 30)"
flight_instances_cx765="$(lookup_upcoming_flight_instance_ids CX765 30)"
flight_instances_cx743="$(lookup_upcoming_flight_instance_ids CX743 30)"
flight_instances_cx742="$(lookup_upcoming_flight_instance_ids CX742 30)"
flight_instances_ek393="$(lookup_upcoming_flight_instance_ids EK393 30)"
flight_instances_ek392="$(lookup_upcoming_flight_instance_ids EK392 30)"
flight_instances_qr971="$(lookup_upcoming_flight_instance_ids QR971 30)"
flight_instances_qr970="$(lookup_upcoming_flight_instance_ids QR970 30)"
flight_instances_jl752="$(lookup_upcoming_flight_instance_ids JL752 30)"
flight_instances_jl751="$(lookup_upcoming_flight_instance_ids JL751 30)"
flight_instances_jl753="$(lookup_upcoming_flight_instance_ids JL753 30)"

for required in flight_instances_vn210 flight_instances_vn211 flight_instances_vn218 \
  flight_instances_vn136 flight_instances_vn117 flight_instances_vn135 flight_instances_vn651 flight_instances_vn650 flight_instances_vn652 \
  flight_instances_vj122 flight_instances_vj123 flight_instances_vj504 flight_instances_vj505 \
  flight_instances_vj803 flight_instances_vj804 flight_instances_ak520 flight_instances_ak521 flight_instances_ak512 flight_instances_ak513 \
  flight_instances_sq185 flight_instances_sq186 flight_instances_sq176 flight_instances_sq175 flight_instances_tg551 flight_instances_tg550 \
  flight_instances_tg560 flight_instances_tg561 flight_instances_cx764 flight_instances_cx765 flight_instances_cx743 flight_instances_cx742 \
  flight_instances_ek393 flight_instances_ek392 flight_instances_qr971 flight_instances_qr970 flight_instances_jl752 flight_instances_jl751 flight_instances_jl753; do
  require_value "$required" "${!required}"
done

run_sql_file_with_settings \
  seatdb \
  airline_seat_db \
  "$BOOKING_SEAT_INVENTORY_SEED_SQL" \
  flight_vn210="$flight_vn210" \
  flight_vn211="$flight_vn211" \
  flight_vn218="$flight_vn218" \
  flight_vn136="$flight_vn136" \
  flight_vn117="$flight_vn117" \
  flight_vn135="$flight_vn135" \
  flight_vn651="$flight_vn651" \
  flight_vn650="$flight_vn650" \
  flight_vn652="$flight_vn652" \
  flight_vj122="$flight_vj122" \
  flight_vj123="$flight_vj123" \
  flight_vj504="$flight_vj504" \
  flight_vj505="$flight_vj505" \
  flight_vj803="$flight_vj803" \
  flight_vj804="$flight_vj804" \
  flight_ak520="$flight_ak520" \
  flight_ak521="$flight_ak521" \
  flight_ak512="$flight_ak512" \
  flight_ak513="$flight_ak513" \
  flight_sq185="$flight_sq185" \
  flight_sq186="$flight_sq186" \
  flight_sq176="$flight_sq176" \
  flight_sq175="$flight_sq175" \
  flight_tg551="$flight_tg551" \
  flight_tg550="$flight_tg550" \
  flight_tg560="$flight_tg560" \
  flight_tg561="$flight_tg561" \
  flight_cx764="$flight_cx764" \
  flight_cx765="$flight_cx765" \
  flight_cx743="$flight_cx743" \
  flight_cx742="$flight_cx742" \
  flight_ek393="$flight_ek393" \
  flight_ek392="$flight_ek392" \
  flight_qr971="$flight_qr971" \
  flight_qr970="$flight_qr970" \
  flight_jl752="$flight_jl752" \
  flight_jl751="$flight_jl751" \
  flight_jl753="$flight_jl753" \
  flight_instances_vn210="$flight_instances_vn210" \
  flight_instances_vn211="$flight_instances_vn211" \
  flight_instances_vn218="$flight_instances_vn218" \
  flight_instances_vn136="$flight_instances_vn136" \
  flight_instances_vn117="$flight_instances_vn117" \
  flight_instances_vn135="$flight_instances_vn135" \
  flight_instances_vn651="$flight_instances_vn651" \
  flight_instances_vn650="$flight_instances_vn650" \
  flight_instances_vn652="$flight_instances_vn652" \
  flight_instances_vj122="$flight_instances_vj122" \
  flight_instances_vj123="$flight_instances_vj123" \
  flight_instances_vj504="$flight_instances_vj504" \
  flight_instances_vj505="$flight_instances_vj505" \
  flight_instances_vj803="$flight_instances_vj803" \
  flight_instances_vj804="$flight_instances_vj804" \
  flight_instances_ak520="$flight_instances_ak520" \
  flight_instances_ak521="$flight_instances_ak521" \
  flight_instances_ak512="$flight_instances_ak512" \
  flight_instances_ak513="$flight_instances_ak513" \
  flight_instances_sq185="$flight_instances_sq185" \
  flight_instances_sq186="$flight_instances_sq186" \
  flight_instances_sq176="$flight_instances_sq176" \
  flight_instances_sq175="$flight_instances_sq175" \
  flight_instances_tg551="$flight_instances_tg551" \
  flight_instances_tg550="$flight_instances_tg550" \
  flight_instances_tg560="$flight_instances_tg560" \
  flight_instances_tg561="$flight_instances_tg561" \
  flight_instances_cx764="$flight_instances_cx764" \
  flight_instances_cx765="$flight_instances_cx765" \
  flight_instances_cx743="$flight_instances_cx743" \
  flight_instances_cx742="$flight_instances_cx742" \
  flight_instances_ek393="$flight_instances_ek393" \
  flight_instances_ek392="$flight_instances_ek392" \
  flight_instances_qr971="$flight_instances_qr971" \
  flight_instances_qr970="$flight_instances_qr970" \
  flight_instances_jl752="$flight_instances_jl752" \
  flight_instances_jl751="$flight_instances_jl751" \
  flight_instances_jl753="$flight_instances_jl753" \
  cabin_vn_a359_eco="$cabin_vn_a359_eco" \
  cabin_vn_a359_bus="$cabin_vn_a359_bus" \
  cabin_vn_b789_eco="$cabin_vn_b789_eco" \
  cabin_vj_a321_eco="$cabin_vj_a321_eco" \
  cabin_vj_a321_pre="$cabin_vj_a321_pre" \
  cabin_ak_a320_eco="$cabin_ak_a320_eco" \
  cabin_sq_a359_eco="$cabin_sq_a359_eco" \
  cabin_sq_a359_bus="$cabin_sq_a359_bus" \
  cabin_tg_b77w_eco="$cabin_tg_b77w_eco" \
  cabin_cx_a35k_eco="$cabin_cx_a35k_eco" \
  cabin_ek_a388_eco="$cabin_ek_a388_eco" \
  cabin_qr_a359_eco="$cabin_qr_a359_eco" \
  cabin_jl_b789_eco="$cabin_jl_b789_eco"

run_sql_file_with_settings \
  pricingdb \
  airline_pricing_db \
  "$PRICING_SEED_SQL" \
  airline_vn="$airline_vn" \
  airline_vj="$airline_vj" \
  airline_ak="$airline_ak" \
  airline_sq="$airline_sq" \
  airline_tg="$airline_tg" \
  airline_cx="$airline_cx" \
  airline_ek="$airline_ek" \
  airline_qr="$airline_qr" \
  airline_jl="$airline_jl" \
  flight_vn210="$flight_vn210" \
  flight_vn211="$flight_vn211" \
  flight_vn218="$flight_vn218" \
  flight_vn136="$flight_vn136" \
  flight_vn117="$flight_vn117" \
  flight_vn135="$flight_vn135" \
  flight_vn651="$flight_vn651" \
  flight_vn650="$flight_vn650" \
  flight_vn652="$flight_vn652" \
  flight_vj122="$flight_vj122" \
  flight_vj123="$flight_vj123" \
  flight_vj504="$flight_vj504" \
  flight_vj505="$flight_vj505" \
  flight_vj803="$flight_vj803" \
  flight_vj804="$flight_vj804" \
  flight_ak520="$flight_ak520" \
  flight_ak521="$flight_ak521" \
  flight_ak512="$flight_ak512" \
  flight_ak513="$flight_ak513" \
  flight_sq185="$flight_sq185" \
  flight_sq186="$flight_sq186" \
  flight_sq176="$flight_sq176" \
  flight_sq175="$flight_sq175" \
  flight_tg551="$flight_tg551" \
  flight_tg550="$flight_tg550" \
  flight_tg560="$flight_tg560" \
  flight_tg561="$flight_tg561" \
  flight_cx764="$flight_cx764" \
  flight_cx765="$flight_cx765" \
  flight_cx743="$flight_cx743" \
  flight_cx742="$flight_cx742" \
  flight_ek393="$flight_ek393" \
  flight_ek392="$flight_ek392" \
  flight_qr971="$flight_qr971" \
  flight_qr970="$flight_qr970" \
  flight_jl752="$flight_jl752" \
  flight_jl751="$flight_jl751" \
  flight_jl753="$flight_jl753" \
  cabin_vn_a359_eco="$cabin_vn_a359_eco" \
  cabin_vn_a359_bus="$cabin_vn_a359_bus" \
  cabin_vn_b789_eco="$cabin_vn_b789_eco" \
  cabin_vj_a321_eco="$cabin_vj_a321_eco" \
  cabin_vj_a321_pre="$cabin_vj_a321_pre" \
  cabin_ak_a320_eco="$cabin_ak_a320_eco" \
  cabin_sq_a359_eco="$cabin_sq_a359_eco" \
  cabin_sq_a359_bus="$cabin_sq_a359_bus" \
  cabin_tg_b77w_eco="$cabin_tg_b77w_eco" \
  cabin_cx_a35k_eco="$cabin_cx_a35k_eco" \
  cabin_ek_a388_eco="$cabin_ek_a388_eco" \
  cabin_qr_a359_eco="$cabin_qr_a359_eco" \
  cabin_jl_b789_eco="$cabin_jl_b789_eco"

echo "==> Resolving Fare IDs for super-admin analytics"

fare_vn210_lite="$(lookup_fare_id "$flight_vn210" "Economy Lite")"
fare_vn210_flex="$(lookup_fare_id "$flight_vn210" "Economy Flex")"
fare_vn210_business="$(lookup_fare_id "$flight_vn210" "Business Flex")"
fare_vn211_standard="$(lookup_fare_id "$flight_vn211" "Economy Standard")"
fare_vn218_saver="$(lookup_fare_id "$flight_vn218" "Economy Saver")"
fare_vn136_basic="$(lookup_fare_id "$flight_vn136" "Economy Basic")"
fare_vn135_basic="$(lookup_fare_id "$flight_vn135" "Economy Basic")"
fare_vn651_standard="$(lookup_fare_id "$flight_vn651" "Economy Standard")"
fare_vj122_saver="$(lookup_fare_id "$flight_vj122" "Eco Saver")"
fare_vj122_skyboss="$(lookup_fare_id "$flight_vj122" "SkyBoss")"
fare_vj123_plus="$(lookup_fare_id "$flight_vj123" "Eco Plus")"
fare_vj803_asia="$(lookup_fare_id "$flight_vj803" "Eco Asia")"
fare_vj804_asia="$(lookup_fare_id "$flight_vj804" "Eco Asia")"
fare_ak520_low="$(lookup_fare_id "$flight_ak520" "Low Fare")"
fare_ak521_low="$(lookup_fare_id "$flight_ak521" "Low Fare")"
fare_sq185_value="$(lookup_fare_id "$flight_sq185" "Economy Value")"
fare_sq185_business="$(lookup_fare_id "$flight_sq185" "Business Advantage")"
fare_sq186_value="$(lookup_fare_id "$flight_sq186" "Economy Value")"
fare_tg551_classic="$(lookup_fare_id "$flight_tg551" "Economy Classic")"
fare_tg550_classic="$(lookup_fare_id "$flight_tg550" "Economy Classic")"
fare_cx764_essential="$(lookup_fare_id "$flight_cx764" "Economy Essential")"
fare_cx765_essential="$(lookup_fare_id "$flight_cx765" "Economy Essential")"
fare_ek393_saver="$(lookup_fare_id "$flight_ek393" "Economy Saver")"
fare_ek392_saver="$(lookup_fare_id "$flight_ek392" "Economy Saver")"
fare_qr971_classic="$(lookup_fare_id "$flight_qr971" "Economy Classic")"
fare_qr970_classic="$(lookup_fare_id "$flight_qr970" "Economy Classic")"
fare_jl752_standard="$(lookup_fare_id "$flight_jl752" "Economy Standard")"
fare_jl751_standard="$(lookup_fare_id "$flight_jl751" "Economy Standard")"
fare_jl753_standard="$(lookup_fare_id "$flight_jl753" "Economy Standard")"

for required in fare_vn210_lite fare_vn210_flex fare_vn210_business fare_vn211_standard \
  fare_vn218_saver fare_vn136_basic fare_vn135_basic fare_vn651_standard fare_vj122_saver fare_vj122_skyboss \
  fare_vj123_plus fare_vj803_asia fare_vj804_asia fare_ak520_low fare_ak521_low \
  fare_sq185_value fare_sq185_business fare_sq186_value fare_tg551_classic fare_tg550_classic \
  fare_cx764_essential fare_cx765_essential fare_ek393_saver fare_ek392_saver \
  fare_qr971_classic fare_qr970_classic fare_jl752_standard fare_jl751_standard \
  fare_jl753_standard; do
  require_value "$required" "${!required}"
done

run_sql_file ancillarydb airline_ancillary_db "$ANCILLARY_MIGRATION_SQL"

run_sql_file bookingdb airline_booking_db "$BOOKING_MIGRATION_SQL"

run_sql_file_with_settings \
  bookingdb \
  airline_booking_db \
  "$SUPER_ADMIN_ANALYTICS_SEED_SQL" \
  customer_minhanh="$customer_minhanh" \
  customer_quocbao="$customer_quocbao" \
  customer_hoangphuc="$customer_hoangphuc" \
  customer_giahan="$customer_giahan" \
  customer_thanhdat="$customer_thanhdat" \
  customer_ngoclinh="$customer_ngoclinh" \
  customer_tuankiet="$customer_tuankiet" \
  customer_phuongthao="$customer_phuongthao" \
  customer_duchuy="$customer_duchuy" \
  customer_khanhvy="$customer_khanhvy" \
  customer_giabao="$customer_giabao" \
  customer_minhthu="$customer_minhthu" \
  customer_baochau="$customer_baochau" \
  customer_anhtuan="$customer_anhtuan" \
  customer_myduyen="$customer_myduyen" \
  airline_vn="$airline_vn" \
  airline_vj="$airline_vj" \
  airline_ak="$airline_ak" \
  airline_sq="$airline_sq" \
  airline_tg="$airline_tg" \
  airline_cx="$airline_cx" \
  airline_ek="$airline_ek" \
  airline_qr="$airline_qr" \
  airline_jl="$airline_jl" \
  flight_vn210="$flight_vn210" \
  flight_vn211="$flight_vn211" \
  flight_vn218="$flight_vn218" \
  flight_vn136="$flight_vn136" \
  flight_vn135="$flight_vn135" \
  flight_vn651="$flight_vn651" \
  flight_vj122="$flight_vj122" \
  flight_vj123="$flight_vj123" \
  flight_vj803="$flight_vj803" \
  flight_vj804="$flight_vj804" \
  flight_ak520="$flight_ak520" \
  flight_ak521="$flight_ak521" \
  flight_sq185="$flight_sq185" \
  flight_sq186="$flight_sq186" \
  flight_tg551="$flight_tg551" \
  flight_tg550="$flight_tg550" \
  flight_cx764="$flight_cx764" \
  flight_cx765="$flight_cx765" \
  flight_ek393="$flight_ek393" \
  flight_ek392="$flight_ek392" \
  flight_qr971="$flight_qr971" \
  flight_qr970="$flight_qr970" \
  flight_jl752="$flight_jl752" \
  flight_jl751="$flight_jl751" \
  flight_jl753="$flight_jl753" \
  flight_instances_vn210="$flight_instances_vn210" \
  flight_instances_vn211="$flight_instances_vn211" \
  flight_instances_vn218="$flight_instances_vn218" \
  flight_instances_vn136="$flight_instances_vn136" \
  flight_instances_vn135="$flight_instances_vn135" \
  flight_instances_vn651="$flight_instances_vn651" \
  flight_instances_vj122="$flight_instances_vj122" \
  flight_instances_vj123="$flight_instances_vj123" \
  flight_instances_vj803="$flight_instances_vj803" \
  flight_instances_vj804="$flight_instances_vj804" \
  flight_instances_ak520="$flight_instances_ak520" \
  flight_instances_ak521="$flight_instances_ak521" \
  flight_instances_sq185="$flight_instances_sq185" \
  flight_instances_sq186="$flight_instances_sq186" \
  flight_instances_tg551="$flight_instances_tg551" \
  flight_instances_tg550="$flight_instances_tg550" \
  flight_instances_cx764="$flight_instances_cx764" \
  flight_instances_cx765="$flight_instances_cx765" \
  flight_instances_ek393="$flight_instances_ek393" \
  flight_instances_ek392="$flight_instances_ek392" \
  flight_instances_qr971="$flight_instances_qr971" \
  flight_instances_qr970="$flight_instances_qr970" \
  flight_instances_jl752="$flight_instances_jl752" \
  flight_instances_jl751="$flight_instances_jl751" \
  flight_instances_jl753="$flight_instances_jl753" \
  fare_vn210_lite="$fare_vn210_lite" \
  fare_vn210_flex="$fare_vn210_flex" \
  fare_vn210_business="$fare_vn210_business" \
  fare_vn211_standard="$fare_vn211_standard" \
  fare_vn218_saver="$fare_vn218_saver" \
  fare_vn136_basic="$fare_vn136_basic" \
  fare_vn135_basic="$fare_vn135_basic" \
  fare_vn651_standard="$fare_vn651_standard" \
  fare_vj122_saver="$fare_vj122_saver" \
  fare_vj122_skyboss="$fare_vj122_skyboss" \
  fare_vj123_plus="$fare_vj123_plus" \
  fare_vj803_asia="$fare_vj803_asia" \
  fare_vj804_asia="$fare_vj804_asia" \
  fare_ak520_low="$fare_ak520_low" \
  fare_ak521_low="$fare_ak521_low" \
  fare_sq185_value="$fare_sq185_value" \
  fare_sq185_business="$fare_sq185_business" \
  fare_sq186_value="$fare_sq186_value" \
  fare_tg551_classic="$fare_tg551_classic" \
  fare_tg550_classic="$fare_tg550_classic" \
  fare_cx764_essential="$fare_cx764_essential" \
  fare_cx765_essential="$fare_cx765_essential" \
  fare_ek393_saver="$fare_ek393_saver" \
  fare_ek392_saver="$fare_ek392_saver" \
  fare_qr971_classic="$fare_qr971_classic" \
  fare_qr970_classic="$fare_qr970_classic" \
  fare_jl752_standard="$fare_jl752_standard" \
  fare_jl751_standard="$fare_jl751_standard" \
  fare_jl753_standard="$fare_jl753_standard"

run_sql_file paymentdb airline_payment_db "$PAYMENT_MIGRATION_SQL"

run_sql_file_with_settings \
  ancillarydb \
  airline_ancillary_db \
  "$ANCILLARY_SEED_SQL" \
  airline_vn="$airline_vn" \
  airline_vj="$airline_vj" \
  airline_sq="$airline_sq" \
  flight_vn210="$flight_vn210" \
  flight_vn211="$flight_vn211" \
  flight_vj122="$flight_vj122" \
  flight_sq185="$flight_sq185" \
  cabin_vn_a359_eco="$cabin_vn_a359_eco" \
  cabin_vn_a359_bus="$cabin_vn_a359_bus" \
  cabin_vn_b789_eco="$cabin_vn_b789_eco" \
  cabin_vj_a321_eco="$cabin_vj_a321_eco" \
  cabin_vj_a321_pre="$cabin_vj_a321_pre" \
  cabin_sq_a359_eco="$cabin_sq_a359_eco" \
  cabin_sq_a359_bus="$cabin_sq_a359_bus"

run_sql_file notificationdb airline_notification_db "$NOTIFICATION_SEED_SQL"

echo
echo "Seed complete."
echo "Default seeded password for local users: Password@123"
echo "Admin login: admin@flighthub.local"
