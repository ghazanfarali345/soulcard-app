# Authentication Module - Quick Reference

## 📁 File Structure

```
src/auth/
├── dto/
│   ├── login.dto.ts              # Validates login requests (email, password)
│   ├── signup.dto.ts             # Validates signup requests (username, email, password, etc.)
│   ├── forgot-password.dto.ts    # Validates forgot password requests
│   └── index.ts                  # Exports all DTOs
├──
 entities/
│   └── user.entity.ts            # User data structure definition
├── auth.controller.ts            # HTTP endpoints definition
├── auth.service.ts               # Authentication business logic
└── auth.module.ts                # Auth module configuration
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run start:dev
```

### 3. Test Endpoints

#### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SecurePass123"}'
```

#### Signup

```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username":"john_doe",
    "email":"newuser@example.com",
    "password":"SecurePass123",
    "confirmPassword":"SecurePass123",
    "termsAccepted":true
  }'
```

#### Forgot Password

```bash
curl -X POST http://localhost:3000/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

## 📋 API Endpoints

| Method | Endpoint                | Purpose                |
| ------ | ----------------------- | ---------------------- |
| POST   | `/auth/login`           | User login             |
| POST   | `/auth/signup`          | Create new account     |
| POST   | `/auth/forgot-password` | Password reset request |

## ✅ Validation Rules

### Login

- ✓ Email must be valid format
- ✓ Password minimum 6 characters

### Signup

- ✓ Username minimum 3 characters
- ✓ Email must be valid and unique
- ✓ Password minimum 6 characters
- ✓ Password must contain: uppercase, lowercase, numbers
- ✓ Passwords must match
- ✓ Terms must be accepted

### Forgot Password

- ✓ Email must be valid format

## 🔄 Data Flow

### Login Flow

1. Client sends POST /auth/login with email and password
2. AuthController receives request and validates using LoginDto
3. AuthService checks if user exists and password matches
4. Returns user data on success or error on failure

### Signup Flow

1. Client sends POST /auth/signup with user details
2. AuthController validates using SignupDto
3. AuthService checks:
   - Password matches confirmPassword
   - Terms accepted
   - Email not already registered
   - Username not already taken
4. Creates new user and returns user data

### Forgot Password Flow

1. Client sends POST /auth/forgot-password with email
2. AuthController validates using ForgotPasswordDto
3. AuthService checks if user exists
4. Generates reset token (in production: sends email)
5. Returns success message

## 🛠️ Key Components

### DTOs (Data Transfer Objects)

- Validate incoming request data
- Ensure type safety
- Provide clear error messages

### AuthService

- Contains business logic
- Handles authentication operations
- Manages user data (temporary in-memory)

### AuthController

- Receives HTTP requests
- Delegates to AuthService
- Returns formatted responses

## 🔐 Security Features Implemented

✅ Input validation on all endpoints
✅ Password confirmation matching
✅ Terms acceptance requirement
✅ Email uniqueness check
✅ Username uniqueness check
✅ CORS enabled
✅ Type safety with TypeScript

## ⚠️ Important Notes

**Current Limitations:**

- Passwords stored in plain text (use bcrypt in production)
- No database integration (in-memory storage)
- No JWT token generation
- No actual email sending for password reset

**Production Recommendations:**

1. Install bcrypt for password hashing
2. Integrate a database (PostgreSQL, MongoDB)
3. Implement JWT authentication
4. Add email service for password reset
5. Implement rate limiting
6. Add comprehensive logging
7. Enable HTTPS
8. Use environment variables for secrets

## 🧪 Testing

### Run Unit Tests

```bash
npm run test
```

### Run E2E Tests

```bash
npm run test:e2e
```

### Test Endpoints with Postman

1. Create POST request
2. Set URL to endpoint
3. Add JSON body
4. Send and check response

## 📝 Response Examples

### Successful Signup

```json
{
  "success": true,
  "message": "Account created successfully",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "newuser@example.com"
  }
}
```

### Successful Login

```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "user@example.com"
  }
}
```

### Error Response

```json
{
  "statusCode": 400,
  "message": "Passwords do not match",
  "error": "Bad Request"
}
```

## 🔗 Integration with Frontend

### Example React Hook

```javascript
async function handleSignup(userData) {
  try {
    const response = await fetch('http://localhost:3000/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const data = await response.json();
    if (data.success) {
      // Handle successful signup
    }
  } catch (error) {
    // Handle error
  }
}
```

## 📚 Documentation Files

- [API_DOCUMENTATION.md](../API_DOCUMENTATION.md) - Detailed API reference
- [SETUP_GUIDE.md](../SETUP_GUIDE.md) - Complete setup instructions
- [.env.example](../.env.example) - Environment variables template

## ❓ Troubleshooting

**Issue: Port 3000 already in use**

```bash
# Use different port
PORT=3001 npm run start:dev
```

**Issue: Validation errors**

- Check request body matches DTO requirements
- Ensure all required fields are present
- Verify email format is valid

**Issue: CORS errors**

- CORS is enabled globally
- Check frontend URL matches CORS_ORIGIN

## 🎯 Next Steps

1. Set up database integration
2. Implement bcrypt password hashing
3. Add JWT authentication
4. Create email verification
5. Build user profile endpoints
6. Add refresh token functionality
7. Implement role-based access control
8. Add comprehensive error handling

---

For more details, see [API_DOCUMENTATION.md](../API_DOCUMENTATION.md)
