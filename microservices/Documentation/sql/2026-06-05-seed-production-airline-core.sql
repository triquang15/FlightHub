-- Production-style airline-core seed data.
-- Safe to re-run: airlines use iata_code conflict handling, aircraft use aircraft_code conflict handling.
--
-- This script expects session settings supplied by scripts/init-production-demo-data.sh:
--   flighthub_seed.owner_* values are user-service users.id values.
--   flighthub_seed.city_* values are location-service cities.id values.
--   flighthub_seed.apt_* values are location-service airports.id values.
-- Run it through scripts/init-production-demo-data.sh, not directly from a SQL editor.

DO $$
BEGIN
    IF current_setting('flighthub_seed.owner_vietnam', true) IS NULL THEN
        RAISE EXCEPTION 'Missing seed context. Run this file through scripts/init-production-demo-data.sh so cross-service IDs are resolved first.';
    END IF;
END $$;

BEGIN;

WITH airline_seed (
    iata_code,
    icao_code,
    name,
    alias,
    logo_url,
    website,
    status,
    alliance,
    support_email,
    support_phone,
    support_hours,
    headquarters_city_id,
    owner_id
) AS (
    VALUES
        ('VN', 'HVN', 'Vietnam Airlines', 'Vietnam Airlines', 'https://cdn.flighthub.local/airlines/vn.png', 'https://www.vietnamairlines.com', 'ACTIVE', 'SkyTeam', 'support@vietnamairlines.flighthub.local', '+842438320320', '24/7 operations desk', current_setting('flighthub_seed.city_sgn', true)::bigint, current_setting('flighthub_seed.owner_vietnam', true)::bigint),
        ('VJ', 'VJC', 'Vietjet Air', 'Vietjet', 'https://cdn.flighthub.local/airlines/vj.png', 'https://www.vietjetair.com', 'ACTIVE', 'Unaligned', 'support@vietjet.flighthub.local', '+842871063668', '06:00-23:00 ICT', current_setting('flighthub_seed.city_sgn', true)::bigint, current_setting('flighthub_seed.owner_vietjet', true)::bigint),
        ('QH', 'BAV', 'Bamboo Airways', 'Bamboo', 'https://cdn.flighthub.local/airlines/qh.png', 'https://www.bambooairways.com', 'INACTIVE', 'Unaligned', 'support@bamboo.flighthub.local', '+842432333233', '08:00-22:00 ICT', current_setting('flighthub_seed.city_han', true)::bigint, current_setting('flighthub_seed.owner_bamboo', true)::bigint),
        ('SQ', 'SIA', 'Singapore Airlines', 'Singapore Airlines', 'https://cdn.flighthub.local/airlines/sq.png', 'https://www.singaporeair.com', 'ACTIVE', 'Star Alliance', 'support@singaporeair.flighthub.local', '+6562238888', '24/7 global desk', current_setting('flighthub_seed.city_sin', true)::bigint, current_setting('flighthub_seed.owner_singapore', true)::bigint),
        ('TG', 'THA', 'Thai Airways', 'Thai Airways', 'https://cdn.flighthub.local/airlines/tg.png', 'https://www.thaiairways.com', 'ACTIVE', 'Star Alliance', 'support@thaiairways.flighthub.local', '+6623561111', '24/7 operations desk', current_setting('flighthub_seed.city_bkk', true)::bigint, current_setting('flighthub_seed.owner_thai', true)::bigint),
        ('AK', 'AXM', 'AirAsia', 'AirAsia', 'https://cdn.flighthub.local/airlines/ak.png', 'https://www.airasia.com', 'ACTIVE', 'Unaligned', 'support@airasia.flighthub.local', '+60386600000', '06:00-23:00 MYT', current_setting('flighthub_seed.city_kul', true)::bigint, current_setting('flighthub_seed.owner_airasia', true)::bigint),
        ('CX', 'CPA', 'Cathay Pacific', 'Cathay Pacific', 'https://cdn.flighthub.local/airlines/cx.png', 'https://www.cathaypacific.com', 'ACTIVE', 'Oneworld', 'support@cathay.flighthub.local', '+85227473333', '24/7 global desk', current_setting('flighthub_seed.city_hkg', true)::bigint, current_setting('flighthub_seed.owner_cathay', true)::bigint),
        ('JL', 'JAL', 'Japan Airlines', 'JAL', 'https://cdn.flighthub.local/airlines/jl.png', 'https://www.jal.co.jp', 'ACTIVE', 'Oneworld', 'support@jal.flighthub.local', '+81354603100', '24/7 operations desk', current_setting('flighthub_seed.city_tyo', true)::bigint, current_setting('flighthub_seed.owner_jal', true)::bigint),
        ('EK', 'UAE', 'Emirates', 'Emirates', 'https://cdn.flighthub.local/airlines/ek.png', 'https://www.emirates.com', 'ACTIVE', 'Unaligned', 'support@emirates.flighthub.local', '+971600555555', '24/7 global desk', current_setting('flighthub_seed.city_dxb', true)::bigint, current_setting('flighthub_seed.owner_emirates', true)::bigint),
        ('QR', 'QTR', 'Qatar Airways', 'Qatar Airways', 'https://cdn.flighthub.local/airlines/qr.png', 'https://www.qatarairways.com', 'ACTIVE', 'Oneworld', 'support@qatarairways.flighthub.local', '+97440230000', '24/7 global desk', current_setting('flighthub_seed.city_doh', true)::bigint, current_setting('flighthub_seed.owner_qatar', true)::bigint)
)
INSERT INTO airlines (
    iata_code,
    icao_code,
    name,
    alias,
    logo_url,
    website,
    status,
    alliance,
    email,
    phone,
    hours,
    headquarters_city_id,
    owner_id,
    created_at,
    updated_at
)
SELECT
    iata_code,
    icao_code,
    name,
    alias,
    logo_url,
    website,
    status,
    alliance,
    support_email,
    support_phone,
    support_hours,
    headquarters_city_id,
    owner_id,
    NOW(),
    NOW()
