# API Documentation: Admin Account Management (RBAC)

**Version:** 1.2 (Security Enhancements)  
**Last Updated:** 2025-01-11

## Overview

This document describes all API endpoints for the Admin Account Management module with Role-Based Access Control (RBAC). All endpoints require authentication and appropriate permissions.

## Authentication

All endpoints require authentication via NextAuth session token (HTTP-only cookie). The session includes:
- User ID
- Role
- Permissions
- Token Version (V1.2: for token revocation)

### Request Headers

```http
Cookie: next-auth.session-token=<session-token>
```

All responses use standard HTTP status codes and return JSON.

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "code": "ERROR_CODE",
  "message": "Human-readable error message"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_REQUIRED` | 401 | User not authenticated |
| `USER_NOT_FOUND` | 401 | User does not exist in database |
| `USER_LOCKED` | 403 | User account is locked (is_active = false) |
| `TOKEN_REVOKED` | 401 | Token has been revoked (V1.2: token_version mismatch) |
| `MUST_CHANGE_PASSWORD` | 403 | User must change password before continuing |
| `PERMISSION_DENIED` | 403 | User lacks required permission |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests (rate limiting) |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Authentication Endpoints

### POST /api/admin/auth/login

Login with username and password.

**Permissions:** None (public endpoint)

**Rate Limiting:** 5 attempts per 15 minutes per IP:username combination

**Request Body:**
```json
{
  "username": "admin",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "username": "admin",
      "email": "admin@example.com",
      "full_name": "Admin User",
      "role": "SUPER_ADMIN",
      "must_change_password": false
    },
    "requireChangePassword": false
  }
}
```

**Error Response (401/403):**
```json
{
  "success": false,
  "code": "INVALID_CREDENTIALS",
  "message": "Tên đăng nhập hoặc mật khẩu không đúng"
}
```

**Rate Limit Response (429):**
```json
{
  "success": false,
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Quá nhiều lần thử. Vui lòng thử lại sau 15 phút",
  "retryAfter": 900
}
```

**Notes:**
- Updates `last_login` timestamp on success
- Logs `AdminAction.LOGIN` activity
- If `must_change_password` is true, client should redirect to change password page
- Creates NextAuth session after successful validation

---

### POST /api/admin/auth/logout

Logout current session (audit logging).

**Permissions:** Any authenticated user

**Request Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Notes:**
- Logs `AdminAction.LOGOUT` activity
- Actual session clearing is handled client-side via NextAuth's `signOut()`

---

### GET /api/admin/auth/me

Get current authenticated user information.

**Permissions:** Any authenticated user

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "admin",
    "email": "admin@example.com",
    "full_name": "Admin User",
    "role": "SUPER_ADMIN",
    "permissions": ["*"],
    "is_active": true,
    "must_change_password": false,
    "last_login": "2025-01-11T10:30:00.000Z",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-11T10:30:00.000Z"
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "code": "AUTH_REQUIRED",
  "message": "Yêu cầu đăng nhập"
}
```

---

### POST /api/admin/auth/change-password

Change password for current authenticated user.

**Permissions:** Any authenticated user (their own password)

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "NewSecurePassword123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Mật khẩu mới phải có ít nhất 8 ký tự"
}
```

**Error Response (401):**
```json
{
  "success": false,
  "code": "INVALID_PASSWORD",
  "message": "Mật khẩu hiện tại không đúng"
}
```

**Notes:**
- **V1.2:** Increments `token_version` to force logout from all devices
- Logs `AdminAction.CHANGE_PASSWORD` activity
- Validates password strength (min 8 chars, uppercase, lowercase, number)

---

### POST /api/admin/auth/logout-all (V1.2)

Force logout from all devices by revoking all tokens.

**Permissions:** Any authenticated user (their own account)

**Request Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out from all devices"
}
```

**Notes:**
- **V1.2:** Increments `token_version` for the authenticated user
- Logs `AdminAction.LOGOUT_ALL_DEVICES` activity
- All active sessions become invalid immediately
- Client should redirect to login page after calling this endpoint

---

## User Management Endpoints

All user management endpoints require `SUPER_ADMIN` permission.

### GET /api/admin/users

List admin users with pagination, search, and filters.

**Permissions:** `admin:manage` (SUPER_ADMIN only)

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20) - Items per page
- `search` (string, optional) - Search by username, email, or full_name
- `role` (string, optional) - Filter by role (SUPER_ADMIN, PRODUCT_MANAGER, etc.)
- `is_active` (boolean, optional) - Filter by active status

