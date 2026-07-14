ALTER TABLE airports
    ADD COLUMN IF NOT EXISTS hero_image_url VARCHAR(1024),
    ADD COLUMN IF NOT EXISTS hero_image_object_key VARCHAR(512);
