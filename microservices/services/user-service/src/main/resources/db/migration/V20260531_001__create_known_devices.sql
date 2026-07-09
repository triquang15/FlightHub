CREATE TABLE IF NOT EXISTS known_devices (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    device_id VARCHAR(255) NOT NULL,
    ip_address VARCHAR(255),
    user_agent VARCHAR(1000),
    last_seen_at TIMESTAMP,
    first_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_known_device_user_device UNIQUE (user_id, device_id),
    CONSTRAINT fk_known_devices_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_known_device_user
    ON known_devices(user_id);

CREATE INDEX IF NOT EXISTS idx_known_device_user_device
    ON known_devices(user_id, device_id);
