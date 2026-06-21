-- Convert ancillary and meal catalog rows explicitly denominated in VND to USD.
-- USD and other currencies are left unchanged. Safe to run repeatedly.

BEGIN;

UPDATE flight_cabin_ancillaries
SET price = ROUND((price / 25000.0)::numeric, 2),
    currency = 'USD'
WHERE UPPER(BTRIM(currency)) = 'VND';

UPDATE flight_meals
SET price = ROUND((price / 25000.0)::numeric, 2),
    currency = 'USD'
WHERE UPPER(BTRIM(currency)) = 'VND';

UPDATE insurance_coverages
SET coverage_amount = ROUND((coverage_amount / 25000.0)::numeric, 2),
    currency = 'USD'
WHERE UPPER(BTRIM(currency)) = 'VND';

COMMIT;
