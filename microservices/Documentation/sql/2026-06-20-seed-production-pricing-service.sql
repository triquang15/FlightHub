-- Production-style pricing-service seed data.
-- Safe to re-run by the Fare natural key (flight_id, cabin_class_id, name).
-- Run through scripts/seed-production-demo-data-internal.sh so cross-service
-- Flight, Cabin Class, and Airline IDs are resolved first.

DO $$
BEGIN
    IF current_setting('flighthub_seed.flight_vn210', true) IS NULL
       OR current_setting('flighthub_seed.cabin_vn_a359_eco', true) IS NULL THEN
        RAISE EXCEPTION 'Missing Pricing seed context. Run the production demo seed workflow.';
    END IF;
END $$;

BEGIN;

ALTER TABLE fares ADD COLUMN IF NOT EXISTS airline_id bigint;
ALTER TABLE fares ADD COLUMN IF NOT EXISTS currency varchar(3) NOT NULL DEFAULT 'USD';

CREATE TEMP TABLE seed_pricing_fares (
    flight_id bigint NOT NULL,
    cabin_class_id bigint NOT NULL,
    cabin_class varchar(20) NOT NULL,
    airline_id bigint NOT NULL,
    fare_name varchar(255) NOT NULL,
    rbd_code char(1) NOT NULL,
    base_fare double precision NOT NULL,
    taxes_and_fees double precision NOT NULL,
    airline_fees double precision NOT NULL,
    fare_label varchar(100) NOT NULL,
    extra_seat_space boolean NOT NULL,
    preferred_seat_choice boolean NOT NULL,
    advance_seat_selection boolean NOT NULL,
    priority_boarding boolean NOT NULL,
    priority_checkin boolean NOT NULL,
    complimentary_meals boolean NOT NULL,
    in_flight_internet boolean NOT NULL,
    lounge_access boolean NOT NULL,
    rule_name varchar(255) NOT NULL,
    is_refundable boolean NOT NULL,
    cancellation_fee double precision,
    refund_deadline_days integer,
    is_changeable boolean NOT NULL,
    change_fee double precision,
    change_deadline_hours integer,
    cabin_baggage_weight double precision NOT NULL,
    cabin_baggage_pieces integer NOT NULL,
    checked_baggage_weight double precision NOT NULL,
    checked_baggage_pieces integer NOT NULL,
    priority_baggage boolean NOT NULL,
    PRIMARY KEY (flight_id, cabin_class_id, fare_name)
) ON COMMIT DROP;

