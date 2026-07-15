CREATE TABLE IF NOT EXISTS media_files (
    id BIGSERIAL PRIMARY KEY,
    owner_user_id BIGINT,
    entity_type VARCHAR(64) NOT NULL,
    entity_id BIGINT,
    purpose VARCHAR(64) NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(255) NOT NULL,
    size_bytes BIGINT NOT NULL,
    storage_provider VARCHAR(24) NOT NULL,
    storage_key VARCHAR(255) NOT NULL UNIQUE,
    public_url VARCHAR(255) NOT NULL,
    visibility VARCHAR(24) NOT NULL,
    checksum_sha256 VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_media_entity
    ON media_files (entity_type, entity_id, purpose);

CREATE INDEX IF NOT EXISTS idx_media_owner
    ON media_files (owner_user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_media_storage_key
    ON media_files (storage_key);
