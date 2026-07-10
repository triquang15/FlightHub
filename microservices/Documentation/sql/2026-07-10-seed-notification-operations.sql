-- Notification operations demo data.
-- Safe to re-run by event_key and delivery_key.

CREATE TEMP TABLE seed_notification_events (
    event_key varchar(220) PRIMARY KEY,
    type varchar(60) NOT NULL,
    business_key varchar(180) NOT NULL,
    source_service varchar(80) NOT NULL,
    payload_json text NOT NULL,
    created_at timestamp NOT NULL,
    updated_at timestamp NOT NULL
);

INSERT INTO seed_notification_events VALUES
    (
        'BOOKING_CONFIRMED:BK-NOTI-DEMO-001',
        'BOOKING_CONFIRMED',
        'BK-NOTI-DEMO-001',
        'booking-service',
        jsonb_build_object(
            'bookingId', 9001,
            'bookingReference', 'BK-NOTI-DEMO-001',
            'confirmedAt', to_char(NOW() - INTERVAL '2 hours', 'YYYY-MM-DD"T"HH24:MI:SS'),
            'bookingDate', to_char(NOW() - INTERVAL '3 hours', 'YYYY-MM-DD"T"HH24:MI:SS'),
            'cabinClass', 'ECONOMY',
            'tripType', 'ONE_WAY',
            'flexibleTicket', false,
            'userId', 21,
            'userName', 'Minh Anh Nguyen',
            'contactEmail', 'minhanh.nguyen@example.com',
            'contactPhone', '+84920000001',
            'flightNumber', 'VN210',
            'airlineName', 'Vietnam Airlines',
            'aircraftModel', 'Airbus A350-900',
            'departureAirportCode', 'SGN',
            'departureAirportName', 'Tan Son Nhat International Airport',
            'departureCity', 'Ho Chi Minh City',
            'departureCountry', 'Vietnam',
            'arrivalAirportCode', 'HAN',
            'arrivalAirportName', 'Noi Bai International Airport',
            'arrivalCity', 'Ha Noi',
            'arrivalCountry', 'Vietnam',
            'departureDateTime', to_char(NOW() + INTERVAL '4 days', 'YYYY-MM-DD"T"HH24:MI:SS'),
            'arrivalDateTime', to_char(NOW() + INTERVAL '4 days 2 hours', 'YYYY-MM-DD"T"HH24:MI:SS'),
            'totalAmount', 68.00,
            'currency', 'USD',
            'paymentGateway', 'STRIPE',
            'fareName', 'Economy Flex'
        )::text,
        NOW() - INTERVAL '2 hours',
        NOW() - INTERVAL '1 hour 58 minutes'
    ),
    (
        'BOOKING_CONFIRMED:BK-NOTI-DEMO-002',
        'BOOKING_CONFIRMED',
        'BK-NOTI-DEMO-002',
        'booking-service',
        jsonb_build_object(
            'bookingId', 9002,
            'bookingReference', 'BK-NOTI-DEMO-002',
            'confirmedAt', to_char(NOW() - INTERVAL '1 day', 'YYYY-MM-DD"T"HH24:MI:SS'),
            'bookingDate', to_char(NOW() - INTERVAL '1 day 1 hour', 'YYYY-MM-DD"T"HH24:MI:SS'),
            'cabinClass', 'ECONOMY',
            'tripType', 'ROUND_TRIP',
            'flexibleTicket', false,
            'userId', 22,
            'userName', 'Quoc Bao Tran',
            'contactEmail', 'quocbao.tran@example.com',
            'contactPhone', '+84920000002',
            'flightNumber', 'SQ185',
            'airlineName', 'Singapore Airlines',
            'departureAirportCode', 'SGN',
            'arrivalAirportCode', 'SIN',
            'totalAmount', 272.00,
            'currency', 'USD',
            'paymentGateway', 'PAYPAL',
            'fareName', 'Economy Value'
        )::text,
        NOW() - INTERVAL '1 day',
        NOW() - INTERVAL '23 hours 57 minutes'
    ),
    (
        'PASSWORD_RESET_REQUESTED:RESET-DEMO-001',
        'PASSWORD_RESET_REQUESTED',
        'RESET-DEMO-001',
        'user-service',
        jsonb_build_object(
            'eventId', 'RESET-DEMO-001',
            'userId', 21,
            'email', 'minhanh.nguyen@example.com',
            'fullName', 'Minh Anh Nguyen',
            'resetToken', 'demo-reset-token-001',
            'expiresAt', to_char(NOW() + INTERVAL '45 minutes', 'YYYY-MM-DD"T"HH24:MI:SS'),
            'requestedAt', to_char(NOW() - INTERVAL '30 minutes', 'YYYY-MM-DD"T"HH24:MI:SS')
        )::text,
        NOW() - INTERVAL '30 minutes',
        NOW() - INTERVAL '29 minutes'
    ),
    (
        'SUSPICIOUS_LOGIN:SEC-DEMO-001',
        'SUSPICIOUS_LOGIN',
        'SEC-DEMO-001',
        'user-service',
        jsonb_build_object(
            'eventId', 'SEC-DEMO-001',
            'userId', 23,
            'email', 'security.review@example.com',
            'deviceId', 'Chrome on macOS',
            'ip', '203.0.113.42',
            'timestamp', to_char(NOW() - INTERVAL '12 minutes', 'YYYY-MM-DD"T"HH24:MI:SS')
        )::text,
        NOW() - INTERVAL '12 minutes',
        NOW() - INTERVAL '11 minutes'
    ),
    (
        'BOOKING_CONFIRMED:BK-NOTI-DEMO-003',
        'BOOKING_CONFIRMED',
        'BK-NOTI-DEMO-003',
        'booking-service',
        jsonb_build_object(
            'bookingId', 9003,
            'bookingReference', 'BK-NOTI-DEMO-003',
            'confirmedAt', to_char(NOW() - INTERVAL '4 hours', 'YYYY-MM-DD"T"HH24:MI:SS'),
            'userName', 'Demo Pending',
            'contactEmail', 'pending.delivery@example.com',
            'contactPhone', '+84920000003',
            'flightNumber', 'VJ122',
            'airlineName', 'Vietjet Air',
            'totalAmount', 36.40,
            'currency', 'USD'
        )::text,
        NOW() - INTERVAL '4 hours',
        NOW() - INTERVAL '4 hours'
    );

