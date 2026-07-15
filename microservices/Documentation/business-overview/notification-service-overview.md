# Notification Service Overview

## Purpose and ownership

`notification-service` owns outbound notification delivery, delivery tracking,
retry operations, and notification audit visibility.

It owns:

- Notification events received from Kafka.
- Delivery records per channel.
- Email rendering and sending.
- SMS service boundary.
- Idempotency locks for repeated Kafka delivery attempts.
- Failed delivery visibility and manual retry.
- DLQ event capture.

It does not own:

- User authentication.
- Booking state transitions.
- Payment verification.
- Business source records that triggered notifications.

## Event sources

Current producers:

- `user-service`: password reset and suspicious login events.
- `booking-service`: booking confirmation/ticket events after payment success.
- Future producers can add their own event types if they provide stable
  idempotency keys and safe payloads.

## Delivery channels

Supported channel boundaries:

- Email: implemented through SMTP and HTML templates.
- SMS: service boundary exists; production provider can be added behind
  `SmsService`.

Each event can result in one or more `NotificationDelivery` records depending on
the required channel.

## Business rules

- Consumers must be idempotent. Replayed Kafka events should not duplicate
  outbound email/SMS when the idempotency key already exists.
- Failed delivery attempts are stored for admin inspection.
- DLQ messages are stored separately for diagnostics.
- Retry is an admin operation and should update delivery status consistently.
- Notification payloads should avoid secrets and full payment provider data.
- Booking confirmation templates must support one-way and round-trip itinerary
  data.
- Notification Service should not block the booking transaction; Booking emits
  events after state changes.

## Main API contracts

Admin APIs:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/notifications/overview` | Notification dashboard summary |
| `GET` | `/api/notifications/events` | Search notification events |
| `GET` | `/api/notifications/deliveries` | Search delivery records |
| `GET` | `/api/notifications/deliveries/failed` | Failed delivery queue |
| `POST` | `/api/notifications/deliveries/{deliveryId}/retry` | Retry failed delivery |
| `DELETE` | `/api/notifications/deliveries/{deliveryId}` | Delete delivery record |

## Templates

Important templates:

- Booking confirmation email.
- Password reset email.
- Suspicious login alert email.

Templates should be business-readable, include the minimal required next action,
and work in common email clients without relying on external scripts.

## Operations and observability

Super admin Notification Operations should display:

- Event volume.
- Pending deliveries.
- Failed deliveries.
- DLQ count.
- Recent events.
- Retry actions.

Grafana/Loki/Elasticsearch remain observability tools. Notification Operations
is the business audit surface for notification events and delivery outcomes.
