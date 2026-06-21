-- Production-style ancillary-service seed data.
-- Safe to re-run by catalog and assignment natural keys.

DO $$
BEGIN
    IF current_setting('flighthub_seed.flight_vn210', true) IS NULL
       OR current_setting('flighthub_seed.cabin_vn_a359_eco', true) IS NULL
       OR current_setting('flighthub_seed.airline_vn', true) IS NULL THEN
        RAISE EXCEPTION 'Missing Ancillary seed context. Run the production demo seed workflow.';
    END IF;
END $$;

BEGIN;

CREATE TEMP TABLE seed_ancillaries (
    airline_id bigint NOT NULL,
    type varchar(50) NOT NULL,
    sub_type varchar(100) NOT NULL,
    rfisc varchar(10),
    name varchar(200) NOT NULL,
    description varchar(1000),
    display_order integer NOT NULL,
    PRIMARY KEY (airline_id, type, sub_type)
) ON COMMIT DROP;

INSERT INTO seed_ancillaries VALUES
    (current_setting('flighthub_seed.airline_vn')::bigint, 'BAGGAGE', 'EXTRA_10KG', '0CC', 'Extra checked baggage 10 kg', 'One additional 10 kg checked baggage allowance.', 10),
    (current_setting('flighthub_seed.airline_vn')::bigint, 'TRAVEL_PROTECTION', 'FLEX_PROTECT', '0BG', 'Flex travel protection', 'Coverage for common baggage and flight disruption events.', 20),
    (current_setting('flighthub_seed.airline_vj')::bigint, 'BAGGAGE', 'EXTRA_20KG', '0CC', 'Checked baggage 20 kg', 'Prepaid 20 kg checked baggage bundle.', 10),
    (current_setting('flighthub_seed.airline_vj')::bigint, 'TRAVEL_PROTECTION', 'BASIC_PROTECT', '0BG', 'Basic travel protection', 'Essential baggage and trip delay coverage.', 20),
    (current_setting('flighthub_seed.airline_sq')::bigint, 'BAGGAGE', 'EXTRA_15KG', '0CC', 'Extra checked baggage 15 kg', 'One additional 15 kg checked baggage allowance.', 10),
    (current_setting('flighthub_seed.airline_sq')::bigint, 'TRAVEL_PROTECTION', 'PREMIUM_PROTECT', '0BG', 'Premium travel protection', 'Expanded baggage, disruption, and medical emergency coverage.', 20);

UPDATE ancillaries existing
SET rfisc = seed.rfisc,
    name = seed.name,
    description = seed.description,
    display_order = seed.display_order
FROM seed_ancillaries seed
WHERE existing.airline_id = seed.airline_id
  AND existing.type = seed.type
  AND existing.sub_type = seed.sub_type;

INSERT INTO ancillaries (airline_id, type, sub_type, rfisc, name, description, display_order)
SELECT airline_id, type, sub_type, rfisc, name, description, display_order
FROM seed_ancillaries seed
WHERE NOT EXISTS (
    SELECT 1 FROM ancillaries existing
    WHERE existing.airline_id = seed.airline_id
      AND existing.type = seed.type
      AND existing.sub_type = seed.sub_type
);

CREATE TEMP TABLE seed_meals (
    airline_id bigint NOT NULL,
    code varchar(10) NOT NULL,
    name varchar(200) NOT NULL,
    meal_type varchar(50) NOT NULL,
    dietary_restriction varchar(100),
    ingredients varchar(2000),
    requires_advance_booking boolean NOT NULL,
    advance_booking_hours integer,
    display_order integer NOT NULL,
    PRIMARY KEY (airline_id, code)
) ON COMMIT DROP;

