# User Service Overview

## Purpose and ownership

`user-service` owns identity, authentication, session security, user profiles,
preferences, and social login identity mapping.

It owns:

- User accounts and roles.
- Password credential authentication.
- Google and Facebook identity login.
- Legacy Apple identity code paths if enabled by configuration.
- Refresh tokens and sessions.
- Known devices and login audit.
- Password reset flow.
- User profile and preferences.
- User avatar update workflow through `media-service`.

It does not own:

- Gateway token blacklist.
- Airline ownership approval decisions.
- Notification delivery.
- Media file storage internals.

## Auth model

Browser clients authenticate through `/api/auth/**` via API Gateway. The gateway
validates JWTs for protected routes, strips untrusted client identity headers,
and injects trusted identity headers for downstream services.

Supported login methods:

- Password login.
- Google login using configured Google client ID.
- Facebook login using configured Facebook app ID/secret.

Social identities are stored separately from the base User record so one account
can be linked to provider metadata without changing internal user IDs.

## Security and session rules

- Access tokens are JWTs.
- Refresh tokens are persisted and can be revoked.
- Logout through API Gateway blacklists the access token in Redis and calls the
  user/session flow as needed.
- Known device detection reduces false suspicious-login notifications.
- Suspicious login events are emitted to Kafka for Notification.
- Password reset is token-based and sent by Notification.
- Admin user creation is separate from public signup to prevent role escalation.
- Public signup must not allow self-assigning system admin roles.

## Profile and media rules

- User profile fields are owned by User Service.
- Avatar uploads are validated by User Service and delegated to Media Service.
- Media metadata should use `USER_PROFILE/AVATAR` purpose.
- The frontend stores and displays the returned public avatar URL.
- Future S3 migration should not change the user profile API contract.

## Main API contracts

Auth APIs:

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/signup` | Customer-safe public signup |
| `POST` | `/api/auth/login` | Password login |
| `POST` | `/api/auth/google` | Google login |
| `POST` | `/api/auth/facebook` | Facebook login |
| `POST` | `/api/auth/apple` | Apple login, only if enabled/configured |
| `POST` | `/api/auth/refresh` | Refresh access token |
| `POST` | `/api/auth/logout` | Logout current session |
| `POST` | `/api/auth/logout-all` | Revoke all sessions |

User APIs:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/users/profile` | Read current profile |
| `PUT` | `/api/users/profile` | Update current profile |
| `POST` | `/api/users/profile/avatar` | Upload avatar |
| `DELETE` | `/api/users/profile/avatar` | Remove avatar |
| `GET` | `/api/users/preferences` | Read preferences |
| `PATCH` | `/api/users/preferences` | Update preferences |
| `GET` | `/api/users` | Admin user list |
| `POST` | `/api/users` | Admin create user |
| `DELETE` | `/api/users/{id}` | Admin delete user |
| `POST` | `/api/users/change-password` | Change current password |
| `POST` | `/api/users/forgot-password` | Request reset email |
| `POST` | `/api/users/reset-password` | Complete password reset |
| `GET` | `/api/users/sessions` | List sessions |
| `DELETE` | `/api/users/sessions/{deviceId}` | Revoke one device |

Internal APIs:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/internal/users/{userId}` | Service-to-service user lookup |
| `GET` | `/api/internal/users/token-version/{userId}` | Token version lookup |

## Notification events

User Service emits security and account events for Notification:

- Password reset requested.
- Suspicious login detected.
- Future account status/security notifications.

Events should include stable idempotency keys so Notification can safely retry.
