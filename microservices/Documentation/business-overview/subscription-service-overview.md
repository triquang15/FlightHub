# Subscription Service Overview

## Current status

`subscription-service` is an infrastructure scaffold only. It has no plan, subscription,
billing, entitlement, controller, persistence, event, or reconciliation implementation.
It is therefore not exposed by API Gateway and must not be treated as production-ready.

## Required contract before implementation

1. Define plan ownership, benefits, billing interval, trial and currency rules.
2. Extend payment-service with a subscription billing aggregate. The existing payment
   contract is booking-specific and requires a `bookingId`.
3. Define provider subscription identifiers and webhook events for activation, renewal,
   payment failure, cancellation and refund.
4. Define entitlement behavior during grace periods and after cancellation.
5. Add idempotent webhook processing, renewal reconciliation and an outbox for lifecycle events.

## Deployment decision

The service may remain in local Compose for future development, but it is intentionally
absent from Gateway routes and the supported backend API surface. Do not add a create
subscription endpoint until the billing contract above exists.
