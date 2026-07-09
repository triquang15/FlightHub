-- Seed booking-ready seat inventory for demo flight instances.
--
-- Seat maps are static aircraft layouts. Booking needs per-flight inventory:
--   flight_instance_cabins + seat_instances.
-- This mirrors seat-service's FlightInstanceCreatedEventConsumer for SQL-seeded
-- flight instances, where no Kafka event is emitted.

DO $$
BEGIN
    IF current_setting('flighthub_seed.flight_instances_vj122', true) IS NULL THEN
        RAISE EXCEPTION 'Missing seed context. Run this file through scripts/init-production-demo-data.sh.';
    END IF;
END $$;

BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS uk_flight_instance_cabin
    ON flight_instance_cabins (flight_instance_id, cabin_class_id);

CREATE UNIQUE INDEX IF NOT EXISTS uk_seat_instance_flight_instance_seat
    ON seat_instances (flight_instance_id, seat_id);

WITH raw_inventory (
    flight_instance_ids,
    flight_id,
    flight_schedule_id,
    cabin_class_id
) AS (
    VALUES
        (current_setting('flighthub_seed.flight_instances_vn210', true), current_setting('flighthub_seed.flight_vn210', true)::bigint, NULL::bigint, current_setting('flighthub_seed.cabin_vn_a359_eco', true)::bigint),
        (current_setting('flighthub_seed.flight_instances_vn210', true), current_setting('flighthub_seed.flight_vn210', true)::bigint, NULL::bigint, current_setting('flighthub_seed.cabin_vn_a359_bus', true)::bigint),
        (current_setting('flighthub_seed.flight_instances_vn211', true), current_setting('flighthub_seed.flight_vn211', true)::bigint, NULL::bigint, current_setting('flighthub_seed.cabin_vn_b789_eco', true)::bigint),
        (current_setting('flighthub_seed.flight_instances_vn218', true), current_setting('flighthub_seed.flight_vn218', true)::bigint, NULL::bigint, current_setting('flighthub_seed.cabin_vn_b789_eco', true)::bigint),
        (current_setting('flighthub_seed.flight_instances_vn136', true), current_setting('flighthub_seed.flight_vn136', true)::bigint, NULL::bigint, current_setting('flighthub_seed.cabin_vn_a359_eco', true)::bigint),
        (current_setting('flighthub_seed.flight_instances_vn135', true), current_setting('flighthub_seed.flight_vn135', true)::bigint, NULL::bigint, current_setting('flighthub_seed.cabin_vn_a359_eco', true)::bigint),
        (current_setting('flighthub_seed.flight_instances_vj122', true), current_setting('flighthub_seed.flight_vj122', true)::bigint, NULL::bigint, current_setting('flighthub_seed.cabin_vj_a321_eco', true)::bigint),
        (current_setting('flighthub_seed.flight_instances_vj122', true), current_setting('flighthub_seed.flight_vj122', true)::bigint, NULL::bigint, current_setting('flighthub_seed.cabin_vj_a321_pre', true)::bigint),
        (current_setting('flighthub_seed.flight_instances_vj123', true), current_setting('flighthub_seed.flight_vj123', true)::bigint, NULL::bigint, current_setting('flighthub_seed.cabin_vj_a321_eco', true)::bigint),
        (current_setting('flighthub_seed.flight_instances_vj803', true), current_setting('flighthub_seed.flight_vj803', true)::bigint, NULL::bigint, current_setting('flighthub_seed.cabin_vj_a321_eco', true)::bigint),
        (current_setting('flighthub_seed.flight_instances_vj804', true), current_setting('flighthub_seed.flight_vj804', true)::bigint, NULL::bigint, current_setting('flighthub_seed.cabin_vj_a321_eco', true)::bigint),
        (current_setting('flighthub_seed.flight_instances_ak520', true), current_setting('flighthub_seed.flight_ak520', true)::bigint, NULL::bigint, current_setting('flighthub_seed.cabin_ak_a320_eco', true)::bigint),
        (current_setting('flighthub_seed.flight_instances_ak521', true), current_setting('flighthub_seed.flight_ak521', true)::bigint, NULL::bigint, current_setting('flighthub_seed.cabin_ak_a320_eco', true)::bigint),
        (current_setting('flighthub_seed.flight_instances_sq185', true), current_setting('flighthub_seed.flight_sq185', true)::bigint, NULL::bigint, current_setting('flighthub_seed.cabin_sq_a359_eco', true)::bigint),
        (current_setting('flighthub_seed.flight_instances_sq185', true), current_setting('flighthub_seed.flight_sq185', true)::bigint, NULL::bigint, current_setting('flighthub_seed.cabin_sq_a359_bus', true)::bigint),
        (current_setting('flighthub_seed.flight_instances_sq186', true), current_setting('flighthub_seed.flight_sq186', true)::bigint, NULL::bigint, current_setting('flighthub_seed.cabin_sq_a359_eco', true)::bigint),
        (current_setting('flighthub_seed.flight_instances_tg551', true), current_setting('flighthub_seed.flight_tg551', true)::bigint, NULL::bigint, current_setting('flighthub_seed.cabin_tg_b77w_eco', true)::bigint),
        (current_setting('flighthub_seed.flight_instances_tg550', true), current_setting('flighthub_seed.flight_tg550', true)::bigint, NULL::bigint, current_setting('flighthub_seed.cabin_tg_b77w_eco', true)::bigint),
        (current_setting('flighthub_seed.flight_instances_cx764', true), current_setting('flighthub_seed.flight_cx764', true)::bigint, NULL::bigint, current_setting('flighthub_seed.cabin_cx_a35k_eco', true)::bigint),
        (current_setting('flighthub_seed.flight_instances_cx765', true), current_setting('flighthub_seed.flight_cx765', true)::bigint, NULL::bigint, current_setting('flighthub_seed.cabin_cx_a35k_eco', true)::bigint),
        (current_setting('flighthub_seed.flight_instances_vn117', true), current_setting('flighthub_seed.flight_vn117', true)::bigint, NULL::bigint, current_setting('flighthub_seed.cabin_vn_a359_eco', true)::bigint),
        (current_setting('flighthub_seed.flight_instances_vn651', true), current_setting('flighthub_seed.flight_vn651', true)::bigint, NULL::bigint, current_setting('flighthub_seed.cabin_vn_b789_eco', true)::bigint),
        (current_setting('flighthub_seed.flight_instances_vn650', true), current_setting('flighthub_seed.flight_vn650', true)::bigint, NULL::bigint, current_setting('flighthub_seed.cabin_vn_b789_eco', true)::bigint),
        (current_setting('flighthub_seed.flight_instances_vn652', true), current_setting('flighthub_seed.flight_vn652', true)::bigint, NULL::bigint, current_setting('flighthub_seed.cabin_vn_b789_eco', true)::bigint),
        (current_setting('flighthub_seed.flight_instances_vj504', true), current_setting('flighthub_seed.flight_vj504', true)::bigint, NULL::bigint, current_setting('flighthub_seed.cabin_vj_a321_eco', true)::bigint),
        (current_setting('flighthub_seed.flight_instances_vj505', true), current_setting('flighthub_seed.flight_vj505', true)::bigint, NULL::bigint, current_setting('flighthub_seed.cabin_vj_a321_eco', true)::bigint),
        (current_setting('flighthub_seed.flight_instances_ak512', true), current_setting('flighthub_seed.flight_ak512', true)::bigint, NULL::bigint, current_setting('flighthub_seed.cabin_ak_a320_eco', true)::bigint),
        (current_setting('flighthub_seed.flight_instances_ak513', true), current_setting('flighthub_seed.flight_ak513', true)::bigint, NULL::bigint, current_setting('flighthub_seed.cabin_ak_a320_eco', true)::bigint),
        (current_setting('flighthub_seed.flight_instances_sq176', true), current_setting('flighthub_seed.flight_sq176', true)::bigint, NULL::bigint, current_setting('flighthub_seed.cabin_sq_a359_eco', true)::bigint),
        (current_setting('flighthub_seed.flight_instances_sq175', true), current_setting('flighthub_seed.flight_sq175', true)::bigint, NULL::bigint, current_setting('flighthub_seed.cabin_sq_a359_eco', true)::bigint),
        (current_setting('flighthub_seed.flight_instances_tg560', true), current_setting('flighthub_seed.flight_tg560', true)::bigint, NULL::bigint, current_setting('flighthub_seed.cabin_tg_b77w_eco', true)::bigint),
        (current_setting('flighthub_seed.flight_instances_tg561', true), current_setting('flighthub_seed.flight_tg561', true)::bigint, NULL::bigint, current_setting('flighthub_seed.cabin_tg_b77w_eco', true)::bigint),
        (current_setting('flighthub_seed.flight_instances_cx743', true), current_setting('flighthub_seed.flight_cx743', true)::bigint, NULL::bigint, current_setting('flighthub_seed.cabin_cx_a35k_eco', true)::bigint),
        (current_setting('flighthub_seed.flight_instances_cx742', true), current_setting('flighthub_seed.flight_cx742', true)::bigint, NULL::bigint, current_setting('flighthub_seed.cabin_cx_a35k_eco', true)::bigint),
        (current_setting('flighthub_seed.flight_instances_ek393', true), current_setting('flighthub_seed.flight_ek393', true)::bigint, NULL::bigint, current_setting('flighthub_seed.cabin_ek_a388_eco', true)::bigint),
        (current_setting('flighthub_seed.flight_instances_ek392', true), current_setting('flighthub_seed.flight_ek392', true)::bigint, NULL::bigint, current_setting('flighthub_seed.cabin_ek_a388_eco', true)::bigint),
        (current_setting('flighthub_seed.flight_instances_qr971', true), current_setting('flighthub_seed.flight_qr971', true)::bigint, NULL::bigint, current_setting('flighthub_seed.cabin_qr_a359_eco', true)::bigint),
        (current_setting('flighthub_seed.flight_instances_qr970', true), current_setting('flighthub_seed.flight_qr970', true)::bigint, NULL::bigint, current_setting('flighthub_seed.cabin_qr_a359_eco', true)::bigint),
        (current_setting('flighthub_seed.flight_instances_jl752', true), current_setting('flighthub_seed.flight_jl752', true)::bigint, NULL::bigint, current_setting('flighthub_seed.cabin_jl_b789_eco', true)::bigint),
        (current_setting('flighthub_seed.flight_instances_jl751', true), current_setting('flighthub_seed.flight_jl751', true)::bigint, NULL::bigint, current_setting('flighthub_seed.cabin_jl_b789_eco', true)::bigint),
        (current_setting('flighthub_seed.flight_instances_jl753', true), current_setting('flighthub_seed.flight_jl753', true)::bigint, NULL::bigint, current_setting('flighthub_seed.cabin_jl_b789_eco', true)::bigint)
),
selected_inventory AS (
    SELECT
        regexp_split_to_table(raw.flight_instance_ids, ',')::bigint AS flight_instance_id,
        raw.flight_id,
        raw.flight_schedule_id,
        raw.cabin_class_id
    FROM raw_inventory raw
    WHERE NULLIF(raw.flight_instance_ids, '') IS NOT NULL
),
seat_capacity AS (
    SELECT
        cabin.id AS cabin_class_id,
        COUNT(seat.id)::integer AS total_seats
    FROM cabin_classes cabin
    JOIN seat_maps seat_map ON seat_map.cabin_class_id = cabin.id
    JOIN seats seat ON seat.seat_map_id = seat_map.id
    WHERE cabin.is_active = true
      AND cabin.is_bookable = true
      AND seat.is_active = true
      AND seat.is_blocked = false
    GROUP BY cabin.id
),
upserted_flight_cabins AS (
    INSERT INTO flight_instance_cabins (
        flight_instance_id,
        cabin_class_id,
        total_seats,
        booked_seats
    )
    SELECT
        inventory.flight_instance_id,
        inventory.cabin_class_id,
        capacity.total_seats,
        0
    FROM selected_inventory inventory
    JOIN seat_capacity capacity ON capacity.cabin_class_id = inventory.cabin_class_id
    ON CONFLICT (flight_instance_id, cabin_class_id) DO UPDATE SET
        total_seats = EXCLUDED.total_seats,
        booked_seats = (
            SELECT COUNT(*)::integer
            FROM seat_instances existing_seat
            WHERE existing_seat.flight_instance_cabin_id = flight_instance_cabins.id
              AND existing_seat.status IN ('BOOKED', 'OCCUPIED')
        )
    RETURNING id, flight_instance_id, cabin_class_id
)
INSERT INTO seat_instances (
    flight_id,
    flight_instance_cabin_id,
    flight_instance_id,
    seat_id,
    status,
    is_booked,
    is_available,
    fare,
    premium_surcharge,
    flight_schedule_id,
    created_at,
    updated_at,
    version
)
SELECT
    inventory.flight_id,
    flight_cabin.id,
    inventory.flight_instance_id,
    seat.id,
    'AVAILABLE',
    false,
    true,
    COALESCE(seat.base_price, 0),
    COALESCE(seat.premium_surcharge, 0),
    inventory.flight_schedule_id,
    NOW(),
    NOW(),
    0
FROM selected_inventory inventory
JOIN upserted_flight_cabins flight_cabin
  ON flight_cabin.flight_instance_id = inventory.flight_instance_id
 AND flight_cabin.cabin_class_id = inventory.cabin_class_id
JOIN seat_maps seat_map ON seat_map.cabin_class_id = inventory.cabin_class_id
JOIN seats seat ON seat.seat_map_id = seat_map.id
WHERE seat.is_active = true
  AND seat.is_blocked = false
ON CONFLICT (flight_instance_id, seat_id) DO UPDATE SET
    flight_id = EXCLUDED.flight_id,
    flight_instance_cabin_id = EXCLUDED.flight_instance_cabin_id,
    fare = EXCLUDED.fare,
    premium_surcharge = EXCLUDED.premium_surcharge,
    updated_at = NOW(),
    is_booked = CASE
        WHEN seat_instances.status IN ('BOOKED', 'OCCUPIED') THEN true
        ELSE seat_instances.is_booked
    END,
    is_available = CASE
        WHEN seat_instances.status IN ('BOOKED', 'OCCUPIED', 'HELD', 'BLOCKED') THEN false
        ELSE true
    END,
    status = CASE
        WHEN seat_instances.status IN ('BOOKED', 'OCCUPIED', 'HELD', 'BLOCKED') THEN seat_instances.status
        ELSE 'AVAILABLE'
    END;

SELECT setval(pg_get_serial_sequence('flight_instance_cabins', 'id'), COALESCE((SELECT MAX(id) FROM flight_instance_cabins), 1), true);
SELECT setval(pg_get_serial_sequence('seat_instances', 'id'), COALESCE((SELECT MAX(id) FROM seat_instances), 1), true);

COMMIT;
