# Kafka Production Usage

Kafka is the asynchronous integration layer for events that must fan out across
services without blocking the request that produced them. PostgreSQL remains the
source of truth for business state; Kafka carries durable notifications that
other services can replay or recover from.

## Event Ownership

| Topic | Producer | Consumers | Business purpose |
| --- | --- | --- | --- |
| `payment.completed` | payment-service | booking-service | Mark booking paid and issue ticket state. |
| `payment.failed` | payment-service | booking-service | Mark booking payment failed and release dependent state when applicable. |
| `payment.refunded` | payment-service | booking-service | Mark booking refunded after provider refund succeeds. |
| `booking.confirmed` | booking-service | notification-service, seat-service | Send confirmation email/SMS and convert held seats into booked seats. |
| `flight-instance-created` | flight-ops-service | seat-service | Generate per-flight seat inventory from the configured seat map. |
| `user.password-reset-requested` | user-service | notification-service | Send password reset email. |
| `security.suspicious-login` | user-service | notification-service | Notify the account owner about suspicious authentication activity. |

Dead-letter topics use the same topic name with a `.DLQ` suffix, for example
`booking.confirmed.DLQ`.

## Production Rules

- Use a stable event key for ordering. Booking/payment events use `bookingId` or
  `bookingReference`; flight instance events use `flightInstanceId`; security
  events use the affected account identity.
- Producers should use `acks=all`, retries, and idempotence so transient broker
  errors do not silently lose events.
- Consumers should run with `enable-auto-commit=false` and record-level acking.
  A failed record must be retried and then sent to the matching `.DLQ` topic.
- Consumer handlers must be idempotent. At-least-once delivery means the same
  event can be received more than once after retry, rebalance, or manual replay.
- Never treat Kafka as the system of record. Persist business state first, then
  publish the event that describes the committed state.
- Do not swallow listener exceptions. Let Spring Kafka retry and DLQ failed
  messages so operators can see and recover them.

## Local Verification

List topics:

```bash
docker exec kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --list
```

Inspect consumer groups:

```bash
docker exec kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --describe \
  --all-groups
```

Follow broker logs:

```bash
docker compose -f microservices/docker-compose/docker-compose.dev.yml logs -f kafka
```

## Recovery Playbook

1. Check the service log for the failed topic, event key, and trace id.
2. Inspect the matching `.DLQ` topic.
3. Fix the downstream data or code issue.
4. Replay only the affected DLQ messages after confirming the handler is
   idempotent.
5. Verify the target database state and the consumer group lag.

For notification-specific event audit and replay screens, use System Admin:
Notification Operations.
