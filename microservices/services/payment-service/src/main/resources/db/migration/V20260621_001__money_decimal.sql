-- Run against airline_payment_db.
-- Preserve monetary precision for provider settlement amounts.

ALTER TABLE payments
    ALTER COLUMN amount TYPE numeric(19, 2)
    USING ROUND(amount::numeric, 2);
