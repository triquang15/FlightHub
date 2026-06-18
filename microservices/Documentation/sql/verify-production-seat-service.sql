\set ON_ERROR_STOP on

DO $$
BEGIN
    IF (SELECT count(*) FROM cabin_classes) < 20 THEN
        RAISE EXCEPTION 'Seat Service verification failed: expected at least 20 cabin classes';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM cabin_classes cc
        LEFT JOIN seat_maps sm ON sm.cabin_class_id = cc.id
        WHERE cc.is_active = true
          AND cc.is_bookable = true
          AND sm.id IS NULL
    ) THEN
        RAISE EXCEPTION 'Seat Service verification failed: bookable cabin without seat map';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM seat_maps sm
        LEFT JOIN seat_map_zones z ON z.seat_map_id = sm.id
        WHERE z.id IS NULL
    ) THEN
        RAISE EXCEPTION 'Seat Service verification failed: seat map without zone definition';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM seat_maps sm
        LEFT JOIN seats s ON s.seat_map_id = sm.id
        JOIN (
            SELECT
                seat_map_id,
                SUM(
                    ((end_row - start_row + 1) * (left_seats_per_row + right_seats_per_row))
                    - CASE
                        WHEN seats_in_last_row IS NULL THEN 0
                        ELSE (left_seats_per_row + right_seats_per_row) - seats_in_last_row
                    END
                ) AS expected_seats
            FROM seat_map_zones
            GROUP BY seat_map_id
        ) zones ON zones.seat_map_id = sm.id
        GROUP BY sm.id, zones.expected_seats
        HAVING count(s.id) <> zones.expected_seats
    ) THEN
        RAISE EXCEPTION 'Seat Service verification failed: generated seat count does not match seat map zones';
    END IF;

    IF EXISTS (
        SELECT seat_map_id, seat_number
        FROM seats
        GROUP BY seat_map_id, seat_number
        HAVING count(*) > 1
    ) THEN
        RAISE EXCEPTION 'Seat Service verification failed: duplicate seat number in a seat map';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM seat_instances
        WHERE (status = 'AVAILABLE' AND is_available = false)
           OR (status = 'BOOKED' AND is_booked = false)
           OR (status = 'HELD' AND hold_expires_at IS NULL)
    ) THEN
        RAISE EXCEPTION 'Seat Service verification failed: invalid seat instance lifecycle flags';
    END IF;
END $$;

SELECT 'seat_service_seed_verified' AS result,
       (SELECT count(*) FROM cabin_classes) AS cabin_classes,
       (SELECT count(*) FROM seat_maps) AS seat_maps,
       (SELECT count(*) FROM seat_map_zones) AS seat_map_zones,
       (SELECT count(*) FROM seats) AS seats,
       (SELECT count(*) FROM seat_instances) AS seat_instances;
