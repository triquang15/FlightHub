ALTER TABLE login_audit
    ADD COLUMN IF NOT EXISTS provider VARCHAR(30);

UPDATE login_audit
SET provider = 'PASSWORD'
WHERE provider IS NULL;

CREATE TABLE IF NOT EXISTS user_identities (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    provider VARCHAR(30) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    provider_email VARCHAR(255),
    display_name VARCHAR(255),
    avatar_url VARCHAR(1000),
    last_login_at TIMESTAMP,
    linked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_identity_provider_subject UNIQUE (provider, provider_user_id),
    CONSTRAINT fk_user_identities_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT ck_user_identities_provider
        CHECK (provider IN ('PASSWORD', 'GOOGLE', 'APPLE'))
);

CREATE INDEX IF NOT EXISTS idx_identity_user
    ON user_identities(user_id);

CREATE INDEX IF NOT EXISTS idx_identity_email
    ON user_identities(provider_email);

CREATE INDEX IF NOT EXISTS idx_identity_provider
    ON user_identities(provider);

INSERT INTO user_identities (
    user_id,
    provider,
    provider_user_id,
    provider_email,
    display_name,
    last_login_at
)
SELECT
    id,
    'PASSWORD',
    lower(email),
    lower(email),
    full_name,
    last_login
FROM users
WHERE email IS NOT NULL
ON CONFLICT (provider, provider_user_id) DO NOTHING;
