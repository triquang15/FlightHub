-- Production-style flight-ops seed data.
-- Safe to re-run: seeded flights are keyed by flight_number; schedules are
-- updated per seeded flight; instances use the unique flight/departure pair.
--
-- This script expects session settings supplied by the seed runner:
--   flighthub_seed.airline_* values are airline-core-service airlines.id values.
--   flighthub_seed.aircraft_* values are airline-core-service aircrafts.id values.
--   flighthub_seed.apt_* values are location-service airports.id values.
-- Run it through scripts/init-production-demo-data.sh, not directly.

DO $$
BEGIN
    IF current_setting('flighthub_seed.airline_vn', true) IS NULL THEN
        RAISE EXCEPTION 'Missing seed context. Run this file through scripts/init-production-demo-data.sh so cross-service IDs are resolved first.';
    END IF;
END $$;

BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS uk_flights_flight_number
    ON flights (flight_number);

WITH flight_seed (
    flight_number,
    airline_id,
    aircraft_id,
    departure_airport_id,
    arrival_airport_id,
    status
) AS (
    VALUES
        ('VN210', current_setting('flighthub_seed.airline_vn', true)::bigint, current_setting('flighthub_seed.aircraft_vn_a359', true)::bigint, current_setting('flighthub_seed.apt_sgn', true)::bigint, current_setting('flighthub_seed.apt_han', true)::bigint, 'SCHEDULED'),
        ('VN211', current_setting('flighthub_seed.airline_vn', true)::bigint, current_setting('flighthub_seed.aircraft_vn_b789', true)::bigint, current_setting('flighthub_seed.apt_han', true)::bigint, current_setting('flighthub_seed.apt_sgn', true)::bigint, 'SCHEDULED'),
        ('VN218', current_setting('flighthub_seed.airline_vn', true)::bigint, current_setting('flighthub_seed.aircraft_vn_b789', true)::bigint, current_setting('flighthub_seed.apt_sgn', true)::bigint, current_setting('flighthub_seed.apt_han', true)::bigint, 'SCHEDULED'),
        ('VN136', current_setting('flighthub_seed.airline_vn', true)::bigint, current_setting('flighthub_seed.aircraft_vn_a359', true)::bigint, current_setting('flighthub_seed.apt_sgn', true)::bigint, current_setting('flighthub_seed.apt_dad', true)::bigint, 'SCHEDULED'),
        ('VN117', current_setting('flighthub_seed.airline_vn', true)::bigint, current_setting('flighthub_seed.aircraft_vn_a359', true)::bigint, current_setting('flighthub_seed.apt_han', true)::bigint, current_setting('flighthub_seed.apt_dad', true)::bigint, 'SCHEDULED'),
        ('VN135', current_setting('flighthub_seed.airline_vn', true)::bigint, current_setting('flighthub_seed.aircraft_vn_a359', true)::bigint, current_setting('flighthub_seed.apt_dad', true)::bigint, current_setting('flighthub_seed.apt_sgn', true)::bigint, 'SCHEDULED'),
        ('VN651', current_setting('flighthub_seed.airline_vn', true)::bigint, current_setting('flighthub_seed.aircraft_vn_b789', true)::bigint, current_setting('flighthub_seed.apt_sgn', true)::bigint, current_setting('flighthub_seed.apt_sin', true)::bigint, 'SCHEDULED'),
        ('VN650', current_setting('flighthub_seed.airline_vn', true)::bigint, current_setting('flighthub_seed.aircraft_vn_b789', true)::bigint, current_setting('flighthub_seed.apt_sin', true)::bigint, current_setting('flighthub_seed.apt_sgn', true)::bigint, 'SCHEDULED'),
        ('VN652', current_setting('flighthub_seed.airline_vn', true)::bigint, current_setting('flighthub_seed.aircraft_vn_b789', true)::bigint, current_setting('flighthub_seed.apt_han', true)::bigint, current_setting('flighthub_seed.apt_sin', true)::bigint, 'SCHEDULED'),
        ('VJ122', current_setting('flighthub_seed.airline_vj', true)::bigint, current_setting('flighthub_seed.aircraft_vj_a321', true)::bigint, current_setting('flighthub_seed.apt_sgn', true)::bigint, current_setting('flighthub_seed.apt_han', true)::bigint, 'SCHEDULED'),
        ('VJ123', current_setting('flighthub_seed.airline_vj', true)::bigint, current_setting('flighthub_seed.aircraft_vj_a321', true)::bigint, current_setting('flighthub_seed.apt_han', true)::bigint, current_setting('flighthub_seed.apt_sgn', true)::bigint, 'SCHEDULED'),
        ('VJ504', current_setting('flighthub_seed.airline_vj', true)::bigint, current_setting('flighthub_seed.aircraft_vj_a321', true)::bigint, current_setting('flighthub_seed.apt_dad', true)::bigint, current_setting('flighthub_seed.apt_han', true)::bigint, 'SCHEDULED'),
        ('VJ505', current_setting('flighthub_seed.airline_vj', true)::bigint, current_setting('flighthub_seed.aircraft_vj_a321', true)::bigint, current_setting('flighthub_seed.apt_han', true)::bigint, current_setting('flighthub_seed.apt_dad', true)::bigint, 'SCHEDULED'),
        ('VJ803', current_setting('flighthub_seed.airline_vj', true)::bigint, current_setting('flighthub_seed.aircraft_vj_a321', true)::bigint, current_setting('flighthub_seed.apt_sgn', true)::bigint, current_setting('flighthub_seed.apt_bkk', true)::bigint, 'SCHEDULED'),
        ('VJ804', current_setting('flighthub_seed.airline_vj', true)::bigint, current_setting('flighthub_seed.aircraft_vj_a321', true)::bigint, current_setting('flighthub_seed.apt_bkk', true)::bigint, current_setting('flighthub_seed.apt_sgn', true)::bigint, 'SCHEDULED'),
        ('AK520', current_setting('flighthub_seed.airline_ak', true)::bigint, current_setting('flighthub_seed.aircraft_ak_a320', true)::bigint, current_setting('flighthub_seed.apt_kul', true)::bigint, current_setting('flighthub_seed.apt_sgn', true)::bigint, 'SCHEDULED'),
        ('AK521', current_setting('flighthub_seed.airline_ak', true)::bigint, current_setting('flighthub_seed.aircraft_ak_a320', true)::bigint, current_setting('flighthub_seed.apt_sgn', true)::bigint, current_setting('flighthub_seed.apt_kul', true)::bigint, 'SCHEDULED'),
        ('AK512', current_setting('flighthub_seed.airline_ak', true)::bigint, current_setting('flighthub_seed.aircraft_ak_a320', true)::bigint, current_setting('flighthub_seed.apt_kul', true)::bigint, current_setting('flighthub_seed.apt_han', true)::bigint, 'SCHEDULED'),
        ('AK513', current_setting('flighthub_seed.airline_ak', true)::bigint, current_setting('flighthub_seed.aircraft_ak_a320', true)::bigint, current_setting('flighthub_seed.apt_han', true)::bigint, current_setting('flighthub_seed.apt_kul', true)::bigint, 'SCHEDULED'),
        ('SQ185', current_setting('flighthub_seed.airline_sq', true)::bigint, current_setting('flighthub_seed.aircraft_sq_a359', true)::bigint, current_setting('flighthub_seed.apt_sgn', true)::bigint, current_setting('flighthub_seed.apt_sin', true)::bigint, 'SCHEDULED'),
        ('SQ186', current_setting('flighthub_seed.airline_sq', true)::bigint, current_setting('flighthub_seed.aircraft_sq_a359', true)::bigint, current_setting('flighthub_seed.apt_sin', true)::bigint, current_setting('flighthub_seed.apt_sgn', true)::bigint, 'SCHEDULED'),
        ('SQ176', current_setting('flighthub_seed.airline_sq', true)::bigint, current_setting('flighthub_seed.aircraft_sq_a359', true)::bigint, current_setting('flighthub_seed.apt_sin', true)::bigint, current_setting('flighthub_seed.apt_han', true)::bigint, 'SCHEDULED'),
        ('SQ175', current_setting('flighthub_seed.airline_sq', true)::bigint, current_setting('flighthub_seed.aircraft_sq_a359', true)::bigint, current_setting('flighthub_seed.apt_han', true)::bigint, current_setting('flighthub_seed.apt_sin', true)::bigint, 'SCHEDULED'),
        ('TG551', current_setting('flighthub_seed.airline_tg', true)::bigint, current_setting('flighthub_seed.aircraft_tg_b77w', true)::bigint, current_setting('flighthub_seed.apt_sgn', true)::bigint, current_setting('flighthub_seed.apt_bkk', true)::bigint, 'SCHEDULED'),
        ('TG550', current_setting('flighthub_seed.airline_tg', true)::bigint, current_setting('flighthub_seed.aircraft_tg_b77w', true)::bigint, current_setting('flighthub_seed.apt_bkk', true)::bigint, current_setting('flighthub_seed.apt_sgn', true)::bigint, 'SCHEDULED'),
        ('TG560', current_setting('flighthub_seed.airline_tg', true)::bigint, current_setting('flighthub_seed.aircraft_tg_b77w', true)::bigint, current_setting('flighthub_seed.apt_bkk', true)::bigint, current_setting('flighthub_seed.apt_han', true)::bigint, 'SCHEDULED'),
        ('TG561', current_setting('flighthub_seed.airline_tg', true)::bigint, current_setting('flighthub_seed.aircraft_tg_b77w', true)::bigint, current_setting('flighthub_seed.apt_han', true)::bigint, current_setting('flighthub_seed.apt_bkk', true)::bigint, 'SCHEDULED'),
        ('CX764', current_setting('flighthub_seed.airline_cx', true)::bigint, current_setting('flighthub_seed.aircraft_cx_a35k', true)::bigint, current_setting('flighthub_seed.apt_sgn', true)::bigint, current_setting('flighthub_seed.apt_hkg', true)::bigint, 'SCHEDULED'),
        ('CX765', current_setting('flighthub_seed.airline_cx', true)::bigint, current_setting('flighthub_seed.aircraft_cx_a35k', true)::bigint, current_setting('flighthub_seed.apt_hkg', true)::bigint, current_setting('flighthub_seed.apt_sgn', true)::bigint, 'SCHEDULED'),
        ('CX743', current_setting('flighthub_seed.airline_cx', true)::bigint, current_setting('flighthub_seed.aircraft_cx_a35k', true)::bigint, current_setting('flighthub_seed.apt_hkg', true)::bigint, current_setting('flighthub_seed.apt_han', true)::bigint, 'SCHEDULED'),
        ('CX742', current_setting('flighthub_seed.airline_cx', true)::bigint, current_setting('flighthub_seed.aircraft_cx_a35k', true)::bigint, current_setting('flighthub_seed.apt_han', true)::bigint, current_setting('flighthub_seed.apt_hkg', true)::bigint, 'SCHEDULED'),
        ('EK393', current_setting('flighthub_seed.airline_ek', true)::bigint, current_setting('flighthub_seed.aircraft_ek_a388', true)::bigint, current_setting('flighthub_seed.apt_sgn', true)::bigint, current_setting('flighthub_seed.apt_dxb', true)::bigint, 'SCHEDULED'),
        ('EK392', current_setting('flighthub_seed.airline_ek', true)::bigint, current_setting('flighthub_seed.aircraft_ek_a388', true)::bigint, current_setting('flighthub_seed.apt_dxb', true)::bigint, current_setting('flighthub_seed.apt_sgn', true)::bigint, 'SCHEDULED'),
        ('QR971', current_setting('flighthub_seed.airline_qr', true)::bigint, current_setting('flighthub_seed.aircraft_qr_a359', true)::bigint, current_setting('flighthub_seed.apt_sgn', true)::bigint, current_setting('flighthub_seed.apt_doh', true)::bigint, 'SCHEDULED'),
        ('QR970', current_setting('flighthub_seed.airline_qr', true)::bigint, current_setting('flighthub_seed.aircraft_qr_a359', true)::bigint, current_setting('flighthub_seed.apt_doh', true)::bigint, current_setting('flighthub_seed.apt_sgn', true)::bigint, 'SCHEDULED'),
        ('JL752', current_setting('flighthub_seed.airline_jl', true)::bigint, current_setting('flighthub_seed.aircraft_jl_b789', true)::bigint, current_setting('flighthub_seed.apt_sgn', true)::bigint, current_setting('flighthub_seed.apt_hnd', true)::bigint, 'SCHEDULED'),
        ('JL751', current_setting('flighthub_seed.airline_jl', true)::bigint, current_setting('flighthub_seed.aircraft_jl_b789', true)::bigint, current_setting('flighthub_seed.apt_hnd', true)::bigint, current_setting('flighthub_seed.apt_sgn', true)::bigint, 'SCHEDULED'),
        ('JL753', current_setting('flighthub_seed.airline_jl', true)::bigint, current_setting('flighthub_seed.aircraft_jl_b789', true)::bigint, current_setting('flighthub_seed.apt_hnd', true)::bigint, current_setting('flighthub_seed.apt_han', true)::bigint, 'SCHEDULED')
)
INSERT INTO flights (
    flight_number,
    airline_id,
    aircraft_id,
    departure_airport_id,
    arrival_airport_id,
    status,
    created_at,
    updated_at
)
SELECT
    flight_number,
    airline_id,
    aircraft_id,
    departure_airport_id,
    arrival_airport_id,
    status,
    NOW(),
    NOW()
