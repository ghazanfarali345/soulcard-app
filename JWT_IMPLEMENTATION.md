# JWT Authentication Implementation Guide

## Overview

This backend implements complete JWT-based authentication optimized for mobile app backends with the following features:

✅ **Access & Refresh Tokens** - Dual-token system for secure sessions
✅ **Token Refresh Endpoint** - Maintain long-lived sessions without re-login
✅ **Password Hashing** - Bcrypt with salt for secure password storage
✅ **JWT Guards** - Protected routes with automatic token validation
✅ **Rate Limiting** - Global request throttling to prevent brute-force attacks
✅ **Standardized Responses** - Consistent API response format for mobile apps
✅ **CORS & Security** - Configured for multi-device mobile scenarios

---

## Authentication Flow

### 1. User Signup

```
POST /auth/signup
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "confirmPassword": "SecurePassword123!",
  "termsAccepted": true
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "username": "john_doe",
      "email": "john@example.com"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

### 2. User Login

```
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "username": "john_doe",
      "email": "john@example.com"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

### 3. Using Access Token

All subsequent requests must include the access token in the Authorization header:

```
GET /auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "username": "john_doe"
  }
}
```

### 4. Refresh Access Token

When access token expires (after 1 hour), use refresh token to get new access token:

```
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

---

## Environment Variables

Set these in your `.env` file:

```env
# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_2024
JWT_EXPIRATION=1h                    # Access token expiration (short-lived)
JWT_REFRESH_SECRET=your_refresh_token_secret_key_change_in_production
JWT_REFRESH_EXPIRATION=7d            # Refresh token expiration (long-lived)

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000          # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100          # Max 100 requests per window
```

**CRITICAL for Production:**

- Change `JWT_SECRET` to a strong, unique value
- Change `JWT_REFRESH_SECRET` to a strong, unique value
- Use environment-specific secrets in AWS Secrets Manager or similar

---

## Token Details

### Access Token

- **Purpose**: Short-lived token for API requests
- **Lifetime**: 1 hour (configurable)
- **Contains**: User ID, email, username
- **Usage**: Include in `Authorization: Bearer <token>` header
- **When Expired**: Use refresh token to get new access token

### Refresh Token

- **Purpose**: Long-lived token to maintain sessions
- **Lifetime**: 7 days (configurable)
- **Contains**: User ID, email, username
- **Usage**: Send to `/auth/refresh` endpoint to get new access token
- **When Expired**: User must login again
- **Storage (Mobile App)**: Store securely in iOS Keychain or Android Keystore

---

## Mobile App Implementation

### iOS (Swift) Example

```swift
// Save tokens after login
let accessToken = response.data.accessToken
let refreshToken = response.data.refreshToken

// Store refreshToken in Keychain (secure)
KeychainManager.save(refreshToken, for: "refresh_token")

// API call with access token
var request = URLRequest(url: url)
request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")

// Handle token expiration
if response.statusCode == 401 {
    // Token expired, refresh it
    let newAccessToken = try await authService.refreshToken(refreshToken)
    // Retry original request with new token
}
```

### Android (Kotlin) Example

```kotlin
// Save tokens after login
val accessToken = response.data.accessToken
val refreshToken = response.data.refreshToken

// Store refreshToken in Android Keystore (secure)
KeyStoreManager.saveToken(refreshToken, "refresh_token")

// API call with access token
val request = Request.Builder()
    .addHeader("Authorization", "Bearer $accessToken")
    .build()

// Handle token expiration
if (response.code == 401) {
    // Token expired, refresh it
    val newAccessToken = authService.refreshToken(refreshToken)
    // Retry original request with new token
}
```

---

## Protected Routes

Any route can be protected by adding `@UseGuards(JwtGuard)`:

```typescript
@UseGuards(JwtGuard)
@Get('profile')
getProfile(@Request() req) {
    return {
        success: true,
        data: req.user
    };
}
```

If no valid JWT token is provided:

```
HTTP 401 Unauthorized