INSERT INTO seed_pricing_fares VALUES
    (current_setting('flighthub_seed.flight_vn210', true)::bigint, current_setting('flighthub_seed.cabin_vn_a359_eco', true)::bigint, 'ECONOMY', current_setting('flighthub_seed.airline_vn', true)::bigint, 'Economy Lite', 'L', 38, 7.2, 2.8, 'Best value', false, false, false, false, false, true, false, false, 'Economy Lite Conditions', false, NULL, NULL, false, NULL, NULL, 7, 1, 0, 0, false),
    (current_setting('flighthub_seed.flight_vn210', true)::bigint, current_setting('flighthub_seed.cabin_vn_a359_eco', true)::bigint, 'ECONOMY', current_setting('flighthub_seed.airline_vn', true)::bigint, 'Economy Flex', 'Y', 58, 7.2, 2.8, 'Flexible economy', false, true, true, true, true, true, false, false, 'Economy Flex Conditions', true, 12, 2, true, 8, 12, 10, 1, 23, 1, true),
    (current_setting('flighthub_seed.flight_vn210', true)::bigint, current_setting('flighthub_seed.cabin_vn_a359_bus', true)::bigint, 'BUSINESS', current_setting('flighthub_seed.airline_vn', true)::bigint, 'Business Flex', 'J', 168, 14, 6, 'Business flexibility', true, true, true, true, true, true, true, true, 'Business Flex Conditions', true, 0, 1, true, 0, 6, 14, 2, 32, 2, true),
    (current_setting('flighthub_seed.flight_vn211', true)::bigint, current_setting('flighthub_seed.cabin_vn_b789_eco', true)::bigint, 'ECONOMY', current_setting('flighthub_seed.airline_vn', true)::bigint, 'Economy Standard', 'M', 50, 7.2, 2.8, 'Standard economy', false, true, true, false, false, true, false, false, 'Economy Standard Conditions', true, 18, 3, true, 10, 24, 10, 1, 23, 1, false),
    (current_setting('flighthub_seed.flight_vj122', true)::bigint, current_setting('flighthub_seed.cabin_vj_a321_eco', true)::bigint, 'ECONOMY', current_setting('flighthub_seed.airline_vj', true)::bigint, 'Eco Saver', 'S', 27.6, 6.4, 2.4, 'Lowest fare', false, false, false, false, false, false, false, false, 'Eco Saver Conditions', false, NULL, NULL, true, 14, 24, 7, 1, 0, 0, false),
    (current_setting('flighthub_seed.flight_vj122', true)::bigint, current_setting('flighthub_seed.cabin_vj_a321_pre', true)::bigint, 'PREMIUM_ECONOMY', current_setting('flighthub_seed.airline_vj', true)::bigint, 'SkyBoss', 'P', 84, 8.8, 3.6, 'Priority bundle', true, true, true, true, true, true, false, true, 'SkyBoss Conditions', true, 10, 2, true, 0, 8, 10, 1, 30, 1, true),
    (current_setting('flighthub_seed.flight_sq185', true)::bigint, current_setting('flighthub_seed.cabin_sq_a359_eco', true)::bigint, 'ECONOMY', current_setting('flighthub_seed.airline_sq', true)::bigint, 'Economy Value', 'V', 114, 16.8, 5.2, 'Value economy', false, true, true, false, true, true, true, false, 'Economy Value Conditions', true, 36, 5, true, 22, 24, 10, 1, 25, 1, false),
    (current_setting('flighthub_seed.flight_sq185', true)::bigint, current_setting('flighthub_seed.cabin_sq_a359_bus', true)::bigint, 'BUSINESS', current_setting('flighthub_seed.airline_sq', true)::bigint, 'Business Advantage', 'D', 392, 26, 10, 'Business advantage', true, true, true, true, true, true, true, true, 'Business Advantage Conditions', true, 0, 1, true, 0, 4, 14, 2, 40, 2, true);

UPDATE fares existing
SET
    airline_id = seed.airline_id,
    rbd_code = seed.rbd_code,
    cabin_class = seed.cabin_class,
    base_fare = seed.base_fare,
    taxes_and_fees = seed.taxes_and_fees,
    airline_fees = seed.airline_fees,
    current_price = seed.base_fare + seed.taxes_and_fees + seed.airline_fees,
    currency = 'USD',
    fare_label = seed.fare_label,
    extra_seat_space = seed.extra_seat_space,
    preferred_seat_choice = seed.preferred_seat_choice,
    advance_seat_selection = seed.advance_seat_selection,
    priority_boarding = seed.priority_boarding,
    priority_checkin = seed.priority_checkin,
    complimentary_meals = seed.complimentary_meals,
    in_flight_internet = seed.in_flight_internet,
    lounge_access = seed.lounge_access,
    updated_at = NOW()
FROM seed_pricing_fares seed
WHERE existing.flight_id = seed.flight_id
  AND existing.cabin_class_id = seed.cabin_class_id
  AND existing.name = seed.fare_name;

INSERT INTO fares (
    name, rbd_code, airline_id, flight_id, cabin_class_id, cabin_class,
    currency, base_fare, taxes_and_fees, airline_fees, current_price, fare_label,
    extra_seat_space, preferred_seat_choice, advance_seat_selection, guaranteed_seat_together,
    priority_boarding, priority_checkin, fast_track_security,
    complimentary_meals, premium_meal_choice, in_flight_internet,
    in_flight_entertainment, complimentary_beverages,
    free_date_change, partial_refund, full_refund, lounge_access, airport_transfer,
    created_at, updated_at
)
SELECT
    seed.fare_name, seed.rbd_code, seed.airline_id, seed.flight_id, seed.cabin_class_id, seed.cabin_class,
    'USD', seed.base_fare, seed.taxes_and_fees, seed.airline_fees,
    seed.base_fare + seed.taxes_and_fees + seed.airline_fees, seed.fare_label,
    seed.extra_seat_space, seed.preferred_seat_choice, seed.advance_seat_selection, false,
    seed.priority_boarding, seed.priority_checkin, false,
    seed.complimentary_meals, false, seed.in_flight_internet,
    true, true,
    seed.is_changeable AND seed.change_fee = 0,
    seed.is_refundable, seed.is_refundable AND seed.cancellation_fee = 0,
    seed.lounge_access, false,
    NOW(), NOW()