FROM flight_seed
ON CONFLICT (flight_number) DO UPDATE SET
    airline_id = EXCLUDED.airline_id,
    aircraft_id = EXCLUDED.aircraft_id,
    departure_airport_id = EXCLUDED.departure_airport_id,
    arrival_airport_id = EXCLUDED.arrival_airport_id,
    status = EXCLUDED.status,
    updated_at = NOW();

CREATE TEMP TABLE seed_flight_schedules (
    flight_number varchar(10) PRIMARY KEY,
    departure_time time NOT NULL,
    arrival_time time NOT NULL,
    operating_days varchar[] NOT NULL,
    terminal varchar(16),
    gate varchar(16)
) ON COMMIT DROP;

INSERT INTO seed_flight_schedules VALUES
    ('VN210', TIME '07:00', TIME '09:10', ARRAY['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'], 'T1', 'A04'),
    ('VN211', TIME '10:30', TIME '12:40', ARRAY['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'], 'T1', 'B06'),
    ('VN218', TIME '18:00', TIME '20:10', ARRAY['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'], 'T1', 'A10'),
    ('VN136', TIME '13:20', TIME '14:45', ARRAY['MONDAY','WEDNESDAY','FRIDAY','SUNDAY'], 'T1', 'A08'),
    ('VN117', TIME '08:10', TIME '09:35', ARRAY['MONDAY','TUESDAY','THURSDAY','SATURDAY'], 'T1', 'B02'),
    ('VN135', TIME '15:30', TIME '16:55', ARRAY['MONDAY','WEDNESDAY','FRIDAY','SUNDAY'], 'T1', 'A06'),
    ('VN651', TIME '09:10', TIME '12:20', ARRAY['MONDAY','TUESDAY','THURSDAY','FRIDAY','SUNDAY'], 'T2', 'D02'),
    ('VN650', TIME '13:45', TIME '15:55', ARRAY['MONDAY','TUESDAY','THURSDAY','FRIDAY','SUNDAY'], 'T2', 'D03'),
    ('VN652', TIME '17:30', TIME '21:00', ARRAY['TUESDAY','THURSDAY','SATURDAY'], 'T2', 'D01'),
    ('VJ122', TIME '16:10', TIME '18:20', ARRAY['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'], 'T1', 'C05'),
    ('VJ123', TIME '20:30', TIME '22:40', ARRAY['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'], 'T1', 'C06'),
    ('VJ504', TIME '07:20', TIME '08:45', ARRAY['TUESDAY','THURSDAY','SATURDAY'], 'T1', 'C02'),
    ('VJ505', TIME '17:10', TIME '18:35', ARRAY['MONDAY','WEDNESDAY','FRIDAY','SUNDAY'], 'T1', 'C03'),
    ('VJ803', TIME '11:15', TIME '12:45', ARRAY['TUESDAY','THURSDAY','SATURDAY'], 'T2', 'D07'),
    ('VJ804', TIME '14:20', TIME '15:50', ARRAY['TUESDAY','THURSDAY','SATURDAY'], 'T2', 'D06'),
    ('AK520', TIME '08:00', TIME '10:05', ARRAY['MONDAY','WEDNESDAY','FRIDAY','SUNDAY'], 'T2', 'F01'),
    ('AK521', TIME '11:10', TIME '13:15', ARRAY['MONDAY','WEDNESDAY','FRIDAY','SUNDAY'], 'T2', 'F02'),
    ('AK512', TIME '14:00', TIME '17:05', ARRAY['TUESDAY','THURSDAY','SATURDAY'], 'T2', 'F03'),
    ('AK513', TIME '18:15', TIME '21:20', ARRAY['TUESDAY','THURSDAY','SATURDAY'], 'T2', 'F04'),
    ('SQ185', TIME '19:40', TIME '22:50', ARRAY['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'], 'T2', 'D04'),
    ('SQ186', TIME '09:30', TIME '12:40', ARRAY['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'], 'T2', 'D05'),
    ('SQ176', TIME '13:20', TIME '16:50', ARRAY['MONDAY','WEDNESDAY','FRIDAY','SUNDAY'], 'T2', 'D11'),
    ('SQ175', TIME '18:00', TIME '21:30', ARRAY['MONDAY','WEDNESDAY','FRIDAY','SUNDAY'], 'T2', 'D12'),
    ('TG551', TIME '10:05', TIME '11:35', ARRAY['MONDAY','WEDNESDAY','FRIDAY','SUNDAY'], 'T2', 'D08'),
    ('TG550', TIME '13:10', TIME '14:40', ARRAY['MONDAY','WEDNESDAY','FRIDAY','SUNDAY'], 'T2', 'D09'),
    ('TG560', TIME '08:30', TIME '10:20', ARRAY['TUESDAY','THURSDAY','SATURDAY'], 'T2', 'D13'),
    ('TG561', TIME '12:00', TIME '13:50', ARRAY['TUESDAY','THURSDAY','SATURDAY'], 'T2', 'D14'),
    ('CX764', TIME '18:20', TIME '22:05', ARRAY['TUESDAY','THURSDAY','SATURDAY'], 'T2', 'D10'),
    ('CX765', TIME '09:00', TIME '12:45', ARRAY['TUESDAY','THURSDAY','SATURDAY'], 'T2', 'D15'),
    ('CX743', TIME '14:10', TIME '16:20', ARRAY['MONDAY','WEDNESDAY','FRIDAY','SUNDAY'], 'T2', 'D16'),
    ('CX742', TIME '18:00', TIME '20:10', ARRAY['MONDAY','WEDNESDAY','FRIDAY','SUNDAY'], 'T2', 'D17'),
    ('EK393', TIME '23:55', TIME '04:25', ARRAY['MONDAY','WEDNESDAY','FRIDAY','SUNDAY'], 'T2', 'E02'),
    ('EK392', TIME '09:00', TIME '15:30', ARRAY['MONDAY','WEDNESDAY','FRIDAY','SUNDAY'], 'T3', 'E03'),
    ('QR971', TIME '20:00', TIME '23:45', ARRAY['TUESDAY','THURSDAY','SATURDAY'], 'T2', 'E04'),
    ('QR970', TIME '08:15', TIME '14:20', ARRAY['TUESDAY','THURSDAY','SATURDAY'], 'T3', 'E05'),
    ('JL752', TIME '23:40', TIME '07:35', ARRAY['MONDAY','WEDNESDAY','FRIDAY'], 'T2', 'E06'),
    ('JL751', TIME '09:30', TIME '17:25', ARRAY['MONDAY','WEDNESDAY','FRIDAY'], 'T3', 'E07'),
    ('JL753', TIME '10:45', TIME '18:15', ARRAY['TUESDAY','THURSDAY','SATURDAY'], 'T3', 'E08');