FROM airline_seed
ON CONFLICT (iata_code) DO UPDATE SET
    icao_code = EXCLUDED.icao_code,
    name = EXCLUDED.name,
    alias = EXCLUDED.alias,
    logo_url = EXCLUDED.logo_url,
    website = EXCLUDED.website,
    status = EXCLUDED.status,
    alliance = EXCLUDED.alliance,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    hours = EXCLUDED.hours,
    headquarters_city_id = EXCLUDED.headquarters_city_id,
    owner_id = EXCLUDED.owner_id,
    updated_at = NOW();

WITH aircraft_seed (
    aircraft_code,
    model,
    manufacturer,
    seating_capacity,
    economy_seats,
    premium_economy_seats,
    business_seats,
    first_class_seats,
    range_km,
    cruising_speed_kmh,
    max_altitude_ft,
    year_of_manufacture,
    registration_date,
    next_maintenance_date,
    status,
    is_available,
    airline_iata_code,
    current_airport_id
) AS (
    VALUES
        ('VN-A359-01', 'Airbus A350-900', 'Airbus', 305, 231, 45, 29, 0, 15000, 905, 43100, 2019, DATE '2019-06-18', CURRENT_DATE + 42, 'ACTIVE', true, 'VN', current_setting('flighthub_seed.apt_sgn', true)::bigint),
        ('VN-B789-02', 'Boeing 787-9', 'Boeing', 274, 211, 35, 28, 0, 14140, 903, 43100, 2020, DATE '2020-09-12', CURRENT_DATE + 18, 'ACTIVE', true, 'VN', current_setting('flighthub_seed.apt_han', true)::bigint),
        ('VJ-A321-01', 'Airbus A321neo', 'Airbus', 240, 220, 20, 0, 0, 7400, 840, 39000, 2021, DATE '2021-04-22', CURRENT_DATE + 29, 'ACTIVE', true, 'VJ', current_setting('flighthub_seed.apt_sgn', true)::bigint),
        ('VJ-A320-02', 'Airbus A320-200', 'Airbus', 186, 180, 6, 0, 0, 6100, 828, 39000, 2018, DATE '2018-11-05', CURRENT_DATE + 10, 'MAINTENANCE', false, 'VJ', current_setting('flighthub_seed.apt_dad', true)::bigint),
        ('QH-B789-01', 'Boeing 787-9', 'Boeing', 294, 247, 21, 26, 0, 14140, 903, 43100, 2020, DATE '2020-01-16', CURRENT_DATE + 35, 'ACTIVE', true, 'QH', current_setting('flighthub_seed.apt_han', true)::bigint),
        ('SQ-A359-01', 'Airbus A350-900', 'Airbus', 253, 187, 24, 42, 0, 15000, 905, 43100, 2022, DATE '2022-03-04', CURRENT_DATE + 52, 'ACTIVE', true, 'SQ', current_setting('flighthub_seed.apt_sin', true)::bigint),
        ('TG-B77W-01', 'Boeing 777-300ER', 'Boeing', 348, 306, 0, 42, 0, 13650, 905, 43100, 2017, DATE '2017-08-14', CURRENT_DATE + 21, 'ACTIVE', true, 'TG', current_setting('flighthub_seed.apt_bkk', true)::bigint),
        ('AK-A320-01', 'Airbus A320neo', 'Airbus', 186, 186, 0, 0, 0, 6300, 828, 39000, 2021, DATE '2021-07-09', CURRENT_DATE + 26, 'ACTIVE', true, 'AK', current_setting('flighthub_seed.apt_kul', true)::bigint),
        ('CX-A35K-01', 'Airbus A350-1000', 'Airbus', 334, 256, 32, 46, 0, 16100, 905, 41450, 2020, DATE '2020-10-20', CURRENT_DATE + 33, 'ACTIVE', true, 'CX', current_setting('flighthub_seed.apt_hkg', true)::bigint),
        ('JL-B789-01', 'Boeing 787-9', 'Boeing', 239, 156, 35, 44, 4, 14140, 903, 43100, 2019, DATE '2019-02-11', CURRENT_DATE + 44, 'ACTIVE', true, 'JL', current_setting('flighthub_seed.apt_hnd', true)::bigint),
        ('EK-A388-01', 'Airbus A380-800', 'Airbus', 517, 399, 76, 42, 0, 15200, 903, 43100, 2018, DATE '2018-05-27', CURRENT_DATE + 14, 'ACTIVE', true, 'EK', current_setting('flighthub_seed.apt_dxb', true)::bigint),
        ('QR-A359-01', 'Airbus A350-900', 'Airbus', 283, 247, 0, 36, 0, 15000, 905, 43100, 2021, DATE '2021-12-01', CURRENT_DATE + 39, 'ACTIVE', true, 'QR', current_setting('flighthub_seed.apt_doh', true)::bigint)
)
INSERT INTO aircrafts (
    aircraft_code,
    model,
    manufacturer,
    seating_capacity,
    economy_seats,
    premium_economy_seats,
    business_seats,
    first_class_seats,
    range_km,
    cruising_speed_kmh,
    max_altitude_ft,
    year_of_manufacture,
    registration_date,
    next_maintenance_date,
    status,
    is_available,
    airline_id,
    current_airport_id,
    created_at,
    updated_at
)
SELECT
    seed.aircraft_code,
    seed.model,
    seed.manufacturer,
    seed.seating_capacity,
    seed.economy_seats,
    seed.premium_economy_seats,
    seed.business_seats,
    seed.first_class_seats,
    seed.range_km,
    seed.cruising_speed_kmh,
    seed.max_altitude_ft,
    seed.year_of_manufacture,
    seed.registration_date,
    seed.next_maintenance_date,
    seed.status,
    seed.is_available,
    airline.id,
    seed.current_airport_id,
    NOW(),
    NOW()