FROM seed_pricing_fares seed
WHERE NOT EXISTS (
    SELECT 1 FROM fares existing
    WHERE existing.flight_id = seed.flight_id
      AND existing.cabin_class_id = seed.cabin_class_id
      AND existing.name = seed.fare_name
);

ALTER TABLE fares ALTER COLUMN airline_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fares_airline_id ON fares (airline_id);

UPDATE fare_rules existing
SET
    rule_name = seed.rule_name,
    airline_id = seed.airline_id,
    is_refundable = seed.is_refundable,
    cancellation_fee = seed.cancellation_fee,
    refund_deadline_days = seed.refund_deadline_days,
    is_changeable = seed.is_changeable,
    change_fee = seed.change_fee,
    change_deadline_hours = seed.change_deadline_hours,
    updated_at = NOW()
FROM seed_pricing_fares seed
JOIN fares fare ON fare.flight_id = seed.flight_id
    AND fare.cabin_class_id = seed.cabin_class_id
    AND fare.name = seed.fare_name
WHERE existing.fare_id = fare.id;

INSERT INTO fare_rules (
    fare_id, rule_name, airline_id, is_refundable, cancellation_fee,
    refund_deadline_days, is_changeable, change_fee, change_deadline_hours,
    created_at, updated_at
)
SELECT
    fare.id, seed.rule_name, seed.airline_id, seed.is_refundable,
    seed.cancellation_fee, seed.refund_deadline_days, seed.is_changeable,
    seed.change_fee, seed.change_deadline_hours, NOW(), NOW()
FROM seed_pricing_fares seed
JOIN fares fare ON fare.flight_id = seed.flight_id
    AND fare.cabin_class_id = seed.cabin_class_id
    AND fare.name = seed.fare_name
WHERE NOT EXISTS (SELECT 1 FROM fare_rules existing WHERE existing.fare_id = fare.id);

UPDATE baggage_policies existing
SET
    name = seed.fare_name || ' Baggage',
    description = 'Production demo allowance for ' || seed.fare_name,
    airline_id = seed.airline_id,
    cabin_baggage_max_weight = seed.cabin_baggage_weight,
    cabin_baggage_pieces = seed.cabin_baggage_pieces,
    cabin_baggage_weight_per_piece = seed.cabin_baggage_weight,
    cabin_baggage_max_dimension = 115,
    check_in_baggage_max_weight = seed.checked_baggage_weight,
    check_in_baggage_pieces = seed.checked_baggage_pieces,
    check_in_baggage_weight_per_piece = seed.checked_baggage_weight,
    free_checked_bags_allowance = seed.checked_baggage_pieces,
    priority_baggage = seed.priority_baggage,
    extra_baggage_allowance = seed.checked_baggage_pieces > 1,
    updated_at = NOW()
FROM seed_pricing_fares seed
JOIN fares fare ON fare.flight_id = seed.flight_id
    AND fare.cabin_class_id = seed.cabin_class_id
    AND fare.name = seed.fare_name
WHERE existing.fare_id = fare.id;

INSERT INTO baggage_policies (
    fare_id, name, description, airline_id,
    cabin_baggage_max_weight, cabin_baggage_pieces,
    cabin_baggage_weight_per_piece, cabin_baggage_max_dimension,
    check_in_baggage_max_weight, check_in_baggage_pieces,
    check_in_baggage_weight_per_piece, free_checked_bags_allowance,
    priority_baggage, extra_baggage_allowance, created_at, updated_at
)
SELECT
    fare.id, seed.fare_name || ' Baggage',
    'Production demo allowance for ' || seed.fare_name, seed.airline_id,
    seed.cabin_baggage_weight, seed.cabin_baggage_pieces,
    seed.cabin_baggage_weight, 115,
    seed.checked_baggage_weight, seed.checked_baggage_pieces,
    seed.checked_baggage_weight, seed.checked_baggage_pieces,
    seed.priority_baggage, seed.checked_baggage_pieces > 1, NOW(), NOW()
FROM seed_pricing_fares seed
JOIN fares fare ON fare.flight_id = seed.flight_id
    AND fare.cabin_class_id = seed.cabin_class_id
    AND fare.name = seed.fare_name
WHERE NOT EXISTS (SELECT 1 FROM baggage_policies existing WHERE existing.fare_id = fare.id);

COMMIT;