UPDATE flight_schedules fs
SET
    departure_airport_id = f.departure_airport_id,
    arrival_airport_id = f.arrival_airport_id,
    departure_time = seed.departure_time,
    arrival_time = seed.arrival_time,
    start_date = CURRENT_DATE,
    end_date = CURRENT_DATE + 120,
    recurrence_type = 'WEEKLY',
    is_active = true
FROM flights f
JOIN seed_flight_schedules seed ON seed.flight_number = f.flight_number
WHERE fs.flight_id = f.id;

INSERT INTO flight_schedules (
    flight_id,
    departure_airport_id,
    arrival_airport_id,
    departure_time,
    arrival_time,
    start_date,
    end_date,
    recurrence_type,
    is_active,
    version
)
SELECT
    f.id,
    f.departure_airport_id,
    f.arrival_airport_id,
    seed.departure_time,
    seed.arrival_time,
    CURRENT_DATE,
    CURRENT_DATE + 120,
    'WEEKLY',
    true,
    0
FROM flights f
JOIN seed_flight_schedules seed ON seed.flight_number = f.flight_number
WHERE NOT EXISTS (
    SELECT 1 FROM flight_schedules fs WHERE fs.flight_id = f.id
);

DELETE FROM schedule_operating_days sod
USING flight_schedules fs, flights f, seed_flight_schedules seed
WHERE sod.schedule_id = fs.id
  AND fs.flight_id = f.id
  AND seed.flight_number = f.flight_number;

