\set ON_ERROR_STOP on

DO $$
BEGIN
    IF (SELECT count(*) FROM fares) < 8 THEN
        RAISE EXCEPTION 'Pricing verification failed: expected at least 8 fares';
    END IF;

    IF EXISTS (
        SELECT flight_id, cabin_class_id, name
        FROM fares
        GROUP BY flight_id, cabin_class_id, name
        HAVING count(*) > 1
    ) THEN
        RAISE EXCEPTION 'Pricing verification failed: duplicate Fare natural key';
    END IF;

    IF EXISTS (
        SELECT 1 FROM fares
        WHERE base_fare <= 0
           OR current_price < base_fare
           OR airline_id IS NULL
           OR flight_id IS NULL
           OR cabin_class_id IS NULL
    ) THEN
        RAISE EXCEPTION 'Pricing verification failed: invalid Fare amount or reference';
    END IF;

    IF EXISTS (
        SELECT fare_id FROM fare_rules GROUP BY fare_id HAVING count(*) > 1
    ) THEN
        RAISE EXCEPTION 'Pricing verification failed: Fare has multiple Fare Rules';
    END IF;

    IF EXISTS (
        SELECT 1 FROM fare_rules
        WHERE airline_id IS NULL
           OR change_fee < 0
           OR cancellation_fee < 0
           OR change_deadline_hours < 0
           OR refund_deadline_days < 0
           OR (is_refundable = false AND (cancellation_fee IS NOT NULL OR refund_deadline_days IS NOT NULL))
           OR (is_changeable = false AND (change_fee IS NOT NULL OR change_deadline_hours IS NOT NULL))
    ) THEN
        RAISE EXCEPTION 'Pricing verification failed: invalid Fare Rule policy';
    END IF;

    IF EXISTS (
        SELECT fare_id FROM baggage_policies GROUP BY fare_id HAVING count(*) > 1
    ) THEN
        RAISE EXCEPTION 'Pricing verification failed: Fare has multiple Baggage Policies';
    END IF;

    IF EXISTS (
        SELECT 1 FROM baggage_policies
        WHERE airline_id IS NULL
           OR cabin_baggage_max_weight < 0
           OR cabin_baggage_pieces < 0
           OR check_in_baggage_max_weight < 0
           OR check_in_baggage_pieces < 0
    ) THEN
        RAISE EXCEPTION 'Pricing verification failed: invalid Baggage Policy';
    END IF;
END $$;

SELECT
    (SELECT count(*) FROM fares) AS fares,
    (SELECT count(*) FROM fare_rules) AS fare_rules,
    (SELECT count(*) FROM baggage_policies) AS baggage_policies;
