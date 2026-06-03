-- Production-style user seed data for user-service.
-- Safe to re-run: email is unique and existing passwords are not overwritten.
--
-- Default password for newly inserted users: Password@123
-- BCrypt hash generated with cost 10.
--
-- Role enum values supported by backend:
-- ROLE_CUSTOMER, ROLE_AIRLINE_OWNER, ROLE_SYSTEM_ADMIN

BEGIN;

INSERT INTO users (
    full_name,
    password,
    email,
    phone,
    role,
    verified,
    active,
    token_version,
    last_login,
    reset_token_hash,
    reset_token_expiry,
    created_at,
    updated_at
) VALUES
    -- System admins
    ('System Administrator', '$2y$10$9HxKyYgbJctKhuBAbcSnZukO7kgSkzdvu6BGRWiA4uhU7flCXKvE.', 'admin@flighthub.local', '+84900000001', 'ROLE_SYSTEM_ADMIN', true, true, 0, NOW() - INTERVAL '1 hour', NULL, NULL, NOW(), NOW()),
    ('Operations Administrator', '$2y$10$9HxKyYgbJctKhuBAbcSnZukO7kgSkzdvu6BGRWiA4uhU7flCXKvE.', 'ops-admin@flighthub.local', '+84900000002', 'ROLE_SYSTEM_ADMIN', true, true, 0, NOW() - INTERVAL '4 hours', NULL, NULL, NOW(), NOW()),

    -- Airline owners
    ('Vietnam Airlines Owner', '$2y$10$9HxKyYgbJctKhuBAbcSnZukO7kgSkzdvu6BGRWiA4uhU7flCXKvE.', 'owner.vietnamairlines@flighthub.local', '+84910000001', 'ROLE_AIRLINE_OWNER', true, true, 0, NOW() - INTERVAL '2 hours', NULL, NULL, NOW(), NOW()),
    ('Vietjet Air Owner', '$2y$10$9HxKyYgbJctKhuBAbcSnZukO7kgSkzdvu6BGRWiA4uhU7flCXKvE.', 'owner.vietjet@flighthub.local', '+84910000002', 'ROLE_AIRLINE_OWNER', true, true, 0, NOW() - INTERVAL '6 hours', NULL, NULL, NOW(), NOW()),
    ('Bamboo Airways Owner', '$2y$10$9HxKyYgbJctKhuBAbcSnZukO7kgSkzdvu6BGRWiA4uhU7flCXKvE.', 'owner.bamboo@flighthub.local', '+84910000003', 'ROLE_AIRLINE_OWNER', true, true, 0, NOW() - INTERVAL '8 hours', NULL, NULL, NOW(), NOW()),
    ('Singapore Airlines Owner', '$2y$10$9HxKyYgbJctKhuBAbcSnZukO7kgSkzdvu6BGRWiA4uhU7flCXKvE.', 'owner.singaporeair@flighthub.local', '+84910000004', 'ROLE_AIRLINE_OWNER', true, true, 0, NOW() - INTERVAL '1 day', NULL, NULL, NOW(), NOW()),
    ('Thai Airways Owner', '$2y$10$9HxKyYgbJctKhuBAbcSnZukO7kgSkzdvu6BGRWiA4uhU7flCXKvE.', 'owner.thaiairways@flighthub.local', '+84910000005', 'ROLE_AIRLINE_OWNER', true, true, 0, NOW() - INTERVAL '2 days', NULL, NULL, NOW(), NOW()),
    ('AirAsia Owner', '$2y$10$9HxKyYgbJctKhuBAbcSnZukO7kgSkzdvu6BGRWiA4uhU7flCXKvE.', 'owner.airasia@flighthub.local', '+84910000006', 'ROLE_AIRLINE_OWNER', true, true, 0, NOW() - INTERVAL '3 days', NULL, NULL, NOW(), NOW()),
    ('Cathay Pacific Owner', '$2y$10$9HxKyYgbJctKhuBAbcSnZukO7kgSkzdvu6BGRWiA4uhU7flCXKvE.', 'owner.cathay@flighthub.local', '+84910000007', 'ROLE_AIRLINE_OWNER', true, true, 0, NOW() - INTERVAL '5 days', NULL, NULL, NOW(), NOW()),
    ('Japan Airlines Owner', '$2y$10$9HxKyYgbJctKhuBAbcSnZukO7kgSkzdvu6BGRWiA4uhU7flCXKvE.', 'owner.jal@flighthub.local', '+84910000008', 'ROLE_AIRLINE_OWNER', true, true, 0, NOW() - INTERVAL '7 days', NULL, NULL, NOW(), NOW()),
    ('Emirates Owner', '$2y$10$9HxKyYgbJctKhuBAbcSnZukO7kgSkzdvu6BGRWiA4uhU7flCXKvE.', 'owner.emirates@flighthub.local', '+84910000009', 'ROLE_AIRLINE_OWNER', true, true, 0, NOW() - INTERVAL '10 days', NULL, NULL, NOW(), NOW()),
    ('Qatar Airways Owner', '$2y$10$9HxKyYgbJctKhuBAbcSnZukO7kgSkzdvu6BGRWiA4uhU7flCXKvE.', 'owner.qatarairways@flighthub.local', '+84910000010', 'ROLE_AIRLINE_OWNER', true, true, 0, NOW() - INTERVAL '12 days', NULL, NULL, NOW(), NOW()),

    -- Customers
    ('Nguyen Minh Anh', '$2y$10$9HxKyYgbJctKhuBAbcSnZukO7kgSkzdvu6BGRWiA4uhU7flCXKvE.', 'minhanh.nguyen@example.com', '+84920000001', 'ROLE_CUSTOMER', true, true, 0, NOW() - INTERVAL '3 hours', NULL, NULL, NOW(), NOW()),
    ('Tran Quoc Bao', '$2y$10$9HxKyYgbJctKhuBAbcSnZukO7kgSkzdvu6BGRWiA4uhU7flCXKvE.', 'quocbao.tran@example.com', '+84920000002', 'ROLE_CUSTOMER', true, true, 0, NOW() - INTERVAL '9 hours', NULL, NULL, NOW(), NOW()),
    ('Le Hoang Phuc', '$2y$10$9HxKyYgbJctKhuBAbcSnZukO7kgSkzdvu6BGRWiA4uhU7flCXKvE.', 'hoangphuc.le@example.com', '+84920000003', 'ROLE_CUSTOMER', true, true, 0, NOW() - INTERVAL '14 hours', NULL, NULL, NOW(), NOW()),
    ('Pham Gia Han', '$2y$10$9HxKyYgbJctKhuBAbcSnZukO7kgSkzdvu6BGRWiA4uhU7flCXKvE.', 'giahan.pham@example.com', '+84920000004', 'ROLE_CUSTOMER', true, true, 0, NOW() - INTERVAL '1 day', NULL, NULL, NOW(), NOW()),
    ('Vo Thanh Dat', '$2y$10$9HxKyYgbJctKhuBAbcSnZukO7kgSkzdvu6BGRWiA4uhU7flCXKvE.', 'thanhdat.vo@example.com', '+84920000005', 'ROLE_CUSTOMER', true, true, 0, NOW() - INTERVAL '2 days', NULL, NULL, NOW(), NOW()),
    ('Dang Ngoc Linh', '$2y$10$9HxKyYgbJctKhuBAbcSnZukO7kgSkzdvu6BGRWiA4uhU7flCXKvE.', 'ngoclinh.dang@example.com', '+84920000006', 'ROLE_CUSTOMER', true, true, 0, NOW() - INTERVAL '2 days 4 hours', NULL, NULL, NOW(), NOW()),
    ('Bui Tuan Kiet', '$2y$10$9HxKyYgbJctKhuBAbcSnZukO7kgSkzdvu6BGRWiA4uhU7flCXKvE.', 'tuankiet.bui@example.com', '+84920000007', 'ROLE_CUSTOMER', true, true, 0, NOW() - INTERVAL '3 days', NULL, NULL, NOW(), NOW()),
    ('Do Phuong Thao', '$2y$10$9HxKyYgbJctKhuBAbcSnZukO7kgSkzdvu6BGRWiA4uhU7flCXKvE.', 'phuongthao.do@example.com', '+84920000008', 'ROLE_CUSTOMER', true, true, 0, NOW() - INTERVAL '4 days', NULL, NULL, NOW(), NOW()),
    ('Hoang Duc Huy', '$2y$10$9HxKyYgbJctKhuBAbcSnZukO7kgSkzdvu6BGRWiA4uhU7flCXKvE.', 'duchuy.hoang@example.com', '+84920000009', 'ROLE_CUSTOMER', true, true, 0, NOW() - INTERVAL '5 days', NULL, NULL, NOW(), NOW()),
    ('Mai Khanh Vy', '$2y$10$9HxKyYgbJctKhuBAbcSnZukO7kgSkzdvu6BGRWiA4uhU7flCXKvE.', 'khanhvy.mai@example.com', '+84920000010', 'ROLE_CUSTOMER', true, true, 0, NOW() - INTERVAL '6 days', NULL, NULL, NOW(), NOW()),
    ('Nguyen Gia Bao', '$2y$10$9HxKyYgbJctKhuBAbcSnZukO7kgSkzdvu6BGRWiA4uhU7flCXKvE.', 'giabao.nguyen@example.com', '+84920000011', 'ROLE_CUSTOMER', true, true, 0, NOW() - INTERVAL '7 days', NULL, NULL, NOW(), NOW()),
    ('Tran Minh Thu', '$2y$10$9HxKyYgbJctKhuBAbcSnZukO7kgSkzdvu6BGRWiA4uhU7flCXKvE.', 'minhthu.tran@example.com', '+84920000012', 'ROLE_CUSTOMER', true, true, 0, NOW() - INTERVAL '8 days', NULL, NULL, NOW(), NOW()),
    ('Le Bao Chau', '$2y$10$9HxKyYgbJctKhuBAbcSnZukO7kgSkzdvu6BGRWiA4uhU7flCXKvE.', 'baochau.le@example.com', '+84920000013', 'ROLE_CUSTOMER', true, true, 0, NOW() - INTERVAL '9 days', NULL, NULL, NOW(), NOW()),
    ('Pham Anh Tuan', '$2y$10$9HxKyYgbJctKhuBAbcSnZukO7kgSkzdvu6BGRWiA4uhU7flCXKvE.', 'anhtuan.pham@example.com', '+84920000014', 'ROLE_CUSTOMER', true, true, 0, NOW() - INTERVAL '10 days', NULL, NULL, NOW(), NOW()),
    ('Vo My Duyen', '$2y$10$9HxKyYgbJctKhuBAbcSnZukO7kgSkzdvu6BGRWiA4uhU7flCXKvE.', 'myduyen.vo@example.com', '+84920000015', 'ROLE_CUSTOMER', true, true, 0, NOW() - INTERVAL '11 days', NULL, NULL, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role,
    verified = EXCLUDED.verified,
    active = EXCLUDED.active,
    updated_at = NOW();

SELECT setval(
    pg_get_serial_sequence('users', 'id'),
    COALESCE((SELECT MAX(id) FROM users), 1),
    true
);

COMMIT;
