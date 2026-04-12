# Soul Card Backend - Authentication API Documentation

## Overview

This document describes the authentication API endpoints for the Soul Card application.

## Base URL

```
http://localhost:3000
```

## API Endpoints

### 1. Login Endpoint

**Endpoint:** `POST /auth/login`

**Description:** Authenticates a user with email and password.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Validation Rules:**

- `email`: Required, must be a valid email format
- `password`: Required, minimum 6 characters

**Success Response (200):**

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

**Error Response (400):**

```json
{
  "statusCode": 400,
  "message": "Invalid email or password",
  "error": "Bad Request"
}
```

---

### 2. Signup Endpoint

**Endpoint:** `POST /auth/signup`

**Description:** Creates a new user account.

**Request Body:**

```json
{
  "username": "john_doe",
  "email": "newuser@example.com",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123",
  "termsAccepted": true
}
```

**Validation Rules:**

- `username`: Required, minimum 3 characters
- `email`: Required, must be valid email format (and not already registered)
- `password`: Required, minimum 6 characters, must contain uppercase, lowercase, and numbers
- `confirmPassword`: Required, must match password field
- `termsAccepted`: Required, must be true

**Success Response (201):**

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

**Error Responses:**

Password Mismatch (400):

```json
{
  "statusCode": 400,
  "message": "Passwords do not match",
  "error": "Bad Request"
}
```

Terms Not Accepted (400):

```json
{
  "statusCode": 400,
  "message": "You must accept the terms and conditions",
  "error": "Bad Request"
}
```

Email Already Registered (409):

```json
{
  "statusCode": 409,
  "message": "Email already registered",
  "error": "Conflict"
}
```

Username Already Taken (409):

```json
{
  "statusCode": 409,
  "message": "Username already taken",
  "error": "Conflict"
}
```

---

### 3. Forgot Password Endpoint

**Endpoint:** `POST /auth/forgot-password`

**Description:** Initiates password reset process. Sends reset link to registered email.

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Validation Rules:**

- `email`: Required, must be valid email format

**Success Response (200):**

```json
{
  "success": true,
  "message": "Password reset link has been sent to your email",
  "resetToken": "abcd1234"
}
```

**Note:** For security, the endpoint returns success even if email is not registered. In production, an actual email would be sent with a password reset link.

---

## Testing with cURL

### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

### Signup

```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "newuser@example.com",
    "password": "SecurePass123",
    "confirmPassword": "SecurePass123",
    "termsAccepted": true
  }'
```

### Forgot Password

```bash
curl -X POST http://localhost:3000/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

---

## Testing with Postman

1. Create a new collection called "Soul Card Auth"
2. Add three POST requests:
   - **Login**: `POST http://localhost:3000/auth/login`
   - **Signup**: `POST http://localhost:3000/auth/signup`
   - **Forgot Password**: `POST http://localhost:3000/auth/forgot-password`
3. Set Content-Type to `application/json` for all requests
4. Add the respective request bodies shown above

---

## Project Structure

```
src/
├── auth/
│   ├── dto/
│   │   ├── login.dto.ts
│   │   ├── signup.dto.ts
│   │   ├── forgot-password.dto.ts
│   │   └── index.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── app.controller.ts
├── app.service.ts
├── app.module.ts
└── main.ts
```

---

## Running the Application

```bash
# Install dependencies
npm install

# Development mode (with hot reload)
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The server will start on `http://localhost:3000`

---

## Next Steps

To enhance this authentication system, consider:

1. **Database Integration**: Use TypeORM/Prisma with PostgreSQL or MongoDB
2. **Password Hashing**: Implement bcrypt for secure password storage
3. **JWT Authentication**: Add JWT tokens for session management
4. **Email Service**: Integrate email service (SendGrid, Nodemailer) for actual password reset emails
5. **Rate Limiting**: Add rate limiting to prevent brute force attacks
6. **Logging**: Implement comprehensive logging for security auditing

---

## Error Handling

All error responses follow a consistent format:

```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Error type"
}
```

Validation errors return detailed information about which fields failed validation.
