# 🚀 API Gateway

## 📌 Overview

API Gateway acts as the **single entry point** for all client requests in the system.

It is responsible for:

- JWT validation
- User context propagation (headers)
- Token blacklist (logout handling)
- Rate limiting
- Request tracing
- Routing requests to downstream services

---

## 🧠 Architecture

---

## 🔄 Request Flow

Client sends request with JWT
Gateway validates token
Extract user info (userId, email, roles)
Inject headers
Apply rate limiting
Forward request to service

---

## 🔐 Security Responsibilities

---

### 1. JWT Validation

- Parse JWT using `JwtUtil`
- Validate signature & expiration
- Reject invalid tokens

---

### 2. User Context Injection

After validation, Gateway injects headers:


X-User-Id
X-User-Email
X-User-Roles
X-Trace-Id


👉 Used by downstream services instead of parsing JWT again

---

### ⚠️ Header Spoofing Protection (IMPORTANT)

Before injecting headers:


✔ Remove incoming X-User-* headers from client
✔ Only trust JWT


---

### 3. Token Blacklist (Logout)

- When user logs out → token stored in Redis blacklist
- Gateway checks blacklist before forwarding request


✔ If token in blacklist → reject request


---

### 4. Rate Limiting

Implemented using Redis:


Key: rl:{userId or ip}:{path}
Limit: 20 requests / 60 seconds


If exceeded:


HTTP 429 - Too Many Requests


---

### 5. Request Tracing

Each request gets a unique:


X-Trace-Id


Used for:

- Debugging
- Log correlation
- Distributed tracing

---

## 🧩 Components

---

### JwtUtil

Responsibilities:

- Parse JWT
- Extract claims:
  - email
  - userId
  - roles
- Validate expiration

---

### TokenBlacklistService

- Store token in Redis with TTL
- TTL = remaining token lifetime

---

### RedisRateLimitFilter

- Count requests per key
- Block if threshold exceeded

---

### TraceIdFilter

- Generate unique traceId per request
- Store in MDC (logging context)

---

## 🧪 Example Flow

---

### Request

```http
GET /api/users/me
Authorization: Bearer <token>
``` id="gw-example-req"

---

### Gateway Processing


✔ Validate token
✔ Check blacklist
✔ Extract claims
✔ Inject headers


---

### Forwarded Request

```http
GET /api/users/me
X-User-Id: 123
X-User-Email: john@example.com
X-User-Roles: ROLE_CUSTOMER
X-Trace-Id: abc-xyz
``` id="gw-example-forward"

---

## 🚨 Security Considerations

---

### Prevent Header Spoofing

```text
❌ Client sends X-User-Id manually
✔ Gateway overrides or removes it
``` id="gw-security-1"

---

### Stateless Authentication

- No session stored at Gateway
- All auth handled via JWT

---

### Token Revocation Strategy

- Access token → blacklist at Gateway
- Refresh token → handled at Auth Service

---

## ⚙️ Design Decisions

---

### JWT Validation at Gateway

- Avoid duplicate validation in services
- Improve performance

---

### Header-Based Context

- Lightweight communication
- Avoid passing JWT internally

---

### Redis for Rate Limiting

- Fast
- Distributed
- Scalable

---

### Blacklist Instead of DB Check

- Avoid DB hit per request
- O(1) lookup in Redis

---

## 🧪 Testing

---

### Test Cases

- Valid token → success
- Expired token → reject
- Blacklisted token → reject
- Missing token → reject
- Rate limit exceeded → 429

---

## 🚀 Production Readiness

- Stateless & scalable
- Centralized security layer
- Redis-backed rate limiting
- Token blacklist support
- Distributed tracing ready
- Circuit breaker

---

## 🔮 Future Improvements

- Sliding window rate limiting
- IP-based geo blocking
- WAF integration
- Request caching

---

## 🎯 Summary

The API Gateway centralizes authentication, security, and traffic control, ensuring:

- Secure request handling
- Consistent user context
- Scalable microservice communication