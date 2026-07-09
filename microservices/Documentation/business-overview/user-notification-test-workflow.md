# User Service and Notification Test Workflow

This document describes the manual test workflow for the FlightHub user-service, api-gateway, notification-service, Kafka notification events, Redis idempotency, and frontend password recovery integration.

The goal is to validate the user module first, then use the same baseline to continue improving the rest of the platform.

## Production boundary summary

- User Service owns users, credentials, sessions, refresh tokens, password reset,
  login audit, and known-device detection.
- API Gateway owns external JWT validation, Redis-backed access-token blacklist,
  route-level authorization, and rate limiting.
- Notification Service owns email/SMS delivery records, templates, Kafka
  consumers, idempotency, retry/DLQ visibility, and operator notification audit.
- Frontend owns token storage choice (`sessionStorage` vs `localStorage`) and
  must preserve `deviceId` across logout to avoid false suspicious-login alerts.

## Scope

This workflow covers:

- Service startup order
- Swagger/OpenAPI access
- Signup, login, refresh token, and protected profile APIs
- Remember me token persistence
- Public route behavior for forgot/reset password
- Password reset HTML email notification
- Suspicious login email notification
- Logout and token revocation
- Known-device tracking for suspicious login detection
- Notification idempotency during Kafka retry
- Notification DLQ capture for failed delivery processing
- Admin notification overview for failed and pending deliveries
- Frontend forgot/reset password integration
- Troubleshooting checklist

## Required Services

Start services in this order:

1. `service-registry`
2. `config-server`
3. `user-service`
4. `notification-service`
5. `api-gateway`
6. `flighthub-web`

Required infrastructure:

- PostgreSQL
- Redis
- Kafka
- Eureka service registry
- Config server
- SMTP credentials for real email delivery

## Required Configuration

These values should come from config-server or environment variables:

```text
JWT_SECRET
INTERNAL_SERVICE_SECRET
NOTIFICATION_DB_URL
NOTIFICATION_DB_USERNAME
NOTIFICATION_DB_PASSWORD
SPRING_DATA_REDIS_HOST
SPRING_DATA_REDIS_PORT
MAIL_USERNAME
MAIL_APP_PASSWORD
MAIL_FROM
PASSWORD_RESET_URL
NOTIFICATION_IDEMPOTENCY_RETENTION_SECONDS
NOTIFICATION_IDEMPOTENCY_LOCK_SECONDS
```

Recommended local reset password URL:

```text
PASSWORD_RESET_URL=http://localhost:5173/reset-password
```

The notification-service appends the token as a query parameter:

```text
http://localhost:5173/reset-password?token=<reset-token>
```

Known device tracking requires the `known_devices` table. If the database was created before this feature was added, run:

```text
microservices/Documentation/sql/2026-05-31-create-known-devices.sql
```

This creates the table and backfills existing rows from `sessions`.

## Swagger URLs

Use the gateway Swagger UI as the main testing entry point:

```text
http://localhost:8080/swagger-ui.html
```

The gateway Swagger UI includes:

- `API Gateway`
- `User Service`
- `Notification Service`

Direct service Swagger URLs:

```text
http://localhost:8080/swagger-ui.html
http://localhost:<user-service-port>/swagger-ui.html
http://localhost:8091/swagger-ui.html
```

Gateway OpenAPI docs:

```text
http://localhost:8080/v3/api-docs
http://localhost:8080/docs/user-service/v3/api-docs
http://localhost:8080/docs/notification-service/v3/api-docs
```

When testing secured APIs in Swagger:

1. Login through `POST /api/auth/login`.
2. Copy the `accessToken`.
3. Click `Authorize`.
4. Enter:

```text
Bearer <access-token>
```

For auth APIs that require a device header, provide:

```text
X-Device-Id: browser-local-test-001
```

## Phase 1: Startup Validation

Start all services in the required order.

Expected result:

- Eureka shows `USER-SERVICE`, `NOTIFICATION-SERVICE`, and `API-GATEWAY`.
- `api-gateway` starts without Feign bean conflicts.
- `user-service` loads config from config-server.
- `notification-service` connects to PostgreSQL, Redis, Kafka, and SMTP config.
- Swagger UI opens at `http://localhost:8080/swagger-ui.html`.

Quick health checks:

```http
GET http://localhost:8761
GET http://localhost:8888/actuator/health
GET http://localhost:8080/actuator/health
GET http://localhost:<user-service-port>/actuator/health
GET http://localhost:8091/actuator/health
```

## Phase 2: Swagger Smoke Test

Open:

```text
http://localhost:8080/swagger-ui.html
```

Expected result:

