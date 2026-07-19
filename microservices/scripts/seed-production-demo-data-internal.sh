#!/usr/bin/env sh
set -eu

# Runs inside the Docker Compose network. The postgres image already includes psql.

SQL_DIR="${SQL_DIR:-/seed-sql}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-12345678}"
SEED_BASE_DATA="${SEED_BASE_DATA:-true}"
SEED_SEAT="${SEED_SEAT:-true}"
SEED_FLIGHT_OPS="${SEED_FLIGHT_OPS:-true}"
SEED_PRICING="${SEED_PRICING:-true}"
SEED_ANCILLARY="${SEED_ANCILLARY:-true}"

USER_SEED_SQL="$SQL_DIR/2026-06-03-seed-production-users.sql"
CITY_SEED_SQL="$SQL_DIR/2026-06-03-seed-production-cities.sql"
AIRPORT_SEED_SQL="$SQL_DIR/2026-06-03-seed-production-airports.sql"
AIRLINE_CORE_MIGRATION_SQL="$SQL_DIR/2026-07-02-migrate-airline-status-pending.sql"
AIRLINE_CORE_SEED_SQL="$SQL_DIR/2026-06-05-seed-production-airline-core.sql"
SEAT_SEED_SQL="$SQL_DIR/2026-06-08-seed-production-seat-service.sql"
FLIGHT_OPS_SEED_SQL="$SQL_DIR/2026-06-07-seed-production-flight-ops.sql"
PRICING_SEED_SQL="$SQL_DIR/2026-06-20-seed-production-pricing-service.sql"
BOOKING_MIGRATION_SQL="$SQL_DIR/2026-06-20-migrate-booking-checkout-integrity.sql"
PAYMENT_MIGRATION_SQL="$SQL_DIR/2026-06-20-migrate-payment-idempotency.sql"
ANCILLARY_MIGRATION_SQL="$SQL_DIR/2026-06-20-migrate-ancillary-commercial-integrity.sql"
ANCILLARY_SEED_SQL="$SQL_DIR/2026-06-20-seed-production-ancillary-service.sql"

for file in "$USER_SEED_SQL" "$CITY_SEED_SQL" "$AIRPORT_SEED_SQL" "$AIRLINE_CORE_MIGRATION_SQL" "$AIRLINE_CORE_SEED_SQL" \
  "$SEAT_SEED_SQL" "$FLIGHT_OPS_SEED_SQL" "$PRICING_SEED_SQL" \
  "$BOOKING_MIGRATION_SQL" "$PAYMENT_MIGRATION_SQL" "$ANCILLARY_MIGRATION_SQL" "$ANCILLARY_SEED_SQL"; do
  if [ ! -f "$file" ]; then
    echo "Required SQL seed file not found: $file" >&2
    exit 1
  fi
done

psql_exec() {
  host="$1"
  database="$2"
  shift 2

  database_url="$(database_url_for "$database")"

  if [ -n "$database_url" ]; then
    # psql accepts postgresql:// URLs; service env uses jdbc:postgresql://.
    psql_url="$(normalize_psql_url "${database_url#jdbc:}")"
    PGPASSWORD="$POSTGRES_PASSWORD" psql -U "$POSTGRES_USER" "$psql_url" "$@"
  else
    PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$host" -p 5432 -U "$POSTGRES_USER" -d "$database" "$@"
  fi
}

database_url_for() {
  case "$1" in
    airline_user) printf "%s" "${USER_DATABASE_URL:-}" ;;
    airline_core_db) printf "%s" "${AIRLINE_CORE_DATABASE_URL:-}" ;;
    airline_flight_db) printf "%s" "${FLIGHT_OPS_DATABASE_URL:-}" ;;
    airline_location_db) printf "%s" "${LOCATION_DATABASE_URL:-}" ;;
    airline_seat_db) printf "%s" "${SEAT_DATABASE_URL:-}" ;;
    airline_pricing_db) printf "%s" "${PRICING_DATABASE_URL:-}" ;;
    airline_ancillary_db) printf "%s" "${ANCILLARY_DATABASE_URL:-}" ;;
    airline_booking_db) printf "%s" "${BOOKING_DATABASE_URL:-}" ;;
    airline_payment_db) printf "%s" "${PAYMENT_DATABASE_URL:-}" ;;
    media_service_db) printf "%s" "${MEDIA_DATABASE_URL:-}" ;;
    airline_notification_db) printf "%s" "${NOTIFICATION_DATABASE_URL:-}" ;;
    *) printf "" ;;
  esac
}

normalize_psql_url() {
  # JDBC uses channelBinding, while libpq/psql expects channel_binding.
  # Keeping the conversion here lets services use JDBC URLs unchanged.
  printf "%s" "$1" | sed 's/channelBinding=/channel_binding=/g'
}