{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

---

## Error Handling

### Invalid Credentials

```json
{
  "statusCode": 400,
  "message": "Invalid email or password",
  "error": "Bad Request"
}
```

### User Not Found

```json
{
  "statusCode": 400,
  "message": "Invalid email or password",
  "error": "Bad Request"
}
```

### Account Deactivated

```json
{
  "statusCode": 400,
  "message": "Your account has been deactivated",
  "error": "Bad Request"
}
```

### Invalid JWT Token

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### Rate Limit Exceeded

```json
{
  "statusCode": 429,
  "message": "Too many requests from this IP, please try again later.",
  "error": "Too Many Requests"
}
```

### Expired Refresh Token

```json
{
  "statusCode": 401,
  "message": "Invalid refresh token",
  "error": "Unauthorized"
}
```

---

## Rate Limiting

All API endpoints are protected by rate limiting:

- **Window**: 15 minutes (900,000 ms)
- **Limit**: 100 requests per window
- **Response Header**: `RateLimit-Remaining`, `RateLimit-Reset`

When limit exceeded:

```
HTTP 429 Too Many Requests

{
  "statusCode": 429,
  "message": "Too many requests from this IP, please try again later.",
  "error": "Too Many Requests"
}
```

---

## Security Best Practices for Mobile Apps

### 1. Token Storage

- ❌ **Never** store tokens in SharedPreferences (Android) or UserDefaults (iOS)
- ✅ **Always** store refresh token in Keychain (iOS) or Keystore (Android)
- ✅ Keep access token in memory (lost on app restart)

### 2. Token Transmission

- ✅ Use HTTPS only (enforced in production)
- ✅ Include token in `Authorization: Bearer` header
- ❌ Never include token in URL parameters or cookies for mobile

### 3. Token Expiration Handling

- ✅ Implement automatic token refresh before expiration
- ✅ Show login screen on refresh token expiration
- ✅ Clear all tokens on logout

### 4. CSRF & CORS

- ✅ CORS enabled for mobile client origins
- ✅ Credentials included in requests (`credentials: true`)
- ✅ Rate limiting prevents brute force

### 5. Password Security

- ✅ Passwords hashed with bcrypt (salt rounds: 10)
- ✅ Never send plain passwords in logs
- ✅ HTTPS enforces password encryption in transit

---

## Testing Endpoints

### Using cURL

**Signup:**

```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123!@#",
    "confirmPassword": "Test123!@#",
    "termsAccepted": true
  }'
```

**Login:**

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

**Get Current User (Protected):**

```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

**Refresh Token:**

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
  }'
```

---

## API Endpoints Summary

| Method | Endpoint                | Auth Required | Description             |
| ------ | ----------------------- | ------------- | ----------------------- |
| POST   | `/auth/signup`          | ❌            | Create new account      |
| POST   | `/auth/login`           | ❌            | Authenticate user       |
| POST   | `/auth/refresh`         | ❌            | Get new access token    |
| POST   | `/auth/forgot-password` | ❌            | Initiate password reset |
| GET    | `/auth/me`              | ✅            | Get current user info   |

---

## Troubleshooting

### Issue: "Unauthorized" after valid login

**Solution**: Ensure you're including the access token in the Authorization header

### Issue: Refresh token keeps rejecting

**Solution**: 7-day expiration - user must login again after 7 days

### Issue: Too many requests (429)

**Solution**: Wait 15 minutes before retrying or implement exponential backoff

### Issue: "Invalid email or password" but credentials are correct

**Solution**: Ensure password exactly matches (case-sensitive)

### Issue: Access token works on login but fails later

**Solution**: Token may have expired. Use refresh token to get new access token

---

## Files Modified/Created

```
src/
├── auth/
│   ├── strategies/
│   │   └── jwt.strategy.ts          [NEW] JWT validation strategy
│   ├── guards/
│   │   └── jwt.guard.ts             [NEW] Route protection guard
│   ├── dto/
│   │   ├── auth-response.dto.ts     [NEW] Standardized response DTOs
│   │   └── index.ts                 [MODIFIED] Export new DTOs
│   ├── auth.service.ts              [MODIFIED] Added JWT generation, password hashing
│   ├── auth.controller.ts           [MODIFIED] Added refresh & me endpoints
│   └── auth.module.ts               [MODIFIED] Added JWT & Passport modules
├── common/
│   ├── middleware/
│   │   └── rate-limit.middleware.ts [NEW] Rate limiting middleware
│   └── interceptors/
│       └── transform.interceptor.ts [NEW] Standardized response format
├── app.module.ts                    [MODIFIED] Added rate limit middleware
├── main.ts                          [MODIFIED] Added interceptor & enhanced CORS
.env                                 [MODIFIED] Added JWT configuration
package.json                         [MODIFIED] Added JWT & bcryptjs dependencies
```

---

## Next Steps

1. **Update your frontend/mobile app** to store and use JWT tokens
2. **Secure your JWT secrets** using environment management
3. **Test all endpoints** with the provided cURL examples
4. **Monitor token usage** in production logs
5. **Plan token rotation strategy** for long-term security
