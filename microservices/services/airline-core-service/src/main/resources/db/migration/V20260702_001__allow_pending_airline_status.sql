-- Allow newly submitted airline onboarding applications to use PENDING status.
-- Existing databases created before the PENDING enum was introduced still have
-- a Hibernate-generated check constraint that only allows ACTIVE/INACTIVE/BANNED.

ALTER TABLE airlines
    DROP CONSTRAINT IF EXISTS airlines_status_check;

ALTER TABLE airlines
    ADD CONSTRAINT airlines_status_check
    CHECK (status IN ('PENDING', 'ACTIVE', 'INACTIVE', 'BANNED'));