run_sql_file() {
  host="$1"
  database="$2"
  file="$3"

  echo "==> Seeding $database with $(basename "$file")"
  psql_exec "$host" "$database" -v ON_ERROR_STOP=1 < "$file"
}

query_scalar() {
  host="$1"
  database="$2"
  sql="$3"
  attempt=1

  while [ "$attempt" -le 3 ]; do
    if query_output="$(psql_exec "$host" "$database" -At -v ON_ERROR_STOP=1 -c "$sql")"; then
      printf "%s" "$query_output" | tr -d '[:space:]'
      return 0
    fi

    echo "Lookup failed for $database on attempt $attempt; retrying..." >&2
    attempt=$((attempt + 1))
    sleep 2
  done

  echo "Lookup failed for $database after 3 attempts: $sql" >&2
  return 1
}

require_value() {
  name="$1"
  value="$2"

  if [ -z "$value" ]; then
    echo "Required seed lookup failed: $name" >&2
    exit 1
  fi
}

set_seed_setting() {
  name="$1"
  value="$2"

  printf "SET flighthub_seed.%s = '%s';\n" "$name" "$value"
}

echo "FlightHub Docker production-style demo data init"
echo "Seed base data: $SEED_BASE_DATA"
echo "Seed seat service: $SEED_SEAT"
echo "Seed flight ops: $SEED_FLIGHT_OPS"
echo "Seed pricing service: $SEED_PRICING"
echo "Seed ancillary service: $SEED_ANCILLARY"
echo

if [ "$SEED_BASE_DATA" = "true" ]; then
  run_sql_file userdb airline_user "$USER_SEED_SQL"
  run_sql_file locationdb airline_location_db "$CITY_SEED_SQL"
  run_sql_file locationdb airline_location_db "$AIRPORT_SEED_SQL"
fi

run_sql_file airlinecoredb airline_core_db "$AIRLINE_CORE_MIGRATION_SQL"

echo "==> Resolving cross-service IDs"

owner_vietnam="$(query_scalar userdb airline_user "SELECT id FROM users WHERE email = 'owner.vietnamairlines@flighthub.local';")"
owner_vietjet="$(query_scalar userdb airline_user "SELECT id FROM users WHERE email = 'owner.vietjet@flighthub.local';")"
owner_bamboo="$(query_scalar userdb airline_user "SELECT id FROM users WHERE email = 'owner.bamboo@flighthub.local';")"
owner_singapore="$(query_scalar userdb airline_user "SELECT id FROM users WHERE email = 'owner.singaporeair@flighthub.local';")"
owner_thai="$(query_scalar userdb airline_user "SELECT id FROM users WHERE email = 'owner.thaiairways@flighthub.local';")"
owner_airasia="$(query_scalar userdb airline_user "SELECT id FROM users WHERE email = 'owner.airasia@flighthub.local';")"
owner_cathay="$(query_scalar userdb airline_user "SELECT id FROM users WHERE email = 'owner.cathay@flighthub.local';")"
owner_jal="$(query_scalar userdb airline_user "SELECT id FROM users WHERE email = 'owner.jal@flighthub.local';")"
owner_emirates="$(query_scalar userdb airline_user "SELECT id FROM users WHERE email = 'owner.emirates@flighthub.local';")"
owner_qatar="$(query_scalar userdb airline_user "SELECT id FROM users WHERE email = 'owner.qatarairways@flighthub.local';")"

city_sgn="$(query_scalar locationdb airline_location_db "SELECT id FROM cities WHERE city_code = 'SGN';")"
city_han="$(query_scalar locationdb airline_location_db "SELECT id FROM cities WHERE city_code = 'HAN';")"
city_sin="$(query_scalar locationdb airline_location_db "SELECT id FROM cities WHERE city_code = 'SIN';")"
city_bkk="$(query_scalar locationdb airline_location_db "SELECT id FROM cities WHERE city_code = 'BKK';")"
city_kul="$(query_scalar locationdb airline_location_db "SELECT id FROM cities WHERE city_code = 'KUL';")"
city_hkg="$(query_scalar locationdb airline_location_db "SELECT id FROM cities WHERE city_code = 'HKG';")"
city_tyo="$(query_scalar locationdb airline_location_db "SELECT id FROM cities WHERE city_code = 'TYO';")"
city_dxb="$(query_scalar locationdb airline_location_db "SELECT id FROM cities WHERE city_code = 'DXB';")"
city_doh="$(query_scalar locationdb airline_location_db "SELECT id FROM cities WHERE city_code = 'DOH';")"

