🚀 Microservices Authentication & User Management System
🧭 Overview

This system is a production-ready authentication and user management platform built using a microservices architecture. It demonstrates strong capabilities in:

- Secure authentication (JWT + Refresh Token rotation)
- Distributed session & device tracking
- API Gateway security enforcement
- Token invalidation strategy (stateless + versioning)
- Suspicious activity detection
- Rate limiting & resilience

🏗️ Architecture
Client
   ↓
API Gateway (Security Layer)
   ↓
-------------------------------
| Auth Service   | User Service |
-------------------------------
        ↓
     PostgreSQL
        ↓
       Redis (Rate limit / blacklist)
        ↓
       Kafka (Security events)

🔐 1. AUTH SERVICE
🎯 Responsibilities
- User authentication (login/signup)
- JWT issuance (access + refresh)
- Refresh token rotation & reuse detection
- Device/session tracking
- Brute-force protection
- Suspicious login detection

🔑 Token Strategy
Access Token (JWT)
{
  "sub": "user@email.com",
  "userId": 6,
  "roles": ["ROLE_CUSTOMER"],
  "tokenVersion": 6
}

🔥 Key Design: tokenVersion
✔ stored in DB (user table)
✔ embedded into JWT
✔ validated at Gateway

👉 Enables:

✔ logout-all
✔ force logout after password change
✔ instant token invalidation (stateless)
🔁 Refresh Token Flow
Login → issue refresh token (stored hashed in DB)

Refresh:
✔ validate JWT
✔ check deviceId
✔ check revoked
✔ check expiry

Reuse detected:
→ revoke ALL tokens
→ security alert

🧠 Security Features
✔ Refresh token hashing (no raw storage)
✔ Reuse detection (anti replay attack)
✔ Device binding
✔ IP tracking
✔ Suspicious login detection
✔ Brute-force protection

🌐 2. API GATEWAY
🎯 Responsibilities
- Central authentication layer
- JWT validation
- Token invalidation enforcement
- Header injection (user context)
- Rate limiting
- Request routing

🔥 Core Security Logic
JWT Validation Flow
1. Extract token
2. Validate signature
3. Check blacklist (Redis)
4. Check expiration
5. Extract claims
6. 🔥 Validate tokenVersion (via user-service)

🔐 Token Invalidation
JWT tokenVersion = 6
DB tokenVersion  = 7

→ mismatch → reject (401)
🛡️ Anti Header Spoofing
❌ Client cannot fake:
   X-User-Id
   X-User-Email

✔ Gateway overrides headers after validation
🚦 Rate Limiting (Redis)
✔ Per user / IP
✔ Sliding window
✔ Fallback if Redis down
🔌 Service Communication
✔ Feign Client
✔ Eureka Service Discovery
✔ LoadBalancer integration

👤 3. USER SERVICE
🎯 Responsibilities
User profile management
Password management
Session invalidation
Token version control

🔥 Critical Feature: Session Invalidation
Change Password
1. Update password
2. tokenVersion++
3. Revoke all refresh tokens
4. Delete all sessions

👉 Result:

✔ ALL devices logged out
✔ ALL access tokens invalid
🔐 Password Reset Flow
1. Generate random token
2. Store HASH only
3. Expire in 15 mins
4. Reset → invalidate all sessions

🧱 4. DATABASE DESIGN
Users
✔ email (unique)
✔ password (hashed)
✔ tokenVersion (JWT invalidation)
✔ verified / active

Refresh Tokens
✔ tokenHash (NOT raw)
✔ revoked flag
✔ reused flag
✔ device binding

Sessions
✔ deviceId
✔ IP
✔ userAgent
✔ lastActive
Login Audit
✔ success / fail
✔ IP tracking
✔ used for brute-force detection

🚨 5. SECURITY DESIGN
🔥 Defense-in-depth
Layer 1: Gateway JWT validation
Layer 2: TokenVersion check
Layer 3: Refresh token control
Layer 4: Device/IP tracking
Layer 5: Audit logs

🧠 Attack Protection
Attack Type	Protection
Token theft	tokenVersion invalidation
Replay attack	refresh reuse detection
Brute force	login audit + rate limit
Header spoof	gateway override headers
Session hijack	device + IP tracking

📡 6. OBSERVABILITY
✔ Structured logging (security events)
✔ TraceId per request
✔ Kafka event for suspicious login
⚡ 7. PERFORMANCE CONSIDERATIONS

Current
Feign call per request → user-service
Optimization (planned)
✔ Redis cache tokenVersion
✔ reduce latency ~10x

🧪 8. TEST FLOW (POSTMAN)
Login
POST /api/auth/login
Access API
GET /api/users/profile
Authorization: Bearer token
Change password
POST /api/users/change-password
Reuse old token
→ 401 Unauthorized 

9. ENGINEERING DECISIONS
Why tokenVersion instead of blacklist only?
✔ Stateless
✔ scalable
✔ instant invalidation
✔ no Redis dependency required
Why hash refresh token?
✔ prevent DB leak abuse
✔ similar to password security model

Why Gateway validation?
✔ central security layer
✔ consistent enforcement
✔ reduces duplication across services

10. FUTURE IMPROVEMENTS
✔ Redis cache for tokenVersion
✔ mTLS between services
✔ API key for internal endpoints
✔ Circuit breaker (Resilience4j)
✔ Centralized logging (ELK)
✔ Distributed tracing (OpenTelemetry)
