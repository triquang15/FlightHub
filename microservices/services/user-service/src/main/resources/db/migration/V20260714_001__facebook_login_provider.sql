ALTER TABLE user_identities
    DROP CONSTRAINT IF EXISTS ck_user_identities_provider;

ALTER TABLE user_identities
    ADD CONSTRAINT ck_user_identities_provider
        CHECK (provider IN ('PASSWORD', 'GOOGLE', 'FACEBOOK', 'APPLE'));
