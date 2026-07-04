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

CREATE TABLE IF NOT EXISTS coupons (
    id bigserial PRIMARY KEY,
    airline_id bigint NOT NULL,
    code varchar(32) NOT NULL,
    description varchar(500) NOT NULL,
    discount_type varchar(20) NOT NULL,
    discount_value double precision NOT NULL,
    min_purchase_amount double precision,
    max_discount_amount double precision,
    valid_from timestamp with time zone NOT NULL,
    valid_until timestamp with time zone NOT NULL,
    usage_limit integer NOT NULL,
    per_user_limit integer NOT NULL,
    used_count integer NOT NULL DEFAULT 0,
    status varchar(20) NOT NULL DEFAULT 'ACTIVE',
    created_at timestamp with time zone NOT NULL DEFAULT NOW(),
    updated_at timestamp with time zone NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_coupons_airline_code UNIQUE (airline_id, code),
    CONSTRAINT chk_coupons_discount_type CHECK (discount_type IN ('PERCENTAGE', 'FIXED_AMOUNT')),
    CONSTRAINT chk_coupons_status CHECK (status IN ('ACTIVE', 'INACTIVE')),
    CONSTRAINT chk_coupons_usage_limit CHECK (usage_limit >= 1),
    CONSTRAINT chk_coupons_per_user_limit CHECK (per_user_limit >= 1)
);

CREATE TABLE IF NOT EXISTS coupon_cabin_classes (
    coupon_id bigint NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    cabin_class varchar(30) NOT NULL
);