INSERT INTO seed_meals VALUES
    (current_setting('flighthub_seed.airline_vn')::bigint, 'VNML', 'Vietnamese signature meal', 'HOT_MEAL', NULL, 'Rice, seasonal vegetables, Vietnamese-style protein', false, NULL, 10),
    (current_setting('flighthub_seed.airline_vn')::bigint, 'VGML', 'Vegetarian meal', 'SPECIAL_MEAL', 'VEGETARIAN', 'Rice, tofu, vegetables, fruit', true, 24, 20),
    (current_setting('flighthub_seed.airline_vj')::bigint, 'HOTM', 'Hot meal combo', 'HOT_MEAL', NULL, 'Rice, protein, vegetables, bottled water', false, NULL, 10),
    (current_setting('flighthub_seed.airline_vj')::bigint, 'VGML', 'Vegetarian hot meal', 'SPECIAL_MEAL', 'VEGETARIAN', 'Rice, vegetables, plant protein', true, 24, 20),
    (current_setting('flighthub_seed.airline_sq')::bigint, 'ASML', 'Singapore flavours meal', 'HOT_MEAL', NULL, 'Rice, vegetables, Singapore-style protein', false, NULL, 10),
    (current_setting('flighthub_seed.airline_sq')::bigint, 'VGML', 'International vegetarian meal', 'SPECIAL_MEAL', 'VEGETARIAN', 'Grains, vegetables, legumes, fruit', true, 24, 20);

UPDATE meals existing
SET name = seed.name,
    meal_type = seed.meal_type,
    dietary_restriction = seed.dietary_restriction,
    ingredients = seed.ingredients,
    available = true,
    requires_advance_booking = seed.requires_advance_booking,
    advance_booking_hours = seed.advance_booking_hours,
    display_order = seed.display_order,
    updated_at = NOW()
FROM seed_meals seed
WHERE existing.airline_id = seed.airline_id AND existing.code = seed.code;

INSERT INTO meals (
    airline_id, code, name, meal_type, dietary_restriction, ingredients,
    available, requires_advance_booking, advance_booking_hours, display_order,
    created_at, updated_at
)
SELECT airline_id, code, name, meal_type, dietary_restriction, ingredients,
       true, requires_advance_booking, advance_booking_hours, display_order, NOW(), NOW()
FROM seed_meals seed
WHERE NOT EXISTS (
    SELECT 1 FROM meals existing
    WHERE existing.airline_id = seed.airline_id AND existing.code = seed.code
);

CREATE TEMP TABLE seed_coverages (
    airline_id bigint NOT NULL,
    ancillary_sub_type varchar(100) NOT NULL,
    coverage_type varchar(255) NOT NULL,
    name varchar(200) NOT NULL,
    description varchar(1000),
    coverage_amount double precision NOT NULL,
    currency varchar(3) NOT NULL,
    claim_condition varchar(500),
    display_order integer NOT NULL,
    PRIMARY KEY (airline_id, ancillary_sub_type, coverage_type)
) ON COMMIT DROP;

INSERT INTO seed_coverages VALUES
    (current_setting('flighthub_seed.airline_vn')::bigint, 'FLEX_PROTECT', 'BAGGAGE_LOSS', 'Baggage loss', 'Reimbursement for eligible permanently lost checked baggage.', 400, 'USD', 'Carrier loss report and supporting receipts required.', 10),
    (current_setting('flighthub_seed.airline_vn')::bigint, 'FLEX_PROTECT', 'TRIP_DELAY', 'Trip delay', 'Eligible expenses after a qualifying flight delay.', 120, 'USD', 'Delay must meet the policy minimum duration.', 20),
    (current_setting('flighthub_seed.airline_vj')::bigint, 'BASIC_PROTECT', 'BAGGAGE_DELAY', 'Baggage delay', 'Essential purchases after qualifying baggage delay.', 60, 'USD', 'Baggage delay report and receipts required.', 10),
    (current_setting('flighthub_seed.airline_vj')::bigint, 'BASIC_PROTECT', 'TRIP_DELAY', 'Trip delay', 'Eligible expenses after a qualifying flight delay.', 60, 'USD', 'Delay must meet the policy minimum duration.', 20),
    (current_setting('flighthub_seed.airline_sq')::bigint, 'PREMIUM_PROTECT', 'BAGGAGE_LOSS', 'Baggage loss', 'Reimbursement for eligible permanently lost checked baggage.', 1500, 'USD', 'Carrier loss report and supporting receipts required.', 10),
    (current_setting('flighthub_seed.airline_sq')::bigint, 'PREMIUM_PROTECT', 'MEDICAL_EMERGENCY', 'Medical emergency', 'Eligible emergency medical expenses during the covered trip.', 50000, 'USD', 'Subject to policy exclusions and medical documentation.', 20);