apt_sgn="$(query_scalar locationdb airline_location_db "SELECT id FROM airports WHERE iata_code = 'SGN';")"
apt_han="$(query_scalar locationdb airline_location_db "SELECT id FROM airports WHERE iata_code = 'HAN';")"
apt_dad="$(query_scalar locationdb airline_location_db "SELECT id FROM airports WHERE iata_code = 'DAD';")"
apt_sin="$(query_scalar locationdb airline_location_db "SELECT id FROM airports WHERE iata_code = 'SIN';")"
apt_bkk="$(query_scalar locationdb airline_location_db "SELECT id FROM airports WHERE iata_code = 'BKK';")"
apt_kul="$(query_scalar locationdb airline_location_db "SELECT id FROM airports WHERE iata_code = 'KUL';")"
apt_hkg="$(query_scalar locationdb airline_location_db "SELECT id FROM airports WHERE iata_code = 'HKG';")"
apt_hnd="$(query_scalar locationdb airline_location_db "SELECT id FROM airports WHERE iata_code = 'HND';")"
apt_dxb="$(query_scalar locationdb airline_location_db "SELECT id FROM airports WHERE iata_code = 'DXB';")"
apt_doh="$(query_scalar locationdb airline_location_db "SELECT id FROM airports WHERE iata_code = 'DOH';")"

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

echo "==> Seeding airline_core_db with $(basename "$AIRLINE_CORE_SEED_SQL")"
{
  set_seed_setting owner_vietnam "$owner_vietnam"
  set_seed_setting owner_vietjet "$owner_vietjet"
  set_seed_setting owner_bamboo "$owner_bamboo"
  set_seed_setting owner_singapore "$owner_singapore"
  set_seed_setting owner_thai "$owner_thai"
  set_seed_setting owner_airasia "$owner_airasia"
  set_seed_setting owner_cathay "$owner_cathay"
  set_seed_setting owner_jal "$owner_jal"
  set_seed_setting owner_emirates "$owner_emirates"
  set_seed_setting owner_qatar "$owner_qatar"
  set_seed_setting city_sgn "$city_sgn"
  set_seed_setting city_han "$city_han"
  set_seed_setting city_sin "$city_sin"
  set_seed_setting city_bkk "$city_bkk"
  set_seed_setting city_kul "$city_kul"
  set_seed_setting city_hkg "$city_hkg"
  set_seed_setting city_tyo "$city_tyo"
  set_seed_setting city_dxb "$city_dxb"
  set_seed_setting city_doh "$city_doh"
  set_seed_setting apt_sgn "$apt_sgn"
  set_seed_setting apt_han "$apt_han"
  set_seed_setting apt_dad "$apt_dad"
  set_seed_setting apt_sin "$apt_sin"
  set_seed_setting apt_bkk "$apt_bkk"
  set_seed_setting apt_kul "$apt_kul"
  set_seed_setting apt_hkg "$apt_hkg"
  set_seed_setting apt_hnd "$apt_hnd"
  set_seed_setting apt_dxb "$apt_dxb"
  set_seed_setting apt_doh "$apt_doh"
  printf "\n"
  cat "$AIRLINE_CORE_SEED_SQL"
} | psql_exec airlinecoredb airline_core_db -v ON_ERROR_STOP=1

