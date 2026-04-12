# Soul Card Mobile Backend - Quick Start Guide

## 🚀 What's New - JWT Authentication System (Option C)

This update implements a **production-ready JWT authentication system** specifically designed for mobile applications with:

✅ **Dual Token System** - Access tokens (1h) + Refresh tokens (7d)
✅ **Password Security** - Bcrypt hashing with 10 salt rounds
✅ **Protected Routes** - JWT Guard for authorized endpoints
✅ **Rate Limiting** - Global throttling to prevent abuse
✅ **Standardized Responses** - Consistent API format for mobile apps
✅ **Token Refresh** - Maintain long-lived sessions without re-login
✅ **CORS Configured** - Multi-device mobile support

---

## 📋 Prerequisites

- Node.js v20+ (currently v23.2.0)
- NPM v10+
- MongoDB Atlas account (already configured)
- Postman (for testing - optional)

---

## ⚙️ Installation & Setup

### 1. Install & Update Dependencies

```powershell
npm install --legacy-peer-deps
```

### 2. Verify Environment Variables

Check `.env` file has these JWT secrets:

```env
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_2024
JWT_REFRESH_SECRET=your_refresh_token_secret_key_change_in_production
```

**⚠️ IMPORTANT**: Change these in production!

### 3. Build the Project

```powershell
npm run build
```

### 4. Run the Server

```powershell
npm run start
```

Expected output:

```
🚀 Server running on port 3000
📊 Database: MongoDB Atlas
🔐 JWT Authentication: Enabled
⚡ Rate Limiting: Enabled
```

---

## 🧪 Quick Testing

### Option 1: Using Postman

1. Import `Soul_Card_Auth_API.postman_collection.json`
2. Set `base_url` variable to `http://localhost:3000`
3. Run endpoints in order: Signup → Login → Get User

### Option 2: Using cURL

**Register a new user:**

```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "confirmPassword": "SecurePass123!",
    "termsAccepted": true
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "username": "johndoe",
      "email": "john@example.com"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

**Copy the accessToken and use it for protected routes:**

```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

---

## 📁 New Files Created

```
src/
├── auth/
│   ├── strategies/jwt.strategy.ts         JWT validation strategy
│   ├── guards/jwt.guard.ts                Route protection guard
│   └── dto/auth-response.dto.ts          Response DTOs with validation
├── common/
│   ├── middleware/rate-limit.middleware.ts  Rate limiting (100 req/15min)
│   └── interceptors/transform.interceptor.ts  Response standardization
├── main.ts                               [UPDATED] Added interceptor
├── app.module.ts                         [UPDATED] Added middleware
└── auth/
    ├── auth.service.ts                   [UPDATED] JWT generation, password hashing
    ├── auth.controller.ts                [UPDATED] Added refresh & /me endpoints
    └── auth.module.ts                    [UPDATED] JWT & Passport modules

Documentation:
├── JWT_IMPLEMENTATION.md                 Complete JWT guide
└── Soul_Card_Auth_API.postman_collection.json  Postman tests
```

---

## 🔐 Security Features Implemented

| Feature              | Details                                                |
| -------------------- | ------------------------------------------------------ |
| **Password Hashing** | Bcrypt with 10 salt rounds (industry standard)         |
| **Access Token**     | 1 hour lifetime - short-lived, low risk                |
| **Refresh Token**    | 7 days lifetime - stored securely in Keychain/Keystore |
| **Rate Limiting**    | 100 requests per 15 minutes per IP                     |
| **Protected Routes** | JWT validation on all protected endpoints              |
| **CORS**             | Configured for cross-device mobile scenarios           |
| **Password Reset**   | Secure token-based reset flow                          |

---

## 🧠 How It Works

### 1. User Registration

```
Signup Request → Validate Input → Hash Password (Bcrypt)
→ Store in MongoDB → Generate JWT Tokens → Return Tokens
```

### 2. User Login

```
Login Request → Find User → Verify Password → Generate JWT Tokens
→ Return Tokens with 1h and 7d expiration
```

### 3. Protected API Calls

```
API Request + Access Token → JWT Guard Validates → Extract User
→ Process Request → Return Data
```

### 4. Token Refresh

```
Refresh Request + Old Token → Validate Refresh Token
→ Generate New Access Token (7d still valid) → Return New Token
```

