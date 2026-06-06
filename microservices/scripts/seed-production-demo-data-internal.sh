#!/usr/bin/env sh
set -eu

# Runs inside the Docker Compose network. The postgres image already includes psql.

SQL_DIR="${SQL_DIR:-/seed-sql}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-12345678}"
SEED_BASE_DATA="${SEED_BASE_DATA:-true}"

USER_SEED_SQL="$SQL_DIR/2026-06-03-seed-production-users.sql"
CITY_SEED_SQL="$SQL_DIR/2026-06-03-seed-production-cities.sql"
AIRPORT_SEED_SQL="$SQL_DIR/2026-06-03-seed-production-airports.sql"
AIRLINE_CORE_SEED_SQL="$SQL_DIR/2026-06-05-seed-production-airline-core.sql"

for file in "$USER_SEED_SQL" "$CITY_SEED_SQL" "$AIRPORT_SEED_SQL" "$AIRLINE_CORE_SEED_SQL"; do
  if [ ! -f "$file" ]; then
    echo "Required SQL seed file not found: $file" >&2
    exit 1
  fi
done

psql_exec() {
  host="$1"
  database="$2"
  shift 2

  PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$host" -p 5432 -U "$POSTGRES_USER" -d "$database" "$@"
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

  psql_exec "$host" "$database" -At -v ON_ERROR_STOP=1 -c "$sql" | tr -d '[:space:]'
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
echo

if [ "$SEED_BASE_DATA" = "true" ]; then
  run_sql_file userdb airline_user "$USER_SEED_SQL"
  run_sql_file locationdb airline_location_db "$CITY_SEED_SQL"
  run_sql_file locationdb airline_location_db "$AIRPORT_SEED_SQL"
fi

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

echo
echo "Seed complete."
echo "Default seeded password for local users: Password@123"
echo "Admin login: admin@flighthub.local"