if [ "$SEED_SEAT" = "true" ] || [ "$SEED_FLIGHT_OPS" = "true" ] || [ "$SEED_PRICING" = "true" ] || [ "$SEED_ANCILLARY" = "true" ]; then
  echo "==> Resolving airline-core IDs for operational seeds"

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
    eval "required_value=\${$required}"
    require_value "$required" "$required_value"
  done

  if [ "$SEED_SEAT" = "true" ]; then
    echo "==> Seeding airline_seat_db with $(basename "$SEAT_SEED_SQL")"
    {
      for name in airline_vn airline_vj airline_ak airline_sq airline_tg airline_cx airline_jl airline_ek airline_qr \
        aircraft_vn_a359 aircraft_vn_b789 aircraft_vj_a321 aircraft_ak_a320 aircraft_sq_a359 aircraft_tg_b77w \
        aircraft_cx_a35k aircraft_jl_b789 aircraft_ek_a388 aircraft_qr_a359; do
        eval "seed_value=\${$name}"
        set_seed_setting "$name" "$seed_value"
      done
      printf "\n"
      cat "$SEAT_SEED_SQL"
    } | psql_exec seatdb airline_seat_db -v ON_ERROR_STOP=1
  fi

  if [ "$SEED_FLIGHT_OPS" = "true" ]; then
    echo "==> Seeding airline_flight_db with $(basename "$FLIGHT_OPS_SEED_SQL")"
    {
      for name in airline_vn airline_vj airline_ak airline_sq airline_tg airline_cx airline_jl airline_ek airline_qr \
        aircraft_vn_a359 aircraft_vn_b789 aircraft_vj_a321 aircraft_ak_a320 aircraft_sq_a359 aircraft_tg_b77w \
        aircraft_cx_a35k aircraft_jl_b789 aircraft_ek_a388 aircraft_qr_a359 \
        apt_sgn apt_han apt_dad apt_sin apt_kul apt_bkk apt_hkg apt_hnd apt_dxb apt_doh; do
        eval "seed_value=\${$name}"
        set_seed_setting "$name" "$seed_value"
      done
      printf "\n"
      cat "$FLIGHT_OPS_SEED_SQL"
    } | psql_exec flightopsdb airline_flight_db -v ON_ERROR_STOP=1
  fi

  if [ "$SEED_PRICING" = "true" ] || [ "$SEED_ANCILLARY" = "true" ]; then
    echo "==> Resolving Flight and Cabin Class IDs for commercial services"

    commercial_flights="flight_vn210 flight_vn211 flight_vn218 flight_vn136 flight_vn135 flight_vn117 flight_vn651 flight_vn650 flight_vn652 \
      flight_vj122 flight_vj123 flight_vj504 flight_vj505 flight_vj803 flight_vj804 \
      flight_ak520 flight_ak521 flight_ak512 flight_ak513 \
      flight_sq185 flight_sq186 flight_sq176 flight_sq175 \
      flight_tg551 flight_tg550 flight_tg560 flight_tg561 \
      flight_cx764 flight_cx765 flight_cx743 flight_cx742 \
      flight_ek393 flight_ek392 flight_qr971 flight_qr970 flight_jl752 flight_jl751 flight_jl753"

    for name in $commercial_flights; do
      flight_number="$(printf "%s" "${name#flight_}" | tr '[:lower:]' '[:upper:]')"
      flight_id="$(query_scalar flightopsdb airline_flight_db "SELECT id FROM flights WHERE flight_number = '$flight_number';")"
      eval "$name=\$flight_id"
    done

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

    for required in $commercial_flights \
      cabin_vn_a359_eco cabin_vn_a359_bus cabin_vn_b789_eco cabin_vj_a321_eco \
      cabin_vj_a321_pre cabin_ak_a320_eco cabin_sq_a359_eco cabin_sq_a359_bus \
      cabin_tg_b77w_eco cabin_cx_a35k_eco cabin_ek_a388_eco cabin_qr_a359_eco cabin_jl_b789_eco; do
      eval "required_value=\${$required}"
      require_value "$required" "$required_value"
    done

    if [ "$SEED_PRICING" = "true" ]; then
      echo "==> Seeding airline_pricing_db with $(basename "$PRICING_SEED_SQL")"
      {
        for name in airline_vn airline_vj airline_ak airline_sq airline_tg airline_cx airline_jl airline_ek airline_qr \
          $commercial_flights \
          cabin_vn_a359_eco cabin_vn_a359_bus cabin_vn_b789_eco cabin_vj_a321_eco \
          cabin_vj_a321_pre cabin_ak_a320_eco cabin_sq_a359_eco cabin_sq_a359_bus \
          cabin_tg_b77w_eco cabin_cx_a35k_eco cabin_ek_a388_eco cabin_qr_a359_eco cabin_jl_b789_eco; do
          eval "seed_value=\${$name}"
          set_seed_setting "$name" "$seed_value"
        done
        printf "\n"
        cat "$PRICING_SEED_SQL"
      } | psql_exec pricingdb airline_pricing_db -v ON_ERROR_STOP=1
    fi

    if [ "$SEED_ANCILLARY" = "true" ]; then
      run_sql_file bookingdb airline_booking_db "$BOOKING_MIGRATION_SQL"
      run_sql_file paymentdb airline_payment_db "$PAYMENT_MIGRATION_SQL"
      run_sql_file ancillarydb airline_ancillary_db "$ANCILLARY_MIGRATION_SQL"
      echo "==> Seeding airline_ancillary_db with $(basename "$ANCILLARY_SEED_SQL")"
      {
        for name in airline_vn airline_vj airline_sq flight_vn210 flight_vn211 flight_vj122 flight_sq185 \
          cabin_vn_a359_eco cabin_vn_a359_bus cabin_vn_b789_eco cabin_vj_a321_eco \
          cabin_vj_a321_pre cabin_sq_a359_eco cabin_sq_a359_bus; do
          eval "seed_value=\${$name}"
          set_seed_setting "$name" "$seed_value"
        done
        printf "\n"
        cat "$ANCILLARY_SEED_SQL"
      } | psql_exec ancillarydb airline_ancillary_db -v ON_ERROR_STOP=1
    fi
  fi
fi

echo
echo "Seed complete."
echo "Default seeded password for local users: Password@123"
echo "Admin login: admin@flighthub.local"
