CREATE TABLE IF NOT EXISTS coupons (
    id BIGSERIAL PRIMARY KEY,
    airline_id BIGINT NOT NULL,
    code VARCHAR(32) NOT NULL,
    description VARCHAR(500) NOT NULL,
    discount_type VARCHAR(20) NOT NULL,
    discount_value DOUBLE PRECISION NOT NULL,
    min_purchase_amount DOUBLE PRECISION,
    max_discount_amount DOUBLE PRECISION,
    valid_from TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    usage_limit INTEGER NOT NULL,
    per_user_limit INTEGER NOT NULL,
    used_count INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_coupons_airline_code UNIQUE (airline_id, code),
    CONSTRAINT chk_coupons_discount_type
        CHECK (discount_type IN ('PERCENTAGE', 'FIXED_AMOUNT')),
    CONSTRAINT chk_coupons_status
        CHECK (status IN ('ACTIVE', 'INACTIVE')),
    CONSTRAINT chk_coupons_usage
        CHECK (usage_limit >= 1 AND per_user_limit >= 1 AND per_user_limit <= usage_limit),
    CONSTRAINT chk_coupons_used_count
        CHECK (used_count >= 0),
    CONSTRAINT chk_coupons_valid_window
        CHECK (valid_until > valid_from)
);

CREATE TABLE IF NOT EXISTS coupon_cabin_classes (
    coupon_id BIGINT NOT NULL,
    cabin_class VARCHAR(30),
    CONSTRAINT fk_coupon_cabin_classes_coupon
        FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
    CONSTRAINT chk_coupon_cabin_class
        CHECK (cabin_class IN ('ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST'))
);

CREATE TABLE IF NOT EXISTS coupon_routes (
    coupon_id BIGINT NOT NULL,
    route_id BIGINT,
    CONSTRAINT fk_coupon_routes_coupon
        FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS coupon_redemptions (
    id BIGSERIAL PRIMARY KEY,
    coupon_id BIGINT NOT NULL,
    airline_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    booking_id BIGINT NOT NULL,
    code VARCHAR(32) NOT NULL,
    redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_coupon_redemptions_booking UNIQUE (coupon_id, booking_id)
);

CREATE INDEX IF NOT EXISTS idx_coupons_airline_status
    ON coupons(airline_id, status);

CREATE INDEX IF NOT EXISTS idx_coupons_code
    ON coupons(code);

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user
    ON coupon_redemptions(coupon_id, user_id);
