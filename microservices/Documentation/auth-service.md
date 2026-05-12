# 🚀 Auth Service

## 📌 Overview

The Auth Service is responsible for handling authentication, authorization, and security-related operations in a microservices architecture.

It provides:

- User registration and login
- JWT-based authentication (Access + Refresh Token)
- Session and device management
- Brute-force protection
- Suspicious login detection
- Token lifecycle management (rotation, revocation, reuse detection)

---

## 🧠 Architecture
Client → API Gateway → Auth Service → Database + Kafka


### Components

- **API Gateway**
  - Validates JWT
  - Injects user context headers
  - Handles token blacklist

- **Auth Service**
  - Core authentication logic
  - Token issuance and validation
  - Security checks

- **Database**
  - Stores users, sessions, tokens, audit logs

- **Kafka**
  - Handles asynchronous security events (e.g., suspicious login)

---

## 🔐 Authentication Flow

### 1. Signup


✔ Validate input
✔ Hash password (BCrypt)
✔ Create user
✔ Create session
✔ Return access + refresh token


---

### 2. Login

Check brute-force attempts
Authenticate via Spring Security
Validate user status (active, verified)
Detect suspicious login
Save login audit
Create/update session
Generate tokens

---

### 3. Refresh Token

Validate refresh token (JWT)
Hash token and find in DB
Validate device binding
Check revoked / expired
Detect token reuse
Rotate token (invalidate old, issue new)

---

### 4. Logout


✔ Revoke refresh token
✔ Delete session (device-specific or all)
✔ Gateway blacklists access token


---

## 🔑 Token Strategy

### Access Token

- Stateless JWT
- Short-lived
- Used for API authentication
- Validated at API Gateway

---

### Refresh Token

- Stored as **hashed value** in database
- Bound to `deviceId`
- Rotated on each refresh
- Revoked after use

---

## 🔥 Security Features

---

### 1. Brute Force Protection

- Tracks failed login attempts via `LoginAudit`
- Blocks login after threshold within time window

Example:


MAX_FAILED_ATTEMPTS = 5
WINDOW = 5 minutes


Response:


HTTP 429 - Too Many Requests


---

### 2. Suspicious Login Detection

Triggered when:

- Login from a new device
- Login from a new IP address
- Multiple failed attempts followed by success

---

### Actions

- Log structured security alert
- Publish Kafka event
- Trigger email notification

---

### 3. Refresh Token Reuse Detection (CRITICAL)

If a refresh token is reused:


✔ Mark token as reused
✔ Revoke ALL sessions
✔ Force logout across all devices


Prevents:

- Token theft
- Replay attacks

---

### 4. Device Binding

- Each session is tied to a `deviceId`
- Refresh token must match the same device

---

### 5. Audit Logging

- Tracks login success and failure
- Stored in `login_audit` table
- Uses **separate transaction (REQUIRES_NEW)** to avoid rollback

Used for:

- Brute-force detection
- Security analytics

---

## 🗄️ Database Design

---

### Users

| Field | Description |
|------|------------|
| id | Primary key |
| email | Unique login identifier |
| password | Hashed password |
| role | User role |
| verified | Email verification flag |
| active | Account status |
| tokenVersion | Used for global logout |
| lastLogin | Last login timestamp |

---

### Sessions

| Field | Description |
|------|------------|
| user_id | User reference |
| deviceId | Device identifier |
| ipAddress | Login IP |
| userAgent | Browser/device info |
| lastActive | Last activity timestamp |

---

### Refresh Tokens

| Field | Description |
|------|------------|
| tokenHash | Hashed token |
| revoked | Token revoked flag |
| reused | Reuse detection flag |
| deviceId | Bound device |
| expiresAt | Expiration time |

---

### Login Audit

| Field | Description |
|------|------------|
| email | User email |
| success | Login success/failure |
| ipAddress | IP address |
| userAgent | Device info |
| createdAt | Timestamp |

---

## 📡 Kafka Integration

**Topic:**

security.suspicious-login


Used for:

- Sending warning emails
- Triggering security workflows
- Monitoring suspicious activities

---

## ⚙️ Key Design Decisions

---

### Hash Refresh Token

- Prevents token leakage
- Only hashed version stored in DB

---

### Token Rotation

- New refresh token issued on every refresh
- Old token revoked immediately

---

### Separate Audit Transaction

- Ensures logs are always saved
- Prevents rollback when login fails

---

### Device-Based Session

- Supports multi-device login
- Enables suspicious login detection

---

## 🧪 Testing Coverage

- Login success / failure
- Brute-force protection
- Suspicious login detection
- Token reuse detection
- Device mismatch
- Token expiration
- Logout flow

---

## 🚀 Production Readiness

- Stateless authentication (JWT)
- Scalable microservice architecture
- Event-driven (Kafka)
- Secure token lifecycle
- Full audit logging
- Device-aware sessions

---

## 🔮 Future Improvements

- OTP verification for new devices (GitHub-style)
- Redis-based brute-force protection
- CAPTCHA after multiple failures
- Trusted device management
- Limit concurrent sessions per user

---

## 🎯 Summary

This Auth Service is designed as a **production-ready authentication system** with strong security mechanisms, scalable architecture, and real-world protection against common attack vectors.

---