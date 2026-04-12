# Soul Card Backend - Complete Testing Guide

## 🧪 Testing Overview

This guide provides comprehensive testing instructions for all three authentication endpoints using multiple tools and methods.

---

## 🚀 Getting Started

### Prerequisites

- Node.js installed
- Backend running on `http://localhost:3000`
- API Endpoints:
  - `POST /auth/login`
  - `POST /auth/signup`
  - `POST /auth/forgot-password`

### Start the Backend

```bash
npm run start:dev
```

---

## 📝 Testing with cURL

cURL is a command-line tool for making HTTP requests. Perfect for quick API testing.

### 1. Signup Request

#### Successful Signup

```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePass123",
    "confirmPassword": "SecurePass123",
    "termsAccepted": true
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Account created successfully",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

#### Invalid Signup - Password Mismatch

```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePass123",
    "confirmPassword": "DifferentPass123",
    "termsAccepted": true
  }'
```

**Expected Error:**

```json
{
  "statusCode": 400,
  "message": "Passwords do not match",
  "error": "Bad Request"
}
```

#### Invalid Signup - Terms Not Accepted

```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePass123",
    "confirmPassword": "SecurePass123",
    "termsAccepted": false
  }'
```

#### Invalid Signup - Duplicate Email

```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "jane_doe",
    "email": "john@example.com",
    "password": "SecurePass123",
    "confirmPassword": "SecurePass123",
    "termsAccepted": true
  }'
```

**Expected Error:**

```json
{
  "statusCode": 409,
  "message": "Email already registered",
  "error": "Conflict"
}
```

### 2. Login Request

#### Successful Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

#### Invalid Login - Wrong Password

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "WrongPassword"
  }'
```

**Expected Error:**

```json
{
  "statusCode": 400,
  "message": "Invalid email or password",
  "error": "Bad Request"
}
```

#### Invalid Login - Email Not Found

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nonexistent@example.com",
    "password": "SecurePass123"
  }'
```

#### Invalid Login - Missing Fields

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com"
  }'
```

### 3. Forgot Password Request

#### Successful Forgot Password

```bash
curl -X POST http://localhost:3000/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com"
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Password reset link has been sent to your email",
  "resetToken": "abc12345"
}
```

#### Forgot Password - Non-existent Email

```bash
curl -X POST http://localhost:3000/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nonexistent@example.com"
  }'
```

**Note:** Returns success for security (doesn't reveal if email exists)

---

## 📮 Testing with Postman

### Method 1: Import Pre-built Collection

1. Open Postman
2. Click **Import** → **Upload Files**
3. Select `Soul-Card-Auth-API.postman_collection.json`
4. Collection automatically loads with all requests

### Method 2: Manual Setup

#### Create Signup Request

1. New → Request
2. Name: "Signup"
3. Method: **POST**
4. URL: `http://localhost:3000/auth/signup`
5. Tab: **Headers**
   - Key: `Content-Type`
   - Value: `application/json`
6. Tab: **Body** → **raw** → **JSON**
   ```json
   {
     "username": "john_doe",
     "email": "test@example.com",
     "password": "SecurePass123",
     "confirmPassword": "SecurePass123",
     "termsAccepted": true
   }
   ```
7. Click **Send**

#### Create Login Request

1. New → Request
2. Name: "Login"
3. Method: **POST**
4. URL: `http://localhost:3000/auth/login`
5. Headers: `Content-Type: application/json`
6. Body:
   ```json
   {
     "email": "test@example.com",
     "password": "SecurePass123"
   }
   ```
7. Click **Send**

#### Create Forgot Password Request

1. New → Request
2. Name: "Forgot Password"
3. Method: **POST**
4. URL: `http://localhost:3000/auth/forgot-password`
5. Headers: `Content-Type: application/json`
6. Body:
   ```json
   {
     "email": "test@example.com"
   }
   ```
7. Click **Send**

### Testing Validations in Postman

#### Test: Password Too Short

```json
{
  "username": "john_doe",
  "email": "test@example.com",
  "password": "123",
  "confirmPassword": "123",
  "termsAccepted": true
}
```

#### Test: Invalid Email

```json
{
  "username": "john_doe",
  "email": "not-an-email",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123",
  "termsAccepted": true
}
```

#### Test: Missing Required Fields

```json
{
  "username": "john_doe",
  "email": "test@example.com"
}
```

---

## 🌐 Testing with Frontend (JavaScript/React)

### JavaScript Fetch API

#### Signup Function

```javascript
async function handleSignup(formData) {
  try {
    const response = await fetch('http://localhost:3000/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        termsAccepted: formData.termsAccepted,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('Signup successful:', data.user);
      // Redirect to login or dashboard
      window.location.href = '/login';
    } else {
      console.error('Signup failed:', data.message);
      // Show error to user
      alert(data.message);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred. Please try again.');
  }
}

// Usage
handleSignup({
  username: 'john_doe',
  email: 'john@example.com',
  password: 'SecurePass123',
  confirmPassword: 'SecurePass123',
  termsAccepted: true,
});
```

#### Login Function

```javascript
async function handleLogin(email, password) {
  try {
    const response = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('Login successful:', data.user);
      // Store user data
      localStorage.setItem('user', JSON.stringify(data.user));
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } else {
      console.error('Login failed:', data.message);
      alert(data.message);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Login failed. Please try again.');
  }
}

// Usage
handleLogin('john@example.com', 'SecurePass123');
```

#### Forgot Password Function

```javascript
async function handleForgotPassword(email) {
  try {
    const response = await fetch('http://localhost:3000/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('Reset link sent');
      alert('Password reset link has been sent to your email');
      window.location.href = '/login';
    } else {
      console.error('Error:', data.message);
      alert(data.message);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred. Please try again.');
  }
}

// Usage
handleForgotPassword('john@example.com');
```

### React Custom Hook

```javascript
import { useState } from 'react';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const signup = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3000/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      localStorage.setItem('user', JSON.stringify(data.user));
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        'http://localhost:3000/auth/forgot-password',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { signup, login, forgotPassword, loading, error };
}

// Usage in Component
function LoginForm() {
  const { login, loading, error } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login('john@example.com', 'SecurePass123');
      // Redirect on success
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button disabled={loading}>{loading ? 'Loading...' : 'Login'}</button>
    </form>
  );
}
```

---

## 🧬 Automated Testing

### Run Unit Tests

```bash
npm run test
```

### Run E2E Tests

```bash
npm run test:e2e
```

### Test Coverage

```bash
npm run test:cov
```

### Test Specific File

```bash
npm run test -- auth.service.spec.ts
```

---

## ✅ Test Checklist

### Signup Validations

- [ ] Successfully create account with valid data
- [ ] Reject when password doesn't match confirmPassword
- [ ] Reject when email format is invalid
- [ ] Reject when email already exists
- [ ] Reject when username already exists
- [ ] Reject when terms not accepted
- [ ] Reject when password is too short
- [ ] Reject when password lacks uppercase letter
- [ ] Reject when password lacks lowercase letter
- [ ] Reject when password lacks number
- [ ] Reject when username less than 3 chars
- [ ] Reject missing required fields

### Login Validations

- [ ] Successfully login with correct credentials
- [ ] Reject with wrong password
- [ ] Reject with non-existent email
- [ ] Reject with invalid email format
- [ ] Reject with missing fields

### Forgot Password Validations

- [ ] Accept valid email
- [ ] Return success even for non-existent email (security)
- [ ] Reject invalid email format
- [ ] Reject missing email

### Response Format

- [ ] All responses include proper HTTP status codes
- [ ] All error responses have consistent format
- [ ] All success responses include data
- [ ] Message field is always present
- [ ] Success field is always present

---

## 📊 Performance Testing

### Load Testing with Apache Bench

```bash
# Install Apache Bench (if not installed)
# On Windows: download from apache.org
# On Mac: brew install httpd
# On Linux: sudo apt-get install apache2-utils

# Test signup endpoint with 100 requests, 10 concurrent
ab -n 100 -c 10 -p signup.json -T application/json http://localhost:3000/auth/signup
```

### Using wrk (Another load testing tool)

```bash
# Install wrk
# Clone: git clone https://github.com/wg/wrk.git

wrk -t4 -c100 -d30s --script=post.lua http://localhost:3000/auth/login
```

---

## 🔍 Debugging Tips

### View Server Logs

The server logs all requests and errors. Check console output for:

```
[Nest] 12345 - 04/12/2025, 10:30:45 AM   LOG [NestFactory] Starting Nest application...
```

### Test with Different Content-Type

```bash
# Should fail - wrong content type
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: text/plain" \
  -d '{"email":"test@example.com","password":"pass"}'
```

### Test Missing Headers

```bash
# Should fail validation
curl -X POST http://localhost:3000/auth/login \
  -d '{"email":"test@example.com","password":"pass"}'
```

### Save Response to File

```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '@request.json' > response.json
```

---

## 🚨 Common Issues & Solutions

| Issue              | Solution                                            |
| ------------------ | --------------------------------------------------- |
| Connection refused | Make sure server is running: `npm run start:dev`    |
| 400 Bad Request    | Check request body matches DTO requirements         |
| 409 Conflict       | Email/username already exists, try different values |
| 401 Unauthorized   | Will be used after JWT implementation               |
| CORS errors        | CORS is enabled globally in main.ts                 |
| Validation errors  | Ensure all required fields are present and valid    |

---

## 📚 Additional Resources

- [Postman Documentation](https://learning.postman.com/)
- [cURL Tutorial](https://curl.se/docs/manual.html)
- [HTTPie Alternative](https://httpie.io/)
- [Insomnia REST Client](https://insomnia.rest/)
- [Thunder Client VS Code Extension](https://www.thunderclient.com/)

---

## Next Testing Steps

1. Set up database connection
2. Test persistence of user data
3. Test with hashed passwords
4. Test JWT token generation
5. Test refresh token endpoint
6. Test email verification
7. Load and stress testing
8. Security penetration testing
