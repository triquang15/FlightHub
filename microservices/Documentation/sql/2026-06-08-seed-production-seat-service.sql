-- Production-style seat-service seed data.
-- Safe to re-run after service schemas are created.
--
-- This script expects session settings supplied by scripts/init-production-demo-data.sh:
--   flighthub_seed.airline_* and flighthub_seed.aircraft_* values resolved from airline-core-service.

DO $$
BEGIN
    IF current_setting('flighthub_seed.aircraft_vn_a359', true) IS NULL THEN
        RAISE EXCEPTION 'Missing seed context. Run this file through scripts/init-production-demo-data.sh.';
    END IF;
END $$;

BEGIN;

ALTER TABLE IF EXISTS seat_instances
    ADD COLUMN IF NOT EXISTS hold_token varchar(255),
    ADD COLUMN IF NOT EXISTS held_by_user_id bigint,
    ADD COLUMN IF NOT EXISTS booking_reference varchar(255),
    ADD COLUMN IF NOT EXISTS hold_expires_at timestamptz;

CREATE TABLE IF NOT EXISTS seat_map_zones (
    id bigserial PRIMARY KEY,
    name varchar(255) NOT NULL,
    start_row integer NOT NULL,
    end_row integer NOT NULL,
    left_seats_per_row integer NOT NULL,
    right_seats_per_row integer NOT NULL,
    seats_in_last_row integer,
    display_order integer NOT NULL DEFAULT 0,
    seat_map_id bigint NOT NULL REFERENCES seat_maps(id) ON DELETE CASCADE,
    CONSTRAINT uk_seat_map_zone_row_range UNIQUE (seat_map_id, start_row, end_row)
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_flight_instance_cabin
    ON flight_instance_cabins (flight_instance_id, cabin_class_id);

CREATE UNIQUE INDEX IF NOT EXISTS uk_seat_instance_flight_instance_seat
    ON seat_instances (flight_instance_id, seat_id);

CREATE UNIQUE INDEX IF NOT EXISTS uk_seat_number_per_map
    ON seats (seat_map_id, seat_number);

WITH cabin_seed (
    aircraft_id,
    airline_id,
    cabin_name,
    code,
    description,
    display_order,
    target_seats,
    left_seats_per_row,
    right_seats_per_row,
    seat_pitch,
    seat_width
) AS (
    VALUES
        (current_setting('flighthub_seed.aircraft_vn_a359', true)::bigint, current_setting('flighthub_seed.airline_vn', true)::bigint, 'BUSINESS', 'BUS', 'Lie-flat long-haul business cabin', 1, 29, 2, 4, 78, 21),
        (current_setting('flighthub_seed.aircraft_vn_a359', true)::bigint, current_setting('flighthub_seed.airline_vn', true)::bigint, 'PREMIUM_ECONOMY', 'PRE', 'Extra recline premium economy cabin', 2, 45, 3, 3, 38, 19),
        (current_setting('flighthub_seed.aircraft_vn_a359', true)::bigint, current_setting('flighthub_seed.airline_vn', true)::bigint, 'ECONOMY', 'ECO', 'Standard economy cabin', 3, 231, 3, 3, 32, 18),
        (current_setting('flighthub_seed.aircraft_vn_b789', true)::bigint, current_setting('flighthub_seed.airline_vn', true)::bigint, 'BUSINESS', 'BUS', 'Dreamliner business cabin', 1, 28, 2, 4, 78, 21),
        (current_setting('flighthub_seed.aircraft_vn_b789', true)::bigint, current_setting('flighthub_seed.airline_vn', true)::bigint, 'PREMIUM_ECONOMY', 'PRE', 'Dreamliner premium economy cabin', 2, 35, 3, 3, 38, 19),
        (current_setting('flighthub_seed.aircraft_vn_b789', true)::bigint, current_setting('flighthub_seed.airline_vn', true)::bigint, 'ECONOMY', 'ECO', 'Dreamliner economy cabin', 3, 211, 3, 3, 32, 18),
        (current_setting('flighthub_seed.aircraft_vj_a321', true)::bigint, current_setting('flighthub_seed.airline_vj', true)::bigint, 'PREMIUM_ECONOMY', 'PRE', 'Front-row premium cabin', 1, 20, 3, 3, 34, 18),
        (current_setting('flighthub_seed.aircraft_vj_a321', true)::bigint, current_setting('flighthub_seed.airline_vj', true)::bigint, 'ECONOMY', 'ECO', 'High-density economy cabin', 2, 220, 3, 3, 29, 18),
        (current_setting('flighthub_seed.aircraft_ak_a320', true)::bigint, current_setting('flighthub_seed.airline_ak', true)::bigint, 'ECONOMY', 'ECO', 'Single-cabin economy layout', 1, 186, 3, 3, 29, 18),
        (current_setting('flighthub_seed.aircraft_sq_a359', true)::bigint, current_setting('flighthub_seed.airline_sq', true)::bigint, 'BUSINESS', 'BUS', 'Premium business cabin', 1, 42, 2, 4, 78, 21),
        (current_setting('flighthub_seed.aircraft_sq_a359', true)::bigint, current_setting('flighthub_seed.airline_sq', true)::bigint, 'PREMIUM_ECONOMY', 'PRE', 'Premium economy cabin', 2, 24, 3, 3, 38, 19),
        (current_setting('flighthub_seed.aircraft_sq_a359', true)::bigint, current_setting('flighthub_seed.airline_sq', true)::bigint, 'ECONOMY', 'ECO', 'Economy cabin', 3, 187, 3, 3, 32, 18),
        (current_setting('flighthub_seed.aircraft_tg_b77w', true)::bigint, current_setting('flighthub_seed.airline_tg', true)::bigint, 'BUSINESS', 'BUS', 'Royal silk business cabin', 1, 42, 2, 4, 78, 21),
        (current_setting('flighthub_seed.aircraft_tg_b77w', true)::bigint, current_setting('flighthub_seed.airline_tg', true)::bigint, 'ECONOMY', 'ECO', 'Widebody economy cabin', 2, 306, 3, 3, 32, 18),
        (current_setting('flighthub_seed.aircraft_cx_a35k', true)::bigint, current_setting('flighthub_seed.airline_cx', true)::bigint, 'BUSINESS', 'BUS', 'Long-haul business cabin', 1, 46, 2, 4, 78, 21),
        (current_setting('flighthub_seed.aircraft_cx_a35k', true)::bigint, current_setting('flighthub_seed.airline_cx', true)::bigint, 'PREMIUM_ECONOMY', 'PRE', 'Premium economy cabin', 2, 32, 3, 3, 38, 19),
        (current_setting('flighthub_seed.aircraft_cx_a35k', true)::bigint, current_setting('flighthub_seed.airline_cx', true)::bigint, 'ECONOMY', 'ECO', 'Economy cabin', 3, 256, 3, 3, 32, 18),
        (current_setting('flighthub_seed.aircraft_jl_b789', true)::bigint, current_setting('flighthub_seed.airline_jl', true)::bigint, 'FIRST', 'FST', 'First class suites', 1, 4, 2, 2, 84, 23),
        (current_setting('flighthub_seed.aircraft_jl_b789', true)::bigint, current_setting('flighthub_seed.airline_jl', true)::bigint, 'BUSINESS', 'BUS', 'Sky suite business cabin', 2, 44, 2, 2, 78, 21),
        (current_setting('flighthub_seed.aircraft_jl_b789', true)::bigint, current_setting('flighthub_seed.airline_jl', true)::bigint, 'PREMIUM_ECONOMY', 'PRE', 'Premium economy cabin', 3, 35, 2, 3, 38, 19),
        (current_setting('flighthub_seed.aircraft_jl_b789', true)::bigint, current_setting('flighthub_seed.airline_jl', true)::bigint, 'ECONOMY', 'ECO', 'Economy cabin', 4, 156, 3, 3, 32, 18),
        (current_setting('flighthub_seed.aircraft_ek_a388', true)::bigint, current_setting('flighthub_seed.airline_ek', true)::bigint, 'BUSINESS', 'BUS', 'A380 upper-deck business cabin', 1, 42, 2, 4, 78, 21),
        (current_setting('flighthub_seed.aircraft_ek_a388', true)::bigint, current_setting('flighthub_seed.airline_ek', true)::bigint, 'PREMIUM_ECONOMY', 'PRE', 'Premium economy cabin', 2, 76, 3, 3, 38, 19),
        (current_setting('flighthub_seed.aircraft_ek_a388', true)::bigint, current_setting('flighthub_seed.airline_ek', true)::bigint, 'ECONOMY', 'ECO', 'A380 economy cabin', 3, 399, 3, 3, 32, 18),
        (current_setting('flighthub_seed.aircraft_qr_a359', true)::bigint, current_setting('flighthub_seed.airline_qr', true)::bigint, 'BUSINESS', 'BUS', 'Qsuite business cabin', 1, 36, 2, 4, 78, 21),
        (current_setting('flighthub_seed.aircraft_qr_a359', true)::bigint, current_setting('flighthub_seed.airline_qr', true)::bigint, 'ECONOMY', 'ECO', 'Economy cabin', 2, 247, 3, 3, 32, 18)
),
normalized_seed AS (
    SELECT
        *,
        left_seats_per_row + right_seats_per_row AS seats_per_row,
        ((target_seats + left_seats_per_row + right_seats_per_row - 1)
            / (left_seats_per_row + right_seats_per_row)) AS total_rows,
        NULLIF(target_seats % (left_seats_per_row + right_seats_per_row), 0) AS seats_in_last_row
    FROM cabin_seed
),
inserted_cabins AS (
    INSERT INTO cabin_classes (
        aircraft_id,
        name,
        code,
        description,
        display_order,
        is_active,
        is_bookable,
        typical_seat_pitch,
        typical_seat_width,
        seat_type,
        created_at,
        updated_at
    )
    SELECT
        aircraft_id,
        cabin_name,
        code,
        description,
        display_order,
        true,
        true,
        seat_pitch,
        seat_width,
        'STANDARD',
        NOW(),
        NOW()
    FROM normalized_seed seed
    WHERE NOT EXISTS (
        SELECT 1 FROM cabin_classes existing
        WHERE existing.aircraft_id = seed.aircraft_id
          AND existing.code = seed.code
    )
    RETURNING id
),
updated_cabins AS (
    UPDATE cabin_classes existing
    SET
        description = seed.description,
        display_order = seed.display_order,
        is_active = true,
        is_bookable = true,
        typical_seat_pitch = seed.seat_pitch,
        typical_seat_width = seed.seat_width,
        updated_at = NOW()
    FROM normalized_seed seed
    WHERE existing.aircraft_id = seed.aircraft_id
      AND existing.code = seed.code
    RETURNING existing.id
),
upserted_maps AS (
    INSERT INTO seat_maps (
        name,
        total_rows,
        right_seats_per_row,
        left_seats_per_row,
        airline_id,
        cabin_class_id
    )
    SELECT
        seed.cabin_name || ' ' || seed.code || ' layout',
        seed.total_rows,
        seed.right_seats_per_row,
        seed.left_seats_per_row,
        seed.airline_id,
        cabin.id
    FROM normalized_seed seed
    JOIN cabin_classes cabin
      ON cabin.aircraft_id = seed.aircraft_id
     AND cabin.code = seed.code
    WHERE NOT EXISTS (
        SELECT 1 FROM seat_maps existing
        WHERE existing.cabin_class_id = cabin.id
    )
    RETURNING id
)
UPDATE seat_maps existing
SET
    name = seed.cabin_name || ' ' || seed.code || ' layout',
    total_rows = seed.total_rows,
    right_seats_per_row = seed.right_seats_per_row,
    left_seats_per_row = seed.left_seats_per_row,
    airline_id = seed.airline_id
FROM normalized_seed seed
JOIN cabin_classes cabin
  ON cabin.aircraft_id = seed.aircraft_id
 AND cabin.code = seed.code
WHERE existing.cabin_class_id = cabin.id;

WITH cabin_seed (
    aircraft_id,
    airline_id,
    cabin_name,
    code,
    target_seats,
    left_seats_per_row,
    right_seats_per_row,
    display_order
) AS (
    VALUES
        (current_setting('flighthub_seed.aircraft_vn_a359', true)::bigint, current_setting('flighthub_seed.airline_vn', true)::bigint, 'BUSINESS', 'BUS', 29, 2, 4, 1),
        (current_setting('flighthub_seed.aircraft_vn_a359', true)::bigint, current_setting('flighthub_seed.airline_vn', true)::bigint, 'PREMIUM_ECONOMY', 'PRE', 45, 3, 3, 2),
        (current_setting('flighthub_seed.aircraft_vn_a359', true)::bigint, current_setting('flighthub_seed.airline_vn', true)::bigint, 'ECONOMY', 'ECO', 231, 3, 3, 3),
        (current_setting('flighthub_seed.aircraft_vn_b789', true)::bigint, current_setting('flighthub_seed.airline_vn', true)::bigint, 'BUSINESS', 'BUS', 28, 2, 4, 1),
        (current_setting('flighthub_seed.aircraft_vn_b789', true)::bigint, current_setting('flighthub_seed.airline_vn', true)::bigint, 'PREMIUM_ECONOMY', 'PRE', 35, 3, 3, 2),
        (current_setting('flighthub_seed.aircraft_vn_b789', true)::bigint, current_setting('flighthub_seed.airline_vn', true)::bigint, 'ECONOMY', 'ECO', 211, 3, 3, 3),
        (current_setting('flighthub_seed.aircraft_vj_a321', true)::bigint, current_setting('flighthub_seed.airline_vj', true)::bigint, 'PREMIUM_ECONOMY', 'PRE', 20, 3, 3, 1),
        (current_setting('flighthub_seed.aircraft_vj_a321', true)::bigint, current_setting('flighthub_seed.airline_vj', true)::bigint, 'ECONOMY', 'ECO', 220, 3, 3, 2),
        (current_setting('flighthub_seed.aircraft_ak_a320', true)::bigint, current_setting('flighthub_seed.airline_ak', true)::bigint, 'ECONOMY', 'ECO', 186, 3, 3, 1),
        (current_setting('flighthub_seed.aircraft_sq_a359', true)::bigint, current_setting('flighthub_seed.airline_sq', true)::bigint, 'BUSINESS', 'BUS', 42, 2, 4, 1),
        (current_setting('flighthub_seed.aircraft_sq_a359', true)::bigint, current_setting('flighthub_seed.airline_sq', true)::bigint, 'PREMIUM_ECONOMY', 'PRE', 24, 3, 3, 2),
        (current_setting('flighthub_seed.aircraft_sq_a359', true)::bigint, current_setting('flighthub_seed.airline_sq', true)::bigint, 'ECONOMY', 'ECO', 187, 3, 3, 3),
        (current_setting('flighthub_seed.aircraft_tg_b77w', true)::bigint, current_setting('flighthub_seed.airline_tg', true)::bigint, 'BUSINESS', 'BUS', 42, 2, 4, 1),
        (current_setting('flighthub_seed.aircraft_tg_b77w', true)::bigint, current_setting('flighthub_seed.airline_tg', true)::bigint, 'ECONOMY', 'ECO', 306, 3, 3, 2),
        (current_setting('flighthub_seed.aircraft_cx_a35k', true)::bigint, current_setting('flighthub_seed.airline_cx', true)::bigint, 'BUSINESS', 'BUS', 46, 2, 4, 1),
        (current_setting('flighthub_seed.aircraft_cx_a35k', true)::bigint, current_setting('flighthub_seed.airline_cx', true)::bigint, 'PREMIUM_ECONOMY', 'PRE', 32, 3, 3, 2),
        (current_setting('flighthub_seed.aircraft_cx_a35k', true)::bigint, current_setting('flighthub_seed.airline_cx', true)::bigint, 'ECONOMY', 'ECO', 256, 3, 3, 3),
        (current_setting('flighthub_seed.aircraft_jl_b789', true)::bigint, current_setting('flighthub_seed.airline_jl', true)::bigint, 'FIRST', 'FST', 4, 2, 2, 1),
        (current_setting('flighthub_seed.aircraft_jl_b789', true)::bigint, current_setting('flighthub_seed.airline_jl', true)::bigint, 'BUSINESS', 'BUS', 44, 2, 2, 2),
        (current_setting('flighthub_seed.aircraft_jl_b789', true)::bigint, current_setting('flighthub_seed.airline_jl', true)::bigint, 'PREMIUM_ECONOMY', 'PRE', 35, 2, 3, 3),
        (current_setting('flighthub_seed.aircraft_jl_b789', true)::bigint, current_setting('flighthub_seed.airline_jl', true)::bigint, 'ECONOMY', 'ECO', 156, 3, 3, 4),
        (current_setting('flighthub_seed.aircraft_ek_a388', true)::bigint, current_setting('flighthub_seed.airline_ek', true)::bigint, 'BUSINESS', 'BUS', 42, 2, 4, 1),
        (current_setting('flighthub_seed.aircraft_ek_a388', true)::bigint, current_setting('flighthub_seed.airline_ek', true)::bigint, 'PREMIUM_ECONOMY', 'PRE', 76, 3, 3, 2),
        (current_setting('flighthub_seed.aircraft_ek_a388', true)::bigint, current_setting('flighthub_seed.airline_ek', true)::bigint, 'ECONOMY', 'ECO', 399, 3, 3, 3),
        (current_setting('flighthub_seed.aircraft_qr_a359', true)::bigint, current_setting('flighthub_seed.airline_qr', true)::bigint, 'BUSINESS', 'BUS', 36, 2, 4, 1),
        (current_setting('flighthub_seed.aircraft_qr_a359', true)::bigint, current_setting('flighthub_seed.airline_qr', true)::bigint, 'ECONOMY', 'ECO', 247, 3, 3, 2)
),
normalized_seed AS (
    SELECT
        *,
        left_seats_per_row + right_seats_per_row AS seats_per_row,
        ((target_seats + left_seats_per_row + right_seats_per_row - 1)
            / (left_seats_per_row + right_seats_per_row)) AS total_rows,
        NULLIF(target_seats % (left_seats_per_row + right_seats_per_row), 0) AS seats_in_last_row
    FROM cabin_seed
),
zone_seed AS (
    SELECT
        sm.id AS seat_map_id,
        seed.cabin_name || ' primary zone' AS name,
        1 AS start_row,
        seed.total_rows AS end_row,
        seed.left_seats_per_row,
        seed.right_seats_per_row,
        seed.seats_in_last_row,
        seed.display_order
    FROM normalized_seed seed
    JOIN cabin_classes cabin ON cabin.aircraft_id = seed.aircraft_id AND cabin.code = seed.code
    JOIN seat_maps sm ON sm.cabin_class_id = cabin.id
)
INSERT INTO seat_map_zones (
    seat_map_id,
    name,
    start_row,
    end_row,
    left_seats_per_row,
    right_seats_per_row,
    seats_in_last_row,
    display_order
)
SELECT
    seat_map_id,
    name,
    start_row,
    end_row,
    left_seats_per_row,
    right_seats_per_row,
    seats_in_last_row,
    display_order
FROM zone_seed seed
ON CONFLICT (seat_map_id, start_row, end_row) DO UPDATE SET
    name = EXCLUDED.name,
    left_seats_per_row = EXCLUDED.left_seats_per_row,
    right_seats_per_row = EXCLUDED.right_seats_per_row,
    seats_in_last_row = EXCLUDED.seats_in_last_row,
    display_order = EXCLUDED.display_order;

DO $$
DECLARE
    zone_record RECORD;
    row_number integer;
    column_number integer;
    seats_in_row integer;
    seat_letter text;
    seat_type_value text;
BEGIN
    FOR zone_record IN
        SELECT z.*, sm.cabin_class_id
        FROM seat_map_zones z
        JOIN seat_maps sm ON sm.id = z.seat_map_id
        WHERE NOT EXISTS (SELECT 1 FROM seats s WHERE s.seat_map_id = z.seat_map_id)
        ORDER BY z.seat_map_id, z.display_order, z.start_row
    LOOP
        FOR row_number IN zone_record.start_row..zone_record.end_row LOOP
            seats_in_row := CASE
                WHEN row_number = zone_record.end_row AND zone_record.seats_in_last_row IS NOT NULL
                    THEN zone_record.seats_in_last_row
                ELSE zone_record.left_seats_per_row + zone_record.right_seats_per_row
            END;

            FOR column_number IN 0..(seats_in_row - 1) LOOP
                seat_letter := chr(65 + column_number);
                seat_type_value := CASE
                    WHEN column_number = 0 OR column_number = seats_in_row - 1 THEN 'WINDOW'
                    WHEN column_number = zone_record.left_seats_per_row - 1
                      OR column_number = zone_record.left_seats_per_row THEN 'AISLE'
                    ELSE 'MIDDLE'
                END;

                INSERT INTO seats (
                    seat_number,
                    seat_row,
                    column_letter,
                    seat_type,
                    base_price,
                    premium_surcharge,
                    is_available,
                    is_blocked,
                    is_emergency_exit,
                    is_active,
                    has_extra_legroom,
                    has_bassinet,
                    is_near_lavatory,
                    is_near_galley,
                    has_power_outlet,
                    has_tv_screen,
                    is_wheelchair_accessible,
                    has_extra_width,
                    seat_pitch,
                    seat_width,
                    recline_angle,
                    seat_map_id,
                    cabin_class_id,
                    created_at,
                    updated_at,
                    version
                )
                VALUES (
                    row_number::text || seat_letter,
                    row_number,
                    seat_letter,
                    seat_type_value,
                    0,
                    CASE seat_type_value WHEN 'WINDOW' THEN 8 WHEN 'AISLE' THEN 5 ELSE 0 END,
                    true,
                    false,
                    row_number IN (1, 12, 24),
                    true,
                    row_number IN (1, 12, 24),
                    row_number = 1,
                    row_number = zone_record.end_row,
                    row_number = 1,
                    true,
                    false,
                    false,
                    false,
                    NULL,
                    NULL,
                    NULL,
                    zone_record.seat_map_id,
                    zone_record.cabin_class_id,
                    NOW(),
                    NOW(),
                    0
                )
                ON CONFLICT (seat_map_id, seat_number) DO NOTHING;
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

SELECT setval(pg_get_serial_sequence('cabin_classes', 'id'), COALESCE((SELECT MAX(id) FROM cabin_classes), 1), true);
SELECT setval(pg_get_serial_sequence('seat_maps', 'id'), COALESCE((SELECT MAX(id) FROM seat_maps), 1), true);
SELECT setval(pg_get_serial_sequence('seat_map_zones', 'id'), COALESCE((SELECT MAX(id) FROM seat_map_zones), 1), true);
SELECT setval(pg_get_serial_sequence('seats', 'id'), COALESCE((SELECT MAX(id) FROM seats), 1), true);

COMMIT;
