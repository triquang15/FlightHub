# Booking Service Overview

## Purpose and ownership

`booking-service` owns the traveler booking lifecycle after a user has selected
sellable flights and fares.

It owns:

- Booking records and booking references.
- Multi-leg booking structure for one-way and round-trip checkout.
- Passenger records linked to bookings and reusable traveler profile matching.
- Pending seat hold metadata attached to bookings and legs.
- Ticket issuance after payment confirmation.
- Booking, route, airport, and airline performance aggregates.

It does not own:

- Flight schedules or flight instances.
- Airline, aircraft, or airport master data.
- Fare calculation rules or coupon definitions.
- Payment provider checkout sessions.
- Seat map geometry or seat availability source of truth.
- Notification delivery.

## Core business lifecycle

```text
Search result
  -> selected fare and optional seats/extras
  -> pending booking
  -> seat hold
  -> payment checkout
  -> payment success event
  -> booking confirmed
  -> seats confirmed
  -> coupon redeemed
  -> tickets issued
  -> booking confirmation event
```

If pricing, seat hold, ancillary pricing, or payment initiation fails while the
booking is pending, the service cancels the pending booking and releases any held
seats when possible.

## Booking rules

- Booking currency is normalized from `booking.currency` and defaults to `USD`.
- All selected leg fares must match the configured booking currency.
- A booking has at least one leg.
- One-way checkout has one leg.
- Round-trip checkout has departure and return legs.
- Seat assignment must be scoped to the selected flight instance.
- Seat selection is optional; lack of a seat map must not block checkout.
- Passenger details are required before payment because tickets need passenger
  identity.
- Coupon validation happens before payment and redemption happens only after
  payment success.
- Payment failure or abandoned checkout should not issue tickets or consume
  coupon usage.

## Multi-leg booking model

The root Booking keeps compatibility fields for the primary leg, while
`BookingLeg` stores each selected itinerary leg:

- `legOrder`
- `flightId`
- `flightInstanceId`
- `fareId`
- `cabinClass`
- `seatInstanceIds`
- `seatHoldToken`

Analytics and tickets should prefer the leg collection when present.

## Service dependencies

Runtime integrations:

- `flight-ops-service`: validates and enriches selected Flights and Flight
  Instances.
- `airline-core-service`: resolves airline ownership and airline display data.
- `seat-service`: holds, releases, prices, and confirms selected seats.
- `pricing-service`: validates Fare currency, totals, and coupons.
- `ancillary-service`: prices selected baggage, meals, and protection products.
- `payment-service`: initiates checkout and emits payment status events.
- `notification-service`: consumes booking notification events asynchronously.

Required infrastructure:

- PostgreSQL
- Kafka
- Eureka
- Config Server
- API Gateway

## Main API contracts

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/bookings` | Create pending booking and initiate payment |
| `PUT` | `/api/bookings/{id}` | Update booking details |
| `GET` | `/api/bookings/{id}` | Read booking detail |
| `GET` | `/api/bookings/user/history` | Traveler booking history |
| `GET` | `/api/bookings/airline` | Airline-owner booking operations list |
| `PATCH` | `/api/bookings/{id}/cancel` | Cancel a booking |
| `DELETE` | `/api/bookings/{id}` | Delete booking record |
| `GET` | `/api/bookings/statistics/airline` | Owner booking statistics |
| `GET` | `/api/bookings/statistics/super-admin` | Platform booking statistics |
| `GET` | `/api/bookings/dashboard-stats/super-admin` | Super admin dashboard summary |
| `GET` | `/api/bookings/route-performance/airline` | Owner route analytics |
| `GET` | `/api/bookings/airport-performance/airline` | Owner airport analytics |
| `GET` | `/api/bookings/route-performance/super-admin` | Platform route analytics |
| `GET` | `/api/bookings/airport-performance/super-admin` | Platform airport analytics |
| `GET` | `/api/bookings/airline-performance/super-admin` | Platform airline analytics |

Passenger APIs:

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/passengers` | Create passenger |
| `POST` | `/api/passengers/find` | Find reusable passenger |
| `GET` | `/api/passengers/me` | List current user's passengers |

Ticket APIs:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/tickets/{ticketNumber}` | Read by ticket number |
| `GET` | `/api/tickets/booking/{bookingId}` | Read tickets for booking |
| `PUT` | `/api/tickets/{ticketId}/cancel` | Cancel ticket |
| `PUT` | `/api/tickets/{ticketId}/use` | Mark ticket used |
| `PUT` | `/api/tickets/{ticketId}/refund` | Mark ticket refunded |

## Payment event handling

`booking-service` consumes payment events from Kafka. On successful payment it:

- Confirms the booking.
- Stores payment ID/status.
- Confirms seats with `seat-service`.
- Redeems coupon usage with `pricing-service`.
- Issues tickets.
- Publishes booking confirmation notification data.

Payment verification remains owned by `payment-service`; booking should not
trust a frontend success redirect alone.

## Analytics contract

Booking analytics are derived from confirmed booking data and exposed to:

- Airline owner dashboards.
- Super admin dashboard.
- Route Performance and Airport Performance pages.
- Airline Performance Analytics.

Cancelled, failed, and pending payment records should not count as confirmed
revenue.