- The Swagger page loads.
- Dropdown contains `API Gateway`, `User Service`, and `Notification Service`.
- Selecting `User Service` shows auth and user APIs.
- Selecting `API Gateway` shows `/auth/logout` and fallback APIs.
- Selecting `Notification Service` loads operational docs. Notification APIs may be limited until public REST endpoints are added.

If `User Service` docs fail to load through gateway:

- Confirm `user-service` is registered in Eureka.
- Open `http://localhost:8080/docs/user-service/v3/api-docs`.
- Check gateway route `openApiDocsRoutes`.

If `Notification Service` docs fail to load through gateway:

- Confirm `notification-service` is registered in Eureka.
- Open `http://localhost:8080/docs/notification-service/v3/api-docs`.
- Check notification-service startup logs.

## Phase 3: Signup

Use Swagger group `User Service`.

Endpoint:

```http
POST /api/auth/signup
X-Device-Id: browser-local-test-001
Content-Type: application/json
```

Example body:

```json
{
  "email": "customer.test@example.com",
  "password": "Password123",
  "fullName": "Customer Test",
  "phone": "0123456789",
  "role": "ROLE_CUSTOMER"
}
```

Expected result:

- Response is successful.
- Response includes `accessToken`, `refreshToken`, and user data.
- User is created with the requested safe role.

## Phase 4: Role Escalation Protection

Attempt public signup with a system admin role:

```http
POST /api/auth/signup
X-Device-Id: browser-local-test-002
Content-Type: application/json
```

Example body:

```json
{
  "email": "attacker@example.com",
  "password": "Password123",
  "fullName": "Bad Actor",
  "phone": "0123456789",
  "role": "ROLE_SYSTEM_ADMIN"
}
```

Expected result:

- Request is rejected.
- User is not created as `ROLE_SYSTEM_ADMIN`.
- User-service logs show blocked elevated public signup.

## Phase 5: Login

Endpoint:

```http
POST /api/auth/login
X-Device-Id: browser-local-test-001
Content-Type: application/json
```

Example body:

```json
{
  "email": "customer.test@example.com",
  "password": "Password123"
}
```

Expected result:

- Response includes `accessToken` and `refreshToken`.
- Login audit is written.
- Existing device session is created or updated.
- Successful login creates or updates a `known_devices` row for the user/device.

Save these values for later phases:

```text
ACCESS_TOKEN=<accessToken>
REFRESH_TOKEN=<refreshToken>
DEVICE_ID=browser-local-test-001
```

## Phase 5A: Frontend Remember Me

Use the frontend login page:

```text
/login
```

Case A: Remember me is not checked.

Expected result:

- Login succeeds.
- Browser `sessionStorage` contains:
  - `accessToken`
  - `refreshToken`
- Browser `localStorage` does not contain auth tokens.
- Browser `localStorage` still contains `deviceId`.
- Refreshing the page keeps the user signed in.
- Closing the tab or browser clears the auth session.

Case B: Remember me is checked.

Expected result:

- Login succeeds.
- Browser `localStorage` contains:
  - `accessToken`
  - `refreshToken`
- Browser `sessionStorage` does not contain auth tokens.
- Browser `localStorage` still contains `deviceId`.
- Refreshing the page keeps the user signed in.
- Closing and reopening the browser keeps the user signed in until token expiry/logout.

Quick console check:

```javascript
{
  localAccess: localStorage.getItem("accessToken"),
  localRefresh: localStorage.getItem("refreshToken"),
  sessionAccess: sessionStorage.getItem("accessToken"),
  sessionRefresh: sessionStorage.getItem("refreshToken"),
  deviceId: localStorage.getItem("deviceId"),
}
```

## Phase 6: Protected Profile API

Use the gateway or User Service Swagger with Authorization:

```http
GET /api/users/profile
Authorization: Bearer <access-token>
```

Expected result through gateway:

- Gateway validates JWT.
- Gateway checks token version with user-service internal API.
- Gateway injects `X-User-Id`, `X-User-Email`, and `X-User-Roles`.
- User profile is returned.

If this fails:

- Verify `JWT_SECRET` is identical for gateway and user-service.
- Verify `INTERNAL_SERVICE_SECRET` is identical for gateway and user-service.
- Verify the token is not expired or blacklisted.

## Phase 7: Refresh Token

Endpoint:

```http
POST /api/auth/refresh
X-Device-Id: browser-local-test-001
Content-Type: application/json
```

Example body:

```json
{
  "refreshToken": "<refresh-token>"
}
```

Expected result:

- Response returns a new `accessToken`.
- Refresh token is valid only for the same device/session context.

## Phase 8: Forgot Password

Frontend test:

1. Open `/forgot-password`.
2. Enter an existing user email.
3. Submit the form.

Swagger/API test:

```http
POST /api/users/forgot-password
Content-Type: application/json
```

Example body:

```json
{
  "email": "customer.test@example.com"
}
```

Expected backend result:

- Endpoint is public through gateway.
- User-service generates a reset token hash and expiry.
- User-service publishes Kafka topic `user.password-reset-requested`.
- Notification-service consumes the event.
- Notification-service sends the HTML template `email/password-reset.html`.
- Email contains:
  - Branded FlightHub header
  - Reset password CTA
  - Account email
  - Requested-at timestamp
  - Expires-at timestamp
  - Copy/paste fallback reset link
  - Support email
- Notification database contains:
  - `notification_events` row with type `PASSWORD_RESET_REQUESTED`
  - `notification_deliveries` row with channel `EMAIL`
  - delivery status eventually becomes `SENT`

Expected frontend result:

- UI displays a generic success message.
- UI does not reveal whether the email exists.

## Phase 9: Reset Password

Use the reset link from email:

```text
http://localhost:5173/reset-password?token=<reset-token>
```

Frontend test:

1. Open the reset link.
2. Enter a valid new password.
3. Submit the form.
4. Login with the new password.
5. Try logging in with the old password.

Swagger/API test:

```http
POST /api/users/reset-password
Content-Type: application/json
```

Example body:

```json
{
  "token": "<reset-token>",
  "newPassword": "NewPassword123"
}
```

Expected result:

- New password works.
- Old password fails.
- Reset token cannot be reused.
- Existing sessions and refresh tokens for the user are invalidated.

Password rule:

- Minimum 8 characters
- Maximum 64 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

## Phase 10: Suspicious Login Notification

Trigger a suspicious login:

1. Login with `X-Device-Id: browser-local-test-001`.
2. Login again with `X-Device-Id: browser-local-test-002`.

Expected result:

- Login still succeeds.
- User-service publishes Kafka topic `security.suspicious-login`.
- Notification-service consumes the event.
- Suspicious login email is sent.
- Notification database contains:
  - `notification_events` row with type `SUSPICIOUS_LOGIN`
  - `notification_deliveries` row with channel `EMAIL`
  - delivery status eventually becomes `SENT`

Known-device regression test:

1. Login with `X-Device-Id: browser-local-test-001`.
2. Logout from the same device.
3. Login again with `X-Device-Id: browser-local-test-001`.

Expected result:

- Login succeeds.
- No new-device suspicious login email is sent solely because of logout/login.
- `sessions` can be recreated.
- `known_devices` keeps the device identity across logout.

Frontend known-device check:

- Logout removes `accessToken` and `refreshToken`.
- Logout does not remove `deviceId` from `localStorage`.
- Logging in again from the same browser should reuse the same `X-Device-Id`.

## Phase 11: Logout Flow

Use gateway Swagger group `API Gateway`.

Endpoint:

```http
POST /auth/logout
Authorization: Bearer <access-token>
X-Device-Id: browser-local-test-001
Content-Type: application/json
```

Example body:

```json
{
  "refreshToken": "<refresh-token>"
}
```

Expected result:

- Gateway validates the access token.
- Gateway calls user-service `/api/auth/logout` through Feign.
- User-service revokes the refresh token for the device.
- Gateway blacklists the access token in Redis.
- Gateway logout remains the browser-facing logout endpoint. Frontend should not
  call user-service logout directly because it would bypass gateway token
  blacklist behavior.
- Protected API calls with the old access token fail.
- Refresh calls with the old refresh token fail.
- Frontend removes auth tokens from both `localStorage` and `sessionStorage`.
- Frontend preserves `localStorage.deviceId`.

Redis expected behavior:

- Access token is stored in the blacklist with TTL equal to the remaining token lifetime.
- The blacklist entry expires automatically.

## Phase 12: Logout All Sessions

Use User Service Swagger with Authorization:

```http
POST /api/users/logout-all
Authorization: Bearer <access-token>
```

Expected result:

- All user sessions are revoked.
- Refresh tokens for the user are invalidated.
- A later refresh request should fail.

## Phase 13: Notification Idempotency

Test duplicate event handling by replaying the same Kafka event or forcing a retry.

Expected result:

- Same delivery key is not sent more than once.
- Redis stores idempotency keys:
  - `notification:processing:<key>`
  - `notification:sent:<key>`
- Database does not create duplicate successful delivery rows for the same event/channel/recipient.

Important cases:

- Duplicate password reset event should not send duplicate reset emails.
- Duplicate suspicious login event should not send duplicate alert emails.
- Booking confirmed email and SMS are idempotent per channel.
- Failed notification processing is routed to the configured DLQ listener instead
  of being lost silently.
- The admin notification overview should expose failed delivery counts so the
  Super Admin dashboard can display operational risk without parsing service logs.

