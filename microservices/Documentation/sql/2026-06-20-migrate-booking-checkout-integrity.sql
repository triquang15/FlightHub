-- Booking checkout integrity migration
-- Adds minimum commercial and seat-hold snapshots required for safe checkout.

ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS total_amount DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS currency VARCHAR(3),
    ADD COLUMN IF NOT EXISTS seat_hold_token VARCHAR(128),
    ADD COLUMN IF NOT EXISTS seat_hold_expires_at TIMESTAMPTZ;

UPDATE bookings
SET currency = 'INR'
WHERE currency IS NULL OR BTRIM(currency) = '';

ALTER TABLE bookings
    ALTER COLUMN currency SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_user_status
    ON bookings (user_id, status);

CREATE INDEX IF NOT EXISTS idx_bookings_seat_hold_expires_at
    ON bookings (seat_hold_expires_at)
    WHERE seat_hold_expires_at IS NOT NULL;