FROM aircraft_seed seed
JOIN airlines airline ON airline.iata_code = seed.airline_iata_code
ON CONFLICT (aircraft_code) DO UPDATE SET
    model = EXCLUDED.model,
    manufacturer = EXCLUDED.manufacturer,
    seating_capacity = EXCLUDED.seating_capacity,
    economy_seats = EXCLUDED.economy_seats,
    premium_economy_seats = EXCLUDED.premium_economy_seats,
    business_seats = EXCLUDED.business_seats,
    first_class_seats = EXCLUDED.first_class_seats,
    range_km = EXCLUDED.range_km,
    cruising_speed_kmh = EXCLUDED.cruising_speed_kmh,
    max_altitude_ft = EXCLUDED.max_altitude_ft,
    year_of_manufacture = EXCLUDED.year_of_manufacture,
    registration_date = EXCLUDED.registration_date,
    next_maintenance_date = EXCLUDED.next_maintenance_date,
    status = EXCLUDED.status,
    is_available = EXCLUDED.is_available,
    airline_id = EXCLUDED.airline_id,
    current_airport_id = EXCLUDED.current_airport_id,
    updated_at = NOW();

SELECT setval(
    pg_get_serial_sequence('airlines', 'id'),
    COALESCE((SELECT MAX(id) FROM airlines), 1),
    true
);

SELECT setval(
    pg_get_serial_sequence('aircrafts', 'id'),
    COALESCE((SELECT MAX(id) FROM aircrafts), 1),
    true
);

COMMIT;
