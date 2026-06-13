\set ON_ERROR_STOP on

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM flights WHERE departure_airport_id = arrival_airport_id) THEN
        RAISE EXCEPTION 'Flight Ops verification failed: invalid same-airport route';
    END IF;
    IF EXISTS (
        SELECT flight_id, departure_date_time FROM flight_instances
        GROUP BY flight_id, departure_date_time HAVING count(*) > 1
    ) THEN
        RAISE EXCEPTION 'Flight Ops verification failed: duplicate flight instance natural key';
    END IF;
    IF EXISTS (
        SELECT 1 FROM flight_instances
        WHERE arrival_date_time <= departure_date_time
           OR available_seats < 0
           OR available_seats > total_seats
           OR schedule_id IS NULL
    ) THEN
        RAISE EXCEPTION 'Flight Ops verification failed: invalid instance timing/capacity/schedule';
    END IF;
    IF EXISTS (
        SELECT 1 FROM flight_instances fi
        LEFT JOIN flight_schedules fs ON fs.id = fi.schedule_id
        WHERE fs.id IS NULL OR fs.flight_id <> fi.flight_id
    ) THEN
        RAISE EXCEPTION 'Flight Ops verification failed: instance is linked to the wrong schedule';
    END IF;
END $$;

SELECT 'flight_ops_seed_verified' AS result,
       (SELECT count(*) FROM flights) AS flights,
       (SELECT count(*) FROM flight_schedules) AS schedules,
       (SELECT count(*) FROM flight_instances) AS instances;
