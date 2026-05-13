# 🚀 User Service

## 📌 Overview

User Service is responsible for managing user-related operations in the system.

It handles:

- User profile management
- Password management (change, reset)
- Session management (multi-device)
- Security-related actions (session invalidation)
- User data retrieval

This service works closely with the **Auth Service** and relies on the **API Gateway** for authentication.

---

## 🧠 Architecture


Client → API Gateway → User Service → Database


### Responsibilities

- **API Gateway**
  - Validates JWT
  - Injects user context (`X-User-Id`)
  
- **User Service**
  - Handles user business logic
  - Does NOT parse JWT
  - Trusts Gateway headers

---

## 🔐 Security Model

### Trust Boundary


✔ Trust: API Gateway
❌ Do NOT trust: Client headers


User identity is passed via:


X-User-Id


---

## 📦 Features

---

### 1. Get Current User Profile


GET /api/users/me


Returns the authenticated user's profile.

---

### 2. Update Profile


PUT /api/users/me


Allows updating:

- fullName
- phone

---

### 3. Get User by ID


GET /api/users/{id}


Used for internal/admin purposes.

---

### 4. Get Users (Pagination)


GET /api/users


Supports pageable queries.

---

## 🔑 Password Management

---

### 5. Change Password


POST /api/users/change-password


Flow:

Validate current password
Ensure new password != old password
Hash new password
Invalidate all sessions & tokens

---

### 6. Forgot Password


POST /api/users/forgot-password


Flow:

Accept email
If user exists:
→ generate reset token
→ store hashed token
→ set expiry (15 minutes)
Send email (async)

Security:


✔ Prevents email enumeration (silent response)


---

### 7. Reset Password


POST /api/users/reset-password


Flow:

Hash incoming token
Validate token exists
Check expiration
Update password
Clear reset token
Invalidate all sessions

---

## 📱 Session Management

---

### 8. Get Active Sessions


GET /api/users/sessions


Returns list of active devices:

- deviceId
- IP address
- userAgent
- lastActive

---

### 9. Logout Specific Device


DELETE /api/users/sessions/{deviceId}


Flow:


✔ Remove session
✔ Revoke refresh tokens for that device


---

### 10. Logout All Devices


POST /api/users/logout-all


Flow:


✔ Revoke all refresh tokens
✔ Delete all sessions
✔ Increment tokenVersion


---

## 🗄️ Data Model

---

### User

| Field | Description |
|------|------------|
| id | Primary key |
| email | Unique identifier |
| password | Hashed password |
| fullName | User name |
| phone | Phone number |
| role | User role |
| verified | Email verified flag |
| active | Account status |
| tokenVersion | Used for JWT invalidation |
| resetTokenHash | Hashed reset token |
| resetTokenExpiry | Expiry timestamp |

---

### Session

| Field | Description |
|------|------------|
| user_id | User reference |
| deviceId | Device identifier |
| ipAddress | IP address |
| userAgent | Device/browser info |
| lastActive | Last activity |

---

## 🔥 Security Features

---

### Password Hashing

- Uses BCrypt
- Never stores raw passwords

---

### Reset Token Security


✔ Token stored as HASH
✔ Raw token sent via email only
✔ Short expiry (15 min)


---

### Session Invalidation

Triggered when:

- Password change
- Password reset

Actions:


✔ Revoke all refresh tokens
✔ Delete all sessions
✔ Increment tokenVersion


---

### Anti-Enumeration Protection


✔ Forgot password does NOT reveal if email exists


---

## ⚙️ Key Design Decisions

---

### Use UserId Instead of Email


✔ Avoid header spoofing
✔ More secure & consistent


---

### Separate Auth vs User Responsibility

| Auth Service | User Service |
|-------------|-------------|
| Login / Signup | Profile |
| Token management | User data |
| Security logic | Session management |

---

### Token Versioning


✔ Allows global logout
✔ Invalidates all existing JWTs


---

## 🧪 Testing Coverage

- Get profile
- Update profile
- Change password
- Forgot password
- Reset password
- Session listing
- Logout device
- Logout all

---

## 🚀 Production Readiness

- Stateless (JWT handled at Gateway)
- Secure password handling
- Multi-device session support
- Token invalidation strategy
- Clean separation of concerns

---

## 🔮 Future Improvements

- Email verification flow
- Profile image upload
- Account locking mechanism
- Rate limiting (forgot password)
- OTP-based password reset
- Trusted device management

---

## 🎯 Summary

User Service is designed as a **secure, scalable user management system** that complements the Auth Service.

It focuses on:

- Strong password security
- Session control across devices
- Safe password reset flows
- Clean separation from authentication logic

---
