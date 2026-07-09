-- Payment idempotency migration
-- Keeps one canonical latest payment row per booking and prevents new duplicates.

ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS currency VARCHAR(3),
    ADD COLUMN IF NOT EXISTS provider_checkout_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;

UPDATE payments
SET currency = 'USD'
WHERE currency IS NULL OR BTRIM(currency) = '';

ALTER TABLE payments
    ALTER COLUMN currency SET NOT NULL;

UPDATE payments
SET expires_at = COALESCE(updated_at, created_at, NOW()) + INTERVAL '30 minutes'
WHERE status IN ('PENDING', 'PROCESSING')
  AND expires_at IS NULL;

WITH ranked_payments AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY booking_id
               ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
           ) AS row_number
    FROM payments
    WHERE booking_id IS NOT NULL
)
DELETE FROM payments p
USING ranked_payments r
WHERE p.id = r.id
  AND r.row_number > 1;

CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_booking_id
    ON payments (booking_id)
    WHERE booking_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_booking_status
    ON payments (booking_id, status);

CREATE INDEX IF NOT EXISTS idx_payments_pending_expiry
    ON payments (expires_at)
    WHERE status IN ('PENDING', 'PROCESSING');
