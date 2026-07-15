# Payment Service Overview

## Purpose and ownership

`payment-service` owns payment checkout, provider verification, and payment
status events for FlightHub.

It owns:

- Payment records.
- Provider checkout IDs and transaction IDs.
- Stripe Checkout session creation and verification.
- PayPal order creation and verification.
- Payment cancellation and refund state.
- Payment Kafka events consumed by Booking.

It does not own:

- Booking lifecycle or ticket issuance.
- Fare, coupon, seat, or ancillary pricing.
- Email/SMS notification delivery.

## Business rules

- The booking amount and currency come from Booking. Payment does not recalculate
  itinerary totals.
- Supported checkout providers are `STRIPE` and `PAYPAL`.
- Demo and current production flows settle in USD.
- A booking can have one latest active Payment record at a time.
- Payment initiation locks by booking ID to prevent duplicate checkout races.
- Successful verification requires provider amount/currency/reference to match
  the local Payment record.
- A user may verify only their own Payment.
- Successful payment verification is idempotent.
- Cancelled, failed, refunded, or completed payments cannot be re-verified as a
  fresh pending checkout.
- Provider webhook events are processed defensively and update the same local
  Payment source of truth.

## Main API contracts

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/payments/initiate` | Create Stripe/PayPal checkout |
| `POST` | `/api/payments/verify` | Verify provider checkout completion |
| `POST` | `/api/payments/booking/{bookingId}/cancel` | Cancel pending payment by booking |
| `POST` | `/api/payments/{paymentId}/refund` | Mark or request refund |
| `POST` | `/api/payments/webhooks/stripe` | Stripe webhook entrypoint |
| `POST` | `/api/payments/webhooks/paypal` | PayPal webhook entrypoint |
| `POST` | `/api/payments/batch/bookings` | Batch lookup by booking IDs |
| `GET` | `/api/payments/booking/{bookingId}` | Read payment by booking |
| `GET` | `/api/payments` | Admin/search payment records |

## Provider responsibilities

### Stripe

- Creates hosted Checkout sessions.
- Verifies `session_id` on success redirect or webhook.
- Requires `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.

### PayPal

- Creates PayPal orders.
- Verifies completed order IDs.
- Requires `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, and
  `PAYPAL_WEBHOOK_ID`.

## Events

Payment emits payment status events after meaningful state transitions. Booking
consumes successful payment events to confirm bookings and issue tickets.

Payment events should contain enough identifiers for downstream idempotency:

- `paymentId`
- `bookingId`
- `userId`
- `gateway`
- `status`
- `amount`
- `currency`
- provider reference

## Operational notes

- Payment provider credentials must never be committed.
- Webhooks should be verified before mutating state.
- Expired or abandoned payments should be reconciled by scheduled jobs.
- Booking success pages should verify through backend APIs, not only trust query
  parameters from provider redirects.