INSERT INTO notification_events (
    event_key,
    type,
    business_key,
    source_service,
    payload_json,
    created_at,
    updated_at
)
SELECT
    event_key,
    type,
    business_key,
    source_service,
    payload_json,
    created_at,
    updated_at
FROM seed_notification_events
ON CONFLICT (event_key) DO UPDATE
SET
    type = EXCLUDED.type,
    business_key = EXCLUDED.business_key,
    source_service = EXCLUDED.source_service,
    payload_json = EXCLUDED.payload_json,
    created_at = EXCLUDED.created_at,
    updated_at = EXCLUDED.updated_at;

CREATE TEMP TABLE seed_notification_deliveries (
    event_key varchar(220) NOT NULL,
    delivery_key varchar(260) PRIMARY KEY,
    channel varchar(30) NOT NULL,
    status varchar(40) NOT NULL,
    recipient varchar(260) NOT NULL,
    subject varchar(260),
    content text,
    attempts integer NOT NULL,
    last_error text,
    sent_at timestamp,
    created_at timestamp NOT NULL,
    updated_at timestamp NOT NULL
);

INSERT INTO seed_notification_deliveries VALUES
    (
        'BOOKING_CONFIRMED:BK-NOTI-DEMO-001',
        'BOOKING_CONFIRMED:BK-NOTI-DEMO-001:EMAIL:minhanh.nguyen@example.com',
        'EMAIL',
        'SENT',
        'minhanh.nguyen@example.com',
        'Your FlightHub booking BK-NOTI-DEMO-001 is confirmed',
        'Demo booking confirmation email.',
        1,
        NULL,
        NOW() - INTERVAL '1 hour 58 minutes',
        NOW() - INTERVAL '2 hours',
        NOW() - INTERVAL '1 hour 58 minutes'
    ),
    (
        'BOOKING_CONFIRMED:BK-NOTI-DEMO-001',
        'BOOKING_CONFIRMED:BK-NOTI-DEMO-001:SMS:+84920000001',
        'SMS',
        'SKIPPED_DUPLICATE',
        '+84920000001',
        'FlightHub booking confirmed',
        'Demo duplicate SMS guard.',
        1,
        'Duplicate SMS delivery was skipped by idempotency guard',
        NULL,
        NOW() - INTERVAL '2 hours',
        NOW() - INTERVAL '1 hour 57 minutes'
    ),
    (
        'BOOKING_CONFIRMED:BK-NOTI-DEMO-002',
        'BOOKING_CONFIRMED:BK-NOTI-DEMO-002:EMAIL:quocbao.tran@example.com',
        'EMAIL',
        'FAILED',
        'quocbao.tran@example.com',
        'Your FlightHub booking BK-NOTI-DEMO-002 is confirmed',
        'Demo failed booking confirmation email.',
        2,
        'SMTP authentication failed for demo sender',
        NULL,
        NOW() - INTERVAL '1 day',
        NOW() - INTERVAL '23 hours 57 minutes'
    ),
    (
        'BOOKING_CONFIRMED:BK-NOTI-DEMO-002',
        'BOOKING_CONFIRMED:BK-NOTI-DEMO-002:SMS:+84920000002',
        'SMS',
        'FAILED',
        '+84920000002',
        'FlightHub booking confirmed',
        'Demo failed SMS.',
        1,
        'SMS provider is disabled',
        NULL,
        NOW() - INTERVAL '1 day',
        NOW() - INTERVAL '23 hours 56 minutes'
    ),
    (
        'PASSWORD_RESET_REQUESTED:RESET-DEMO-001',
        'PASSWORD_RESET_REQUESTED:RESET-DEMO-001:EMAIL:minhanh.nguyen@example.com',
        'EMAIL',
        'SENT',
        'minhanh.nguyen@example.com',
        'Reset your FlightHub password',
        'Demo password reset email.',
        1,
        NULL,
        NOW() - INTERVAL '29 minutes',
        NOW() - INTERVAL '30 minutes',
        NOW() - INTERVAL '29 minutes'
    ),
    (
        'SUSPICIOUS_LOGIN:SEC-DEMO-001',
        'SUSPICIOUS_LOGIN:SEC-DEMO-001:EMAIL:security.review@example.com',
        'EMAIL',
        'PROCESSING',
        'security.review@example.com',
        'New sign-in detected',
        'Demo processing security alert.',
        1,
        NULL,
        NULL,
        NOW() - INTERVAL '12 minutes',
        NOW() - INTERVAL '11 minutes'
    ),
    (
        'BOOKING_CONFIRMED:BK-NOTI-DEMO-003',
        'BOOKING_CONFIRMED:BK-NOTI-DEMO-003:EMAIL:pending.delivery@example.com',
        'EMAIL',
        'PENDING',
        'pending.delivery@example.com',
        'Your FlightHub booking BK-NOTI-DEMO-003 is confirmed',
        'Demo pending booking confirmation email.',
        0,
        NULL,
        NULL,
        NOW() - INTERVAL '4 hours',
        NOW() - INTERVAL '4 hours'
    );

INSERT INTO notification_deliveries (
    event_id,
    delivery_key,
    channel,
    status,
    recipient,
    subject,
    content,
    attempts,
    last_error,
    sent_at,
    created_at,
    updated_at
)
SELECT
    e.id,
    d.delivery_key,
    d.channel,
    d.status,
    d.recipient,
    d.subject,
    d.content,
    d.attempts,
    d.last_error,
    d.sent_at,
    d.created_at,
    d.updated_at
FROM seed_notification_deliveries d
JOIN notification_events e ON e.event_key = d.event_key
ON CONFLICT (delivery_key) DO UPDATE
SET
    event_id = EXCLUDED.event_id,
    channel = EXCLUDED.channel,
    status = EXCLUDED.status,
    recipient = EXCLUDED.recipient,
    subject = EXCLUDED.subject,
    content = EXCLUDED.content,
    attempts = EXCLUDED.attempts,
    last_error = EXCLUDED.last_error,
    sent_at = EXCLUDED.sent_at,
    created_at = EXCLUDED.created_at,
    updated_at = EXCLUDED.updated_at;