**Example Request:**
```
GET /api/admin/users?page=1&limit=20&search=admin&role=SUPER_ADMIN&is_active=true
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "username": "admin",
        "email": "admin@example.com",
        "full_name": "Admin User",
        "role": "SUPER_ADMIN",
        "is_active": true,
        "must_change_password": false,
        "last_login": "2025-01-11T10:30:00.000Z",
        "createdAt": "2025-01-01T00:00:00.000Z"
      }
    ],
    "total": 10,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

### POST /api/admin/users

Create a new admin user.

**Permissions:** `admin:manage` (SUPER_ADMIN only)

**Request Body:**
```json
{
  "username": "newadmin",
  "email": "newadmin@example.com",
  "password": "SecurePassword123!",
  "full_name": "New Admin",
  "role": "PRODUCT_MANAGER",
  "permissions": ["product:read", "product:update"],
  "is_active": true
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "username": "newadmin",
    "email": "newadmin@example.com",
    "full_name": "New Admin",
    "role": "PRODUCT_MANAGER",
    "is_active": true,
    "must_change_password": true,
    "createdAt": "2025-01-11T10:30:00.000Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Username already exists"
}
```

**Notes:**
- Sets `must_change_password: true` by default
- Sets `token_version: 0`
- Sets `created_by` to current user's ID
- Logs `AdminAction.CREATE_USER` activity
- Validates password strength and unique username/email

---

### GET /api/admin/users/[id]

Get details of a specific admin user.

**Permissions:** `admin:manage` (SUPER_ADMIN only)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "admin",
    "email": "admin@example.com",
    "full_name": "Admin User",
    "role": "SUPER_ADMIN",
    "permissions": ["*"],
    "is_active": true,
    "must_change_password": false,
    "last_login": "2025-01-11T10:30:00.000Z",
    "created_by": null,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-11T10:30:00.000Z"
  }
}
```

---

### PUT /api/admin/users/[id]

Update admin user information.

**Permissions:** `admin:manage` (SUPER_ADMIN only)

**Request Body:**
```json
{
  "full_name": "Updated Name",
  "role": "ORDER_MANAGER",
  "permissions": ["order:read", "order:update"],
  "is_active": true
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "admin",
    "email": "admin@example.com",
    "full_name": "Updated Name",
    "role": "ORDER_MANAGER",
    "is_active": true,
    "updatedAt": "2025-01-11T10:30:00.000Z"
  }
}
```

**Notes:**
- Users cannot modify their own `role` or `is_active` status
- Logs `AdminAction.UPDATE_USER` with old and new values

---

### DELETE /api/admin/users/[id]

Soft delete admin user (set `is_active = false`).

**Permissions:** `admin:manage` (SUPER_ADMIN only)

**Success Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Notes:**
- Users cannot delete their own account
- Logs `AdminAction.DELETE_USER` activity

---

### PUT /api/admin/users/[id]/reset-password

Reset password for a specific user (SUPER_ADMIN only).

**Permissions:** `admin:manage` (SUPER_ADMIN only)

**Request Body:**
```json
{
  "new_password": "NewSecurePassword123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Notes:**
- **V1.2:** Increments `token_version` to force logout the user from all devices
- Sets `must_change_password: true`
- Logs `AdminAction.RESET_PASSWORD` activity
- Validates password strength

---

### POST /api/admin/users/[id]/force-logout (V1.2)

Force logout a specific user from all devices.

**Permissions:** `admin:manage` (SUPER_ADMIN only)

**Request Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "message": "User logged out from all devices"
}
```

**Notes:**
- **V1.2:** Increments `token_version` for the target user
- Logs `AdminAction.FORCE_LOGOUT_USER` activity
- All active sessions for the user become invalid immediately

---

## Permission-Based API Endpoints

All admin APIs are protected with RBAC middleware. Here are the permission requirements:

### Products APIs

| Endpoint | Method | Required Permission |
|----------|--------|---------------------|
| `/api/admin/products` | GET | `product:read` |
| `/api/admin/products` | POST | `product:create` |
| `/api/admin/products/[id]` | GET | `product:read` |
| `/api/admin/products/[id]` | PUT | `product:update` |
| `/api/admin/products/[id]` | DELETE | `product:delete` |

### Orders APIs