INSERT INTO schedule_operating_days (schedule_id, day_of_week)
SELECT fs.id, day_name
FROM flight_schedules fs
JOIN flights f ON f.id = fs.flight_id
JOIN seed_flight_schedules seed ON seed.flight_number = f.flight_number
CROSS JOIN LATERAL unnest(seed.operating_days) AS day_name;

WITH generated_instances AS (
    SELECT
        f.id AS flight_id,
        f.airline_id,
        fs.id AS schedule_id,
        f.departure_airport_id,
        f.arrival_airport_id,
        day_value::date + seed.departure_time AS departure_date_time,
        CASE
            WHEN seed.arrival_time <= seed.departure_time
                THEN day_value::date + 1 + seed.arrival_time
            ELSE day_value::date + seed.arrival_time
        END AS arrival_date_time,
        aircraft_capacity.total_seats,
        seed.terminal,
        seed.gate
    FROM flights f
    JOIN seed_flight_schedules seed ON seed.flight_number = f.flight_number
    JOIN flight_schedules fs ON fs.flight_id = f.id
    JOIN LATERAL generate_series(CURRENT_DATE + 1, CURRENT_DATE + 90, INTERVAL '1 day') day_value ON true
    JOIN LATERAL (
        VALUES
            (current_setting('flighthub_seed.aircraft_vn_a359', true)::bigint, 305),
            (current_setting('flighthub_seed.aircraft_vn_b789', true)::bigint, 274),
            (current_setting('flighthub_seed.aircraft_vj_a321', true)::bigint, 240),
            (current_setting('flighthub_seed.aircraft_ak_a320', true)::bigint, 186),
            (current_setting('flighthub_seed.aircraft_sq_a359', true)::bigint, 253),
            (current_setting('flighthub_seed.aircraft_tg_b77w', true)::bigint, 348),
            (current_setting('flighthub_seed.aircraft_cx_a35k', true)::bigint, 334),
            (current_setting('flighthub_seed.aircraft_ek_a388', true)::bigint, 517),
            (current_setting('flighthub_seed.aircraft_qr_a359', true)::bigint, 283),
            (current_setting('flighthub_seed.aircraft_jl_b789', true)::bigint, 239)
    ) AS aircraft_capacity(aircraft_id, total_seats) ON aircraft_capacity.aircraft_id = f.aircraft_id
    WHERE upper(trim(to_char(day_value, 'DAY'))) = ANY(seed.operating_days)
)
INSERT INTO flight_instances (
    airline_id,
    flight_id,
    departure_airport_id,
    arrival_airport_id,
    schedule_id,
    departure_date_time,
    arrival_date_time,
    total_seats,
    available_seats,
    status,
    min_advance_booking_days,
    max_advance_booking_days,
    is_active,
    terminal,
    gate,
    version
)
SELECT
    airline_id,
    flight_id,
    departure_airport_id,
    arrival_airport_id,
    schedule_id,
    departure_date_time,
    arrival_date_time,
    total_seats,
    total_seats,
    'SCHEDULED',
    0,
    330,
    true,
    terminal,
    gate,
    0
FROM generated_instances
ON CONFLICT (flight_id, departure_date_time) DO UPDATE SET
    airline_id = EXCLUDED.airline_id,
    departure_airport_id = EXCLUDED.departure_airport_id,
    arrival_airport_id = EXCLUDED.arrival_airport_id,
    schedule_id = EXCLUDED.schedule_id,
    arrival_date_time = EXCLUDED.arrival_date_time,
    total_seats = EXCLUDED.total_seats,
    available_seats = LEAST(flight_instances.available_seats, EXCLUDED.total_seats),
    status = CASE
        WHEN flight_instances.status IN ('CANCELLED', 'COMPLETED', 'DIVERTED')
            THEN flight_instances.status
        ELSE EXCLUDED.status
    END,
    min_advance_booking_days = EXCLUDED.min_advance_booking_days,
    max_advance_booking_days = EXCLUDED.max_advance_booking_days,
    is_active = EXCLUDED.is_active,
    terminal = EXCLUDED.terminal,
    gate = EXCLUDED.gate;

SELECT setval(
    pg_get_serial_sequence('flights', 'id'),
    COALESCE((SELECT MAX(id) FROM flights), 1),
    true
);

SELECT setval(
    pg_get_serial_sequence('flight_schedules', 'id'),
    COALESCE((SELECT MAX(id) FROM flight_schedules), 1),
    true
);

SELECT setval(
    pg_get_serial_sequence('flight_instances', 'id'),
    COALESCE((SELECT MAX(id) FROM flight_instances), 1),
    true
);

COMMIT;
