# Setup Guide for Soul Card Backend

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

This will install:

- NestJS core packages
- class-validator and class-transformer (for DTO validation)
- TypeScript and related tools

### 2. Install Additional Dependencies (Optional but Recommended for Production)

For password hashing:

```bash
npm install bcrypt
npm install --save-dev @types/bcrypt
```

For JWT authentication:

```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install --save-dev @types/passport-jwt
```

For database (choose one):

```bash
# For PostgreSQL with TypeORM
npm install @nestjs/typeorm typeorm pg

# OR for MongoDB with Mongoose
npm install @nestjs/mongoose mongoose
```

For email sending (optional):

```bash
npm install @nestjs/mailer nodemailer
npm install --save-dev @types/nodemailer
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration (when implemented)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=soul_card

# JWT Configuration (when implemented)
JWT_SECRET=your_secret_key_here
JWT_EXPIRATION=24h

# Email Configuration (when implemented)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_FROM=noreply@soulcard.com
```

### 4. Running the Application

**Development mode (with hot reload):**

```bash
npm run start:dev
```

**Debug mode:**

```bash
npm run start:debug
```

**Production mode:**

```bash
npm run build
npm run start:prod
```

The server will start on `http://localhost:3000`

## Testing the APIs

### Using cURL

Test the login endpoint:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

### Using Postman

1. Import the API collection or create requests manually
2. Set request URL to `http://localhost:3000/auth/login` (and other endpoints)
3. Set method to POST
4. Add JSON body with required fields

### Using Thunder Client (VS Code Extension)

1. Install Thunder Client extension
2. Create new requests for each endpoint
3. Test locally before connecting to frontend

## Project Structure

```
src/
├── auth/
│   ├── dto/
│   │   ├── login.dto.ts
│   │   ├── signup.dto.ts
│   │   ├── forgot-password.dto.ts
│   │   └── index.ts
│   ├── entities/
│   │   └── user.entity.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── app.controller.ts
├── app.service.ts
├── app.module.ts
└── main.ts
```

## Key Files and Their Purpose

| File                     | Purpose                                                                   |
| ------------------------ | ------------------------------------------------------------------------- |
| `auth.controller.ts`     | Defines HTTP endpoints (/auth/login, /auth/signup, /auth/forgot-password) |
| `auth.service.ts`        | Contains business logic for authentication                                |
| `login.dto.ts`           | Validates login request data                                              |
| `signup.dto.ts`          | Validates signup request data with password matching                      |
| `forgot-password.dto.ts` | Validates password reset request                                          |
| `auth.module.ts`         | Organizes auth-related components                                         |
| `main.ts`                | Application entry point with global middleware setup                      |

## Configuration Details

### Validation Pipe Configuration (in main.ts)

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true, // Remove unexpected properties
    forbidNonWhitelisted: true, // Throw error for unexpected properties
    transform: true, // Auto-transform DTOs
  }),
);
```

## Database Integration (When Ready)

### With TypeORM + PostgreSQL

1. Install packages:

```bash
npm install @nestjs/typeorm typeorm pg
```

2. Update `auth.module.ts` to use database
3. Create database configuration in `app.module.ts`
4. Create User entity with decorators

### With Mongoose + MongoDB

1. Install packages:

```bash
npm install @nestjs/mongoose mongoose
```

2. Configure MongoDB connection
3. Create User schema

## Security Best Practices

1. **Always hash passwords** using bcrypt before storing
2. **Use HTTPS** in production
3. **Implement JWT tokens** for session management
4. **Use environment variables** for sensitive data
5. **Add rate limiting** to prevent brute force attacks
6. **Validate all inputs** (already done with DTOs)
7. **Use CORS** properly for frontend integration
8. **Implement secrets** for JWT and sensitive operations

## Frontend Integration

The frontend should be configured to make requests to:

- `POST /auth/login`
- `POST /auth/signup`
- `POST /auth/forgot-password`

### Example Frontend Request (JavaScript/Fetch):

```javascript
// Login
fetch('http://localhost:3000/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePass123',
  }),
})
  .then((response) => response.json())
  .then((data) => console.log(data));
```

## Troubleshooting

### Port Already in Use

Change the port in `.env`:

```env
PORT=3001
```

### Validation Errors

Check that request body matches DTO requirements:

- Email must be valid
- Password must be 6+ characters
- Username must be 3+ characters
- All required fields must be present

### CORS Issues

The application has CORS enabled globally in `main.ts`. For specific origins:

```typescript
app.enableCors({
  origin: 'http://localhost:3000',
  credentials: true,
});
```

## Next Development Steps

1. ✅ Basic authentication endpoints
2. ⏳ Database integration
3. ⏳ JWT token implementation
4. ⏳ Email service for password reset
5. ⏳ Rate limiting and security hardening
6. ⏳ User profile management
7. ⏳ Comprehensive error handling
8. ⏳ Unit and E2E tests

## Useful Commands

```bash
# Run linter
npm run lint

# Format code
npm run format

# Run tests
npm run test

# Run tests with coverage
npm run test:cov

# Run E2E tests
npm run test:e2e

# Build for production
npm run build

# Start production server
npm run start:prod
```

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [Class Validator Documentation](https://github.com/typestack/class-validator)
- [TypeORM Documentation](https://typeorm.io)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