UPDATE insurance_coverages existing
SET name = seed.name,
    description = seed.description,
    coverage_amount = seed.coverage_amount,
    currency = seed.currency,
    is_flat = true,
    claim_condition = seed.claim_condition,
    display_order = seed.display_order,
    active = true
FROM seed_coverages seed
JOIN ancillaries ancillary ON ancillary.airline_id = seed.airline_id
    AND ancillary.sub_type = seed.ancillary_sub_type
WHERE existing.ancillary_id = ancillary.id
  AND existing.coverage_type = seed.coverage_type;

INSERT INTO insurance_coverages (
    ancillary_id, coverage_type, name, description, coverage_amount, currency,
    is_flat, claim_condition, display_order, active
)
SELECT ancillary.id, seed.coverage_type, seed.name, seed.description,
       seed.coverage_amount, seed.currency, true, seed.claim_condition,
       seed.display_order, true
FROM seed_coverages seed
JOIN ancillaries ancillary ON ancillary.airline_id = seed.airline_id
    AND ancillary.sub_type = seed.ancillary_sub_type
WHERE NOT EXISTS (
    SELECT 1 FROM insurance_coverages existing
    WHERE existing.ancillary_id = ancillary.id
      AND existing.coverage_type = seed.coverage_type
);

CREATE TEMP TABLE seed_flight_ancillaries (
    flight_id bigint NOT NULL,
    cabin_class_id bigint NOT NULL,
    airline_id bigint NOT NULL,
    ancillary_sub_type varchar(100) NOT NULL,
    price double precision NOT NULL,
    currency varchar(3) NOT NULL,
    max_quantity integer,
    included_in_fare boolean NOT NULL,
    PRIMARY KEY (flight_id, cabin_class_id, ancillary_sub_type)
) ON COMMIT DROP;

INSERT INTO seed_flight_ancillaries VALUES
    (current_setting('flighthub_seed.flight_vn210')::bigint, current_setting('flighthub_seed.cabin_vn_a359_eco')::bigint, current_setting('flighthub_seed.airline_vn')::bigint, 'EXTRA_10KG', 14, 'USD', 3, false),
    (current_setting('flighthub_seed.flight_vn210')::bigint, current_setting('flighthub_seed.cabin_vn_a359_eco')::bigint, current_setting('flighthub_seed.airline_vn')::bigint, 'FLEX_PROTECT', 4.8, 'USD', 1, false),
    (current_setting('flighthub_seed.flight_vn210')::bigint, current_setting('flighthub_seed.cabin_vn_a359_bus')::bigint, current_setting('flighthub_seed.airline_vn')::bigint, 'FLEX_PROTECT', 0, 'USD', 1, true),
    (current_setting('flighthub_seed.flight_vn211')::bigint, current_setting('flighthub_seed.cabin_vn_b789_eco')::bigint, current_setting('flighthub_seed.airline_vn')::bigint, 'EXTRA_10KG', 14, 'USD', 3, false),
    (current_setting('flighthub_seed.flight_vj122')::bigint, current_setting('flighthub_seed.cabin_vj_a321_eco')::bigint, current_setting('flighthub_seed.airline_vj')::bigint, 'EXTRA_20KG', 16.8, 'USD', 2, false),
    (current_setting('flighthub_seed.flight_vj122')::bigint, current_setting('flighthub_seed.cabin_vj_a321_pre')::bigint, current_setting('flighthub_seed.airline_vj')::bigint, 'BASIC_PROTECT', 0, 'USD', 1, true),
    (current_setting('flighthub_seed.flight_sq185')::bigint, current_setting('flighthub_seed.cabin_sq_a359_eco')::bigint, current_setting('flighthub_seed.airline_sq')::bigint, 'EXTRA_15KG', 75, 'USD', 3, false),
    (current_setting('flighthub_seed.flight_sq185')::bigint, current_setting('flighthub_seed.cabin_sq_a359_bus')::bigint, current_setting('flighthub_seed.airline_sq')::bigint, 'PREMIUM_PROTECT', 0, 'USD', 1, true);