Suggested verification:

```sql
select event_key, type, recipient, status, created_at
from notification_events
order by created_at desc;

select delivery_key, channel, status, recipient, sent_at, last_error
from notification_deliveries
order by created_at desc;
```

## Phase 14: Auth Rate Limiting

Send repeated login requests through the gateway:

```http
POST /api/auth/login
```

Expected result:

- Gateway eventually returns `429 Too Many Requests`.
- User-service brute force protection also blocks repeated failed login attempts.
- Redis rate-limit keys should use a stable subject such as IP, route, and
  authenticated user when available. Gateway limits are defense in depth and do
  not replace user-service credential abuse checks.

## Frontend Verification

Use these frontend routes:

```text
/login
/forgot-password
/reset-password
/reset-password?token=<reset-token>
```

Expected result:

- Login without Remember me stores `accessToken` and `refreshToken` in `sessionStorage`.
- Login with Remember me stores `accessToken` and `refreshToken` in `localStorage`.
- Token refresh writes refreshed tokens back to the same storage used by the login session.
- Logout clears auth tokens from both browser storage locations and preserves `deviceId`.
- Forgot password calls `/api/users/forgot-password`.
- Reset password calls `/api/users/reset-password`.
- Reset password accepts token from query string.
- After reset success, user is redirected to login.
- Old password no longer works.

## Troubleshooting

If Swagger UI does not open:

- Check `api-gateway` logs.
- Verify `springdoc-openapi-starter-webmvc-ui` is included.
- Verify `http://localhost:8080/v3/api-docs` returns JSON.

If User Service docs do not load from gateway:

- Check `http://localhost:8080/docs/user-service/v3/api-docs`.
- Verify `USER-SERVICE` is registered in Eureka.
- Verify gateway `openApiDocsRoutes` is active.

If notification-service docs do not load from gateway:

- Check `http://localhost:8080/docs/notification-service/v3/api-docs`.
- Verify `NOTIFICATION-SERVICE` is registered in Eureka.

If password reset email is not received:

- Check user-service logs for Kafka publish.
- Check Kafka topic `user.password-reset-requested`.
- Check notification-service logs for consumer errors.
- Verify `email/password-reset.html` is present in notification-service resources.
- Check SMTP credentials.
- Check `notification_deliveries.last_error`.

If suspicious login email is sent after normal logout/login from the same browser:

- Confirm frontend logout did not remove `localStorage.deviceId`.
- Confirm the login request sends the same `X-Device-Id`.
- Confirm `known_devices` contains the user/device pair.
- Confirm `microservices/Documentation/sql/2026-05-31-create-known-devices.sql` was applied for existing databases.

If Remember me does not behave correctly:

- If checked, verify tokens are in `localStorage`.
- If unchecked, verify tokens are in `sessionStorage`.
- Confirm `src/utils/authStorage.js` is used by login, API refresh, auth init, logout, and change password flows.

If notification-service fails to start:

- Verify PostgreSQL config is provided by config-server.
- Verify Redis is reachable.
- Verify Kafka is reachable.
- Verify `spring.jpa.hibernate.ddl-auto` is configured through config-server if local config does not include it.

If gateway protected routes fail:

- Verify `JWT_SECRET` is identical for gateway and user-service.
- Verify `INTERNAL_SERVICE_SECRET` is identical for gateway and user-service.
- Verify user-service is registered in Eureka.
- Verify the access token is not expired.
- Verify Redis is reachable for blacklist checks.

If logout fails:

- Verify `Authorization: Bearer <access-token>` is present.
- Verify `X-Device-Id` matches the login device.
- Verify body contains the correct `refreshToken`.
- Check gateway logs for Feign errors when calling user-service.

## Pass Criteria

This workflow is passing when:

- All services start successfully.
- Swagger opens through the gateway.
- Swagger can load API Gateway, User Service, and Notification Service docs.
- Signup/login/profile work through gateway.
- Public signup cannot create a system admin.
- Forgot/reset password works from frontend to backend.
- Password reset and suspicious login notifications are delivered and tracked in DB.
- Logout revokes refresh token and blacklists access token.
- Duplicate notification events do not send duplicate emails/SMS.
- Auth endpoints are rate limited.
- Gateway logout revokes refresh tokens and blacklists access tokens.
- Notification DLQ and failed-delivery counts are visible for operations.

## Suggested Next Improvements

After this workflow passes, recommended next improvements are:

- Add read-only notification admin APIs for delivery audit search.
- Add admin-only retry endpoint for failed notification deliveries.
- Add Swagger examples and response schemas for common errors.
- Add gateway route docs for other business services.
- Add integration tests for auth, reset password, and idempotent notification delivery.
