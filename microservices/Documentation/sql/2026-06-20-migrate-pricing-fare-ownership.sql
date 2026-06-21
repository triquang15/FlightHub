-- Adds durable airline ownership to Fare records.
-- Run before deploying the owner-scoped Fare API to an existing pricing database.
\set ON_ERROR_STOP on

BEGIN;

ALTER TABLE fares ADD COLUMN IF NOT EXISTS airline_id bigint;

UPDATE fares fare
SET airline_id = ownership.airline_id
FROM (
    SELECT fare_id, max(airline_id) AS airline_id
    FROM (
        SELECT fare_id, airline_id FROM fare_rules WHERE airline_id IS NOT NULL
        UNION ALL
        SELECT fare_id, airline_id FROM baggage_policies WHERE airline_id IS NOT NULL
    ) source
    GROUP BY fare_id
) ownership
WHERE fare.id = ownership.fare_id
  AND fare.airline_id IS NULL;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM fares WHERE airline_id IS NULL) THEN
        RAISE EXCEPTION 'Fare ownership migration requires manual airline_id mapping for % legacy rows',
            (SELECT count(*) FROM fares WHERE airline_id IS NULL);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_fares_airline_id ON fares (airline_id);
ALTER TABLE fares ALTER COLUMN airline_id SET NOT NULL;

COMMIT;
