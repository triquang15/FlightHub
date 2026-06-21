\set ON_ERROR_STOP on

BEGIN;

ALTER TABLE flight_meals ADD COLUMN IF NOT EXISTS currency VARCHAR(3);
UPDATE flight_meals SET currency = 'USD' WHERE currency IS NULL OR BTRIM(currency) = '';
ALTER TABLE flight_meals ALTER COLUMN currency SET NOT NULL;

UPDATE flight_cabin_ancillaries SET price = 0 WHERE included_in_fare = TRUE;
UPDATE flight_cabin_ancillaries SET currency = UPPER(currency);
UPDATE flight_meals SET currency = UPPER(currency);

DO $$
DECLARE constraint_name TEXT;
BEGIN
    SELECT con.conname INTO constraint_name
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = current_schema()
      AND rel.relname = 'meals'
      AND con.contype = 'u'
      AND pg_get_constraintdef(con.oid) = 'UNIQUE (code)'
    LIMIT 1;

    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE meals DROP CONSTRAINT %I', constraint_name);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM meals GROUP BY airline_id, code HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Duplicate meal (airline_id, code) rows must be resolved before migration';
    END IF;

    IF EXISTS (
        SELECT 1 FROM flight_cabin_ancillaries
        GROUP BY flight_id, cabin_class_id, ancillary_id HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Duplicate flight cabin ancillary assignments must be resolved before migration';
    END IF;
END $$;

ALTER TABLE meals
    DROP CONSTRAINT IF EXISTS uk_meal_airline_code,
    ADD CONSTRAINT uk_meal_airline_code UNIQUE (airline_id, code);

ALTER TABLE flight_cabin_ancillaries
    DROP CONSTRAINT IF EXISTS uk_flight_cabin_ancillary,
    ADD CONSTRAINT uk_flight_cabin_ancillary
        UNIQUE (flight_id, cabin_class_id, ancillary_id);

ALTER TABLE flight_cabin_ancillaries
    ALTER COLUMN price SET NOT NULL,
    ALTER COLUMN currency TYPE VARCHAR(3),
    ALTER COLUMN currency SET NOT NULL;

COMMIT;