### 5. Session Persistence (Mobile App)

```
App Start → Check Stored Refresh Token → If Valid, Refresh Access Token
→ Auto-login User → If Expired, Show Login Screen
```

---

## 📱 Mobile App Integration Example (React Native)

```javascript
// Save tokens after login
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const handleLogin = async (email, password) => {
  try {
    const response = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    // Store tokens securely
    await SecureStore.setItemAsync('accessToken', data.data.accessToken);
    await SecureStore.setItemAsync('refreshToken', data.data.refreshToken);

    // Set expiration time
    await AsyncStorage.setItem(
      'tokenExpiration',
      (Date.now() + data.data.expiresIn * 1000).toString(),
    );
  } catch (error) {
    console.error('Login failed:', error);
  }
};

// Auto-refresh token when needed
const getAuthToken = async () => {
  const token = await SecureStore.getItemAsync('accessToken');
  const expiration = await AsyncStorage.getItem('tokenExpiration');

  if (Date.now() > parseInt(expiration)) {
    // Token expired, refresh it
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    const response = await fetch('http://localhost:3000/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();
    await SecureStore.setItemAsync('accessToken', data.data.accessToken);
    return data.data.accessToken;
  }

  return token;
};

// Use token in API calls
const fetchUserData = async () => {
  const token = await getAuthToken();
  const response = await fetch('http://localhost:3000/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
};
```

---

## 🛠️ Available Commands

```bash
# Install dependencies
npm install --legacy-peer-deps

# Build project (TypeScript → JavaScript)
npm run build

# Run in development mode (with auto-reload)
npm run start:dev

# Run in production mode
npm run start

# Run tests
npm run test

# Run end-to-end tests
npm run test:e2e

# Format code
npm run format

# Lint code
npm run lint
```

---

## 🚨 Troubleshooting

### Issue: "Unauthorized" error

**Solution**: Ensure access token is included in `Authorization: Bearer` header

### Issue: Token keeps expiring

**Solution**: This is expected! Access tokens expire after 1 hour. Use refresh token to get new one.

### Issue: Refresh token doesn't work

**Solution**: Refresh tokens expire after 7 days. User must login again.

### Issue: Rate limit (429 error)

**Solution**: Wait 15 minutes or reduce request frequency

### Issue: "Can't find module" errors

**Solution**: Run `npm install --legacy-peer-deps` again

### Issue: Database connection fails

**Solution**: Check `.env` MONGODB_URI is correct and MongoDB Atlas is running

---

## 📚 API Endpoints

| Endpoint                | Method | Auth | Purpose              |
| ----------------------- | ------ | ---- | -------------------- |
| `/auth/signup`          | POST   | ❌   | Create account       |
| `/auth/login`           | POST   | ❌   | Login user           |
| `/auth/refresh`         | POST   | ❌   | Get new access token |
| `/auth/forgot-password` | POST   | ❌   | Reset password       |
| `/auth/me`              | GET    | ✅   | Get current user     |

---

## 🎯 Next Steps

1. **Test all endpoints** using Postman collection
2. **Integrate with your mobile app** (iOS/Android/React Native)
3. **Implement auto-logout** when refresh token expires
4. **Add password change endpoint** (not yet implemented)
5. **Add email verification** (not yet implemented)
6. **Deploy to production** and update JWT_SECRET

---

## 📖 Documentation Files

- **JWT_IMPLEMENTATION.md** - Complete JWT authentication guide
- **ARCHITECTURE.md** - System architecture overview
- **DATABASE_SETUP.md** - Database configuration

---

## ✅ Verification Checklist

- [ ] Dependencies installed: `npm install --legacy-peer-deps`
- [ ] .env file has JWT secrets configured
- [ ] MongoDB Atlas connection working
- [ ] Server starts without errors: `npm run start`
- [ ] Can signup at `POST /auth/signup`
- [ ] Can login at `POST /auth/login`
- [ ] Tokens returned in response
- [ ] Access token works for protected route `GET /auth/me`
- [ ] Rate limiting working (test with rapid requests)
- [ ] Mobile app can store and use tokens

---

## 🎉 You're Ready!

Your mobile backend is now production-ready with enterprise-grade JWT authentication. The system is secured, scalable, and optimized for mobile apps.

**Happy coding! 🚀**
