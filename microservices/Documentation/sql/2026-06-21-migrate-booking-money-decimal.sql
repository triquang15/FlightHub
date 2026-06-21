-- Run against airline_booking_db.
-- Preserve monetary precision for booking totals.

ALTER TABLE bookings
    ALTER COLUMN total_amount TYPE numeric(19, 2)
    USING ROUND(total_amount::numeric, 2);
