-- One-time pricing catalog migration from legacy VND values to USD.
-- Transactional records in booking/payment databases are intentionally untouched.
-- Re-runnable: only rows without a currency or explicitly marked VND are converted.

BEGIN;

ALTER TABLE fares ADD COLUMN IF NOT EXISTS currency varchar(3);

-- Fare-rule fees use the parent fare's currency and follow the same conversion.
UPDATE fare_rules rules
SET change_fee = CASE WHEN rules.change_fee IS NULL THEN NULL
                      ELSE ROUND((rules.change_fee / 25000.0)::numeric, 2) END,
    cancellation_fee = CASE WHEN rules.cancellation_fee IS NULL THEN NULL
                            ELSE ROUND((rules.cancellation_fee / 25000.0)::numeric, 2) END,
    updated_at = NOW()
FROM fares fare
WHERE rules.fare_id = fare.id
  AND (fare.currency IS NULL OR UPPER(BTRIM(fare.currency)) = 'VND');

UPDATE fares
SET base_fare = ROUND((base_fare / 25000.0)::numeric, 2),
    taxes_and_fees = ROUND((COALESCE(taxes_and_fees, 0) / 25000.0)::numeric, 2),
    airline_fees = ROUND((COALESCE(airline_fees, 0) / 25000.0)::numeric, 2),
    current_price = ROUND((current_price / 25000.0)::numeric, 2),
    currency = 'USD',
    updated_at = NOW()
WHERE currency IS NULL OR UPPER(BTRIM(currency)) = 'VND';

UPDATE fares SET currency = 'USD' WHERE currency IS NULL OR BTRIM(currency) = '';
ALTER TABLE fares ALTER COLUMN currency SET DEFAULT 'USD';
ALTER TABLE fares ALTER COLUMN currency SET NOT NULL;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_fares_currency_iso'
    ) THEN
        ALTER TABLE fares ADD CONSTRAINT chk_fares_currency_iso
            CHECK (currency ~ '^[A-Z]{3}$') NOT VALID;
    END IF;
END $$;
ALTER TABLE fares VALIDATE CONSTRAINT chk_fares_currency_iso;

COMMIT;