CREATE TABLE IF NOT EXISTS coupon_routes (
    coupon_id bigint NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    route_id bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS coupon_redemptions (
    id bigserial PRIMARY KEY,
    coupon_id bigint NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    airline_id bigint NOT NULL,
    user_id bigint NOT NULL,
    booking_id bigint NOT NULL,
    code varchar(32) NOT NULL,
    redeemed_at timestamp with time zone NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_coupon_redemptions_booking UNIQUE (coupon_id, booking_id)
);

CREATE INDEX IF NOT EXISTS idx_coupons_airline_status ON coupons (airline_id, status);
CREATE INDEX IF NOT EXISTS idx_coupons_validity ON coupons (valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user
    ON coupon_redemptions (coupon_id, user_id);

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
    (current_setting('flighthub_seed.flight_vn218', true)::bigint, current_setting('flighthub_seed.cabin_vn_b789_eco', true)::bigint, 'ECONOMY', current_setting('flighthub_seed.airline_vn', true)::bigint, 'Economy Saver', 'Q', 44, 7.2, 2.8, 'Evening saver', false, true, true, false, false, true, false, false, 'Economy Saver Conditions', false, NULL, NULL, true, 12, 24, 10, 1, 20, 1, false),
    (current_setting('flighthub_seed.flight_vn136', true)::bigint, current_setting('flighthub_seed.cabin_vn_a359_eco', true)::bigint, 'ECONOMY', current_setting('flighthub_seed.airline_vn', true)::bigint, 'Economy Basic', 'K', 34, 6.6, 2.4, 'Domestic basic', false, false, true, false, false, true, false, false, 'Economy Basic Conditions', false, NULL, NULL, true, 9, 24, 7, 1, 20, 1, false),
    (current_setting('flighthub_seed.flight_vn135', true)::bigint, current_setting('flighthub_seed.cabin_vn_a359_eco', true)::bigint, 'ECONOMY', current_setting('flighthub_seed.airline_vn', true)::bigint, 'Economy Basic', 'K', 34, 6.6, 2.4, 'Domestic basic', false, false, true, false, false, true, false, false, 'Economy Basic Conditions', false, NULL, NULL, true, 9, 24, 7, 1, 20, 1, false),
    (current_setting('flighthub_seed.flight_vj122', true)::bigint, current_setting('flighthub_seed.cabin_vj_a321_eco', true)::bigint, 'ECONOMY', current_setting('flighthub_seed.airline_vj', true)::bigint, 'Eco Saver', 'S', 27.6, 6.4, 2.4, 'Lowest fare', false, false, false, false, false, false, false, false, 'Eco Saver Conditions', false, NULL, NULL, true, 14, 24, 7, 1, 0, 0, false),
    (current_setting('flighthub_seed.flight_vj122', true)::bigint, current_setting('flighthub_seed.cabin_vj_a321_pre', true)::bigint, 'PREMIUM_ECONOMY', current_setting('flighthub_seed.airline_vj', true)::bigint, 'SkyBoss', 'P', 84, 8.8, 3.6, 'Priority bundle', true, true, true, true, true, true, false, true, 'SkyBoss Conditions', true, 10, 2, true, 0, 8, 10, 1, 30, 1, true),
    (current_setting('flighthub_seed.flight_vj123', true)::bigint, current_setting('flighthub_seed.cabin_vj_a321_eco', true)::bigint, 'ECONOMY', current_setting('flighthub_seed.airline_vj', true)::bigint, 'Eco Plus', 'V', 30, 6.4, 2.4, 'Late flight deal', false, false, false, false, false, false, false, false, 'Eco Plus Conditions', false, NULL, NULL, true, 14, 24, 7, 1, 0, 0, false),
    (current_setting('flighthub_seed.flight_vj803', true)::bigint, current_setting('flighthub_seed.cabin_vj_a321_eco', true)::bigint, 'ECONOMY', current_setting('flighthub_seed.airline_vj', true)::bigint, 'Eco Asia', 'T', 54, 9.6, 3.2, 'Regional saver', false, false, true, false, false, false, false, false, 'Eco Asia Conditions', false, NULL, NULL, true, 16, 24, 7, 1, 20, 1, false),
    (current_setting('flighthub_seed.flight_vj804', true)::bigint, current_setting('flighthub_seed.cabin_vj_a321_eco', true)::bigint, 'ECONOMY', current_setting('flighthub_seed.airline_vj', true)::bigint, 'Eco Asia', 'T', 54, 9.6, 3.2, 'Regional saver', false, false, true, false, false, false, false, false, 'Eco Asia Conditions', false, NULL, NULL, true, 16, 24, 7, 1, 20, 1, false),
    (current_setting('flighthub_seed.flight_ak520', true)::bigint, current_setting('flighthub_seed.cabin_ak_a320_eco', true)::bigint, 'ECONOMY', current_setting('flighthub_seed.airline_ak', true)::bigint, 'Low Fare', 'L', 47, 8.2, 2.8, 'Low fare', false, false, false, false, false, false, false, false, 'Low Fare Conditions', false, NULL, NULL, true, 18, 24, 7, 1, 20, 1, false),
    (current_setting('flighthub_seed.flight_ak521', true)::bigint, current_setting('flighthub_seed.cabin_ak_a320_eco', true)::bigint, 'ECONOMY', current_setting('flighthub_seed.airline_ak', true)::bigint, 'Low Fare', 'L', 47, 8.2, 2.8, 'Low fare', false, false, false, false, false, false, false, false, 'Low Fare Conditions', false, NULL, NULL, true, 18, 24, 7, 1, 20, 1, false),
    (current_setting('flighthub_seed.flight_sq185', true)::bigint, current_setting('flighthub_seed.cabin_sq_a359_eco', true)::bigint, 'ECONOMY', current_setting('flighthub_seed.airline_sq', true)::bigint, 'Economy Value', 'V', 114, 16.8, 5.2, 'Value economy', false, true, true, false, true, true, true, false, 'Economy Value Conditions', true, 36, 5, true, 22, 24, 10, 1, 25, 1, false),
    (current_setting('flighthub_seed.flight_sq185', true)::bigint, current_setting('flighthub_seed.cabin_sq_a359_bus', true)::bigint, 'BUSINESS', current_setting('flighthub_seed.airline_sq', true)::bigint, 'Business Advantage', 'D', 392, 26, 10, 'Business advantage', true, true, true, true, true, true, true, true, 'Business Advantage Conditions', true, 0, 1, true, 0, 4, 14, 2, 40, 2, true),
    (current_setting('flighthub_seed.flight_sq186', true)::bigint, current_setting('flighthub_seed.cabin_sq_a359_eco', true)::bigint, 'ECONOMY', current_setting('flighthub_seed.airline_sq', true)::bigint, 'Economy Value', 'V', 114, 16.8, 5.2, 'Value economy', false, true, true, false, true, true, true, false, 'Economy Value Conditions', true, 36, 5, true, 22, 24, 10, 1, 25, 1, false),
    (current_setting('flighthub_seed.flight_tg551', true)::bigint, current_setting('flighthub_seed.cabin_tg_b77w_eco', true)::bigint, 'ECONOMY', current_setting('flighthub_seed.airline_tg', true)::bigint, 'Economy Classic', 'W', 76, 12, 4, 'Classic economy', false, true, true, false, true, true, false, false, 'Economy Classic Conditions', true, 28, 4, true, 18, 24, 10, 1, 25, 1, false),
    (current_setting('flighthub_seed.flight_tg550', true)::bigint, current_setting('flighthub_seed.cabin_tg_b77w_eco', true)::bigint, 'ECONOMY', current_setting('flighthub_seed.airline_tg', true)::bigint, 'Economy Classic', 'W', 76, 12, 4, 'Classic economy', false, true, true, false, true, true, false, false, 'Economy Classic Conditions', true, 28, 4, true, 18, 24, 10, 1, 25, 1, false),
    (current_setting('flighthub_seed.flight_cx764', true)::bigint, current_setting('flighthub_seed.cabin_cx_a35k_eco', true)::bigint, 'ECONOMY', current_setting('flighthub_seed.airline_cx', true)::bigint, 'Economy Essential', 'E', 138, 18, 6, 'Essential economy', false, true, true, false, true, true, true, false, 'Economy Essential Conditions', true, 40, 5, true, 24, 24, 10, 1, 25, 1, false),
    (current_setting('flighthub_seed.flight_cx765', true)::bigint, current_setting('flighthub_seed.cabin_cx_a35k_eco', true)::bigint, 'ECONOMY', current_setting('flighthub_seed.airline_cx', true)::bigint, 'Economy Essential', 'E', 138, 18, 6, 'Essential economy', false, true, true, false, true, true, true, false, 'Economy Essential Conditions', true, 40, 5, true, 24, 24, 10, 1, 25, 1, false);

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

CREATE TEMP TABLE seed_pricing_coupons (
    airline_id bigint NOT NULL,
    code varchar(32) NOT NULL,
    description varchar(500) NOT NULL,
    discount_type varchar(20) NOT NULL,
    discount_value double precision NOT NULL,
    min_purchase_amount double precision,
    max_discount_amount double precision,
    valid_from timestamp with time zone NOT NULL,
    valid_until timestamp with time zone NOT NULL,
    usage_limit integer NOT NULL,
    per_user_limit integer NOT NULL,
    status varchar(20) NOT NULL,
    cabin_classes varchar(30)[],
    route_ids bigint[],
    PRIMARY KEY (airline_id, code)
) ON COMMIT DROP;

INSERT INTO seed_pricing_coupons VALUES
    (current_setting('flighthub_seed.airline_vn', true)::bigint, 'VNWELCOME10', '10% launch discount for Vietnam Airlines economy bookings.', 'PERCENTAGE', 10, 40, 20, NOW() - INTERVAL '1 day', NOW() + INTERVAL '90 days', 500, 1, 'ACTIVE', ARRAY['ECONOMY'], ARRAY[]::bigint[]),
    (current_setting('flighthub_seed.airline_vn', true)::bigint, 'VNFLEX25', 'USD 25 off premium bookings with flexible fares.', 'FIXED_AMOUNT', 25, 120, NULL, NOW() - INTERVAL '1 day', NOW() + INTERVAL '60 days', 250, 1, 'ACTIVE', ARRAY['PREMIUM_ECONOMY','BUSINESS'], ARRAY[]::bigint[]),
    (current_setting('flighthub_seed.airline_vj', true)::bigint, 'VJLOWFARE', 'Vietjet low fare campaign for selected economy trips.', 'PERCENTAGE', 8, 30, 12, NOW() - INTERVAL '1 day', NOW() + INTERVAL '75 days', 700, 1, 'ACTIVE', ARRAY['ECONOMY'], ARRAY[]::bigint[]),
    (current_setting('flighthub_seed.airline_ak', true)::bigint, 'AIRASIA15', 'AirAsia regional saver coupon.', 'PERCENTAGE', 15, 45, 18, NOW() - INTERVAL '1 day', NOW() + INTERVAL '45 days', 400, 1, 'ACTIVE', ARRAY['ECONOMY'], ARRAY[]::bigint[]),
    (current_setting('flighthub_seed.airline_sq', true)::bigint, 'SQPREMIUM30', 'Singapore Airlines premium cabin promotion.', 'FIXED_AMOUNT', 30, 160, NULL, NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 days', 120, 1, 'ACTIVE', ARRAY['BUSINESS'], ARRAY[]::bigint[]);

UPDATE coupons existing
SET
    description = seed.description,
    discount_type = seed.discount_type,
    discount_value = seed.discount_value,
    min_purchase_amount = seed.min_purchase_amount,
    max_discount_amount = seed.max_discount_amount,
    valid_from = seed.valid_from,
    valid_until = seed.valid_until,
    usage_limit = seed.usage_limit,
    per_user_limit = seed.per_user_limit,
    status = seed.status,
    updated_at = NOW()
FROM seed_pricing_coupons seed
WHERE existing.airline_id = seed.airline_id
  AND existing.code = seed.code;

INSERT INTO coupons (
    airline_id, code, description, discount_type, discount_value,
    min_purchase_amount, max_discount_amount, valid_from, valid_until,
    usage_limit, per_user_limit, used_count, status, created_at, updated_at
)
SELECT
    seed.airline_id, seed.code, seed.description, seed.discount_type, seed.discount_value,
    seed.min_purchase_amount, seed.max_discount_amount, seed.valid_from, seed.valid_until,
    seed.usage_limit, seed.per_user_limit, 0, seed.status, NOW(), NOW()
FROM seed_pricing_coupons seed
WHERE NOT EXISTS (
    SELECT 1 FROM coupons existing
    WHERE existing.airline_id = seed.airline_id
      AND existing.code = seed.code
);

DELETE FROM coupon_cabin_classes classes
USING coupons coupon, seed_pricing_coupons seed
WHERE classes.coupon_id = coupon.id
  AND coupon.airline_id = seed.airline_id
  AND coupon.code = seed.code;

INSERT INTO coupon_cabin_classes (coupon_id, cabin_class)
SELECT coupon.id, cabin_class
FROM seed_pricing_coupons seed
JOIN coupons coupon ON coupon.airline_id = seed.airline_id AND coupon.code = seed.code
CROSS JOIN LATERAL unnest(seed.cabin_classes) AS cabin_class;

DELETE FROM coupon_routes routes
USING coupons coupon, seed_pricing_coupons seed
WHERE routes.coupon_id = coupon.id
  AND coupon.airline_id = seed.airline_id
  AND coupon.code = seed.code;

INSERT INTO coupon_routes (coupon_id, route_id)
SELECT coupon.id, route_id
FROM seed_pricing_coupons seed
JOIN coupons coupon ON coupon.airline_id = seed.airline_id AND coupon.code = seed.code
CROSS JOIN LATERAL unnest(seed.route_ids) AS route_id;

COMMIT;