UPDATE flight_cabin_ancillaries existing
SET available = true,
    price = CASE WHEN seed.included_in_fare THEN 0 ELSE seed.price END,
    currency = seed.currency,
    max_quantity = seed.max_quantity,
    included_in_fare = seed.included_in_fare
FROM seed_flight_ancillaries seed
JOIN ancillaries ancillary ON ancillary.airline_id = seed.airline_id
    AND ancillary.sub_type = seed.ancillary_sub_type
WHERE existing.flight_id = seed.flight_id
  AND existing.cabin_class_id = seed.cabin_class_id
  AND existing.ancillary_id = ancillary.id;

INSERT INTO flight_cabin_ancillaries (
    flight_id, cabin_class_id, ancillary_id, available, max_quantity,
    price, currency, included_in_fare
)
SELECT seed.flight_id, seed.cabin_class_id, ancillary.id, true, seed.max_quantity,
       CASE WHEN seed.included_in_fare THEN 0 ELSE seed.price END,
       seed.currency, seed.included_in_fare
FROM seed_flight_ancillaries seed
JOIN ancillaries ancillary ON ancillary.airline_id = seed.airline_id
    AND ancillary.sub_type = seed.ancillary_sub_type
WHERE NOT EXISTS (
    SELECT 1 FROM flight_cabin_ancillaries existing
    WHERE existing.flight_id = seed.flight_id
      AND existing.cabin_class_id = seed.cabin_class_id
      AND existing.ancillary_id = ancillary.id
);

CREATE TEMP TABLE seed_flight_meals (
    flight_id bigint NOT NULL,
    airline_id bigint NOT NULL,
    meal_code varchar(10) NOT NULL,
    price double precision NOT NULL,
    currency varchar(3) NOT NULL,
    display_order integer NOT NULL,
    PRIMARY KEY (flight_id, airline_id, meal_code)
) ON COMMIT DROP;

INSERT INTO seed_flight_meals VALUES
    (current_setting('flighthub_seed.flight_vn210')::bigint, current_setting('flighthub_seed.airline_vn')::bigint, 'VNML', 0, 'USD', 10),
    (current_setting('flighthub_seed.flight_vn210')::bigint, current_setting('flighthub_seed.airline_vn')::bigint, 'VGML', 3.6, 'USD', 20),
    (current_setting('flighthub_seed.flight_vn211')::bigint, current_setting('flighthub_seed.airline_vn')::bigint, 'VNML', 0, 'USD', 10),
    (current_setting('flighthub_seed.flight_vj122')::bigint, current_setting('flighthub_seed.airline_vj')::bigint, 'HOTM', 3.4, 'USD', 10),
    (current_setting('flighthub_seed.flight_vj122')::bigint, current_setting('flighthub_seed.airline_vj')::bigint, 'VGML', 3.8, 'USD', 20),
    (current_setting('flighthub_seed.flight_sq185')::bigint, current_setting('flighthub_seed.airline_sq')::bigint, 'ASML', 0, 'USD', 10),
    (current_setting('flighthub_seed.flight_sq185')::bigint, current_setting('flighthub_seed.airline_sq')::bigint, 'VGML', 18, 'USD', 20);

UPDATE flight_meals existing
SET available = true,
    price = seed.price,
    currency = seed.currency,
    display_order = seed.display_order
FROM seed_flight_meals seed
JOIN meals meal ON meal.airline_id = seed.airline_id AND meal.code = seed.meal_code
WHERE existing.flight_id = seed.flight_id AND existing.meal_id = meal.id;

INSERT INTO flight_meals (flight_id, meal_id, available, price, currency, display_order)
SELECT seed.flight_id, meal.id, true, seed.price, seed.currency, seed.display_order
FROM seed_flight_meals seed
JOIN meals meal ON meal.airline_id = seed.airline_id AND meal.code = seed.meal_code
WHERE NOT EXISTS (
    SELECT 1 FROM flight_meals existing
    WHERE existing.flight_id = seed.flight_id AND existing.meal_id = meal.id
);

COMMIT;
