
CREATE TABLE IF NOT EXISTS user_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    theme VARCHAR(16) NOT NULL DEFAULT 'SYSTEM',
    language VARCHAR(16) NOT NULL DEFAULT 'en',
    timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_preferences_user UNIQUE (user_id),
    CONSTRAINT fk_user_preferences_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT ck_user_preferences_theme
        CHECK (theme IN ('SYSTEM', 'LIGHT', 'DARK'))
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user
    ON user_preferences(user_id);

INSERT INTO user_preferences (user_id)
SELECT id
FROM users
ON CONFLICT (user_id) DO NOTHING;