| Endpoint | Method | Required Permission |
|----------|--------|---------------------|
| `/api/admin/orders` | GET | `order:read` |
| `/api/admin/orders/[id]` | PUT | `order:update` |

### Categories APIs

| Endpoint | Method | Required Permission |
|----------|--------|---------------------|
| `/api/admin/categories` | GET | `category:read` |
| `/api/admin/categories` | POST | `category:manage` |
| `/api/admin/categories/[id]` | PUT | `category:manage` |
| `/api/admin/categories/[id]` | DELETE | `category:manage` |

### Media APIs

| Endpoint | Method | Required Permission |
|----------|--------|---------------------|
| `/api/admin/media` | GET | `media:read` |
| `/api/admin/media` | POST | `media:upload` |
| `/api/admin/media/[id]` | GET | `media:read` |
| `/api/admin/media/[id]` | PUT | `media:upload` |
| `/api/admin/media/[id]` | DELETE | `media:upload` |

### Posts/Blog APIs

| Endpoint | Method | Required Permission |
|----------|--------|---------------------|
| `/api/admin/posts` | GET | `blog:read` |
| `/api/admin/posts` | POST | `blog:manage` |
| `/api/admin/posts/[id]` | GET | `blog:read` |
| `/api/admin/posts/[id]` | PUT | `blog:manage` |
| `/api/admin/posts/[id]` | DELETE | `blog:manage` |

---

## Token Revocation (V1.2)

### Mechanism

Each user has a `token_version` field in the database. When tokens are revoked:
1. The `token_version` is incremented
2. All JWT tokens with the old `token_version` become invalid
3. Users must re-authenticate to get a new token with the updated version

### When Tokens Are Revoked

1. **Password Change:** When a user changes their password
2. **Force Logout All Devices:** When user clicks "Logout All Devices"
3. **Admin Reset Password:** When SUPER_ADMIN resets a user's password
4. **Admin Force Logout:** When SUPER_ADMIN force logs out a user

### Token Version Check

The token version is checked in:
- **JWT Callback:** Light check (may be cached)
- **API Middleware:** Full check on every request (with `withAuthAdmin`)

---

## Rate Limiting

### Login Endpoint

- **Limit:** 5 attempts per 15 minutes
- **Scope:** Per IP address + username combination
- **Storage:** MongoDB-based (shared across all serverless instances)
- **Auto-cleanup:** TTL index automatically removes expired entries
- **Response:** 429 Too Many Requests with `retryAfter` (seconds)

**Note:** Rate limiting uses MongoDB for persistence, ensuring it works correctly in serverless environments (Vercel) where multiple instances may handle requests.

Example:
```json
{
  "success": false,
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Quá nhiều lần thử. Vui lòng thử lại sau 15 phút",
  "retryAfter": 900
}
```

---

## Audit Logging

All significant actions are logged to `admin_activity_logs` collection:

| Action | Description |
|--------|-------------|
| `LOGIN` | User logged in |
| `LOGOUT` | User logged out |
| `CHANGE_PASSWORD` | User changed password |
| `LOGOUT_ALL_DEVICES` | User logged out from all devices |
| `CREATE_USER` | SUPER_ADMIN created a user |
| `UPDATE_USER` | SUPER_ADMIN updated a user |
| `DELETE_USER` | SUPER_ADMIN deleted a user |
| `RESET_PASSWORD` | SUPER_ADMIN reset a user's password |
| `FORCE_LOGOUT_USER` | SUPER_ADMIN force logged out a user |

Audit log entry structure:
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "admin_id": "507f1f77bcf86cd799439012",
  "action": "CREATE_USER",
  "target_collection": "admin_users",
  "target_id": "507f1f77bcf86cd799439013",
  "metadata": {
    "username": "newadmin",
    "role": "PRODUCT_MANAGER"
  },
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "createdAt": "2025-01-11T10:30:00.000Z"
}
```

---

## Session Management (V1.2)

### Cookie Security

Session cookies are configured with:
- `httpOnly: true` - Prevents JavaScript access
- `secure: true` - HTTPS only (in production)
- `sameSite: 'strict'` - CSRF protection

### Session Expiration

Sessions are managed by NextAuth.js and expire based on:
- JWT max age (configurable in `authOptions`)
- Server-side token version check (V1.2)

---

## Testing

See `docs/ADMIN_ACCOUNT_RBAC_USER_GUIDE.md` for user-facing documentation.

For integration tests, run:
```bash
npm run test:admin-rbac
```
