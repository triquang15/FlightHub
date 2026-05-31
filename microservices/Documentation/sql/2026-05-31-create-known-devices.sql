CREATE TABLE IF NOT EXISTS known_devices (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    device_id VARCHAR(255) NOT NULL,
    ip_address VARCHAR(255),
    user_agent VARCHAR(1000),
    last_seen_at TIMESTAMP,
    first_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_known_device_user
        FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT uk_known_device_user_device
        UNIQUE (user_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_known_device_user
    ON known_devices(user_id);

CREATE INDEX IF NOT EXISTS idx_known_device_user_device
    ON known_devices(user_id, device_id);

INSERT INTO known_devices (
    user_id,
    device_id,
    ip_address,
    user_agent,
    last_seen_at,
    first_seen_at
)
SELECT
    s.user_id,
    s.device_id,
    s.ip_address,
    s.user_agent,
    COALESCE(s.last_active, CURRENT_TIMESTAMP),
    COALESCE(s.created_at, CURRENT_TIMESTAMP)
FROM sessions s
WHERE s.device_id IS NOT NULL
ON CONFLICT (user_id, device_id) DO NOTHING;
