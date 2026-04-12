# Soul Card Backend - Database Architecture

## 🏗️ Project Architecture Overview

The backend now follows NestJS best practices with a modular, scalable architecture using PostgreSQL database.

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    HTTP Client (Frontend)               │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   NestJS Application                     │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │           Global Middleware                      │   │
│  │  - ValidationPipe (DTO Validation)              │   │
│  │  - CORS (Cross-Origin Requests)                 │   │
│  └──────────────────────────────────────────────────┘   │
│                       ▲                                   │
│                       │                                   │
│  ┌────────────┬───────┴────────┬──────────────┐          │
│  │            │                │              │          │
│  ▼            ▼                ▼              ▼          │
│ ┌──────────┐ ┌──────────┐  ┌──────────┐  ┌─────────┐   │
│ │   Auth   │ │  Users   │  │  Config  │  │   Main  │   │
│ │ Module   │ │  Module  │  │  Module  │  │  Module │   │
│ └────┬─────┘ └────┬─────┘  └──────────┘  └─────────┘   │
│      │            │                                      │
│  ┌───┴┬──────────┬┴────┐                                │
│  │    │          │     │                                │
│  ▼    ▼          ▼     ▼                                │
│ ┌────────────────────────────────────────────────┐    │
│ │  Auth Controller    Auth Service              │    │
│ │  ├─ /login          ├─ login()                │    │
│ │  ├─ /signup         ├─ signup()               │    │
│ │  └─ /forgot-pwd     └─ forgotPassword()       │    │
│ └──────────┬─────────────────────────────────────┘    │
│            │                                           │
│            │ Uses                                      │
│            ▼                                           │
│ ┌──────────────────────────────────────────────┐      │
│ │  Users Service                               │      │
│ │  ├─ createUser()                             │      │
│ │  ├─ findByEmail()                            │      │
│ │  ├─ findByUsername()                         │      │
│ │  ├─ updateResetToken()                       │      │
│ │  ├─ verifyResetToken()                       │      │
│ │  ├─ updatePassword()                         │      │
│ │  └─ deactivateUser()                         │      │
│ └──────────┬──────────────────────────────────┘       │
│            │                                           │
│            │ Injects                                   │
│            ▼                                           │
│ ┌──────────────────────────────────────────────┐      │
│ │  TypeORM Repository<User>                    │      │
│ │  ├─ find()    ├─ save()                       │      │
│ │  ├─ findOne() ├─ update()                     │      │
│ │  └─ delete()  └─ ...                          │      │
│ └──────────┬──────────────────────────────────┘       │
│            │                                           │
└────────────┼───────────────────────────────────────────┘
             │
             ▼
    ┌──────────────────┐
    │   PostgreSQL     │
    │    Database      │
    └──────────────────┘
```

---

## 📁 Modular Structure

### Before (Mock Storage)

```
src/
├── auth/
│   ├── dto/
│   ├── auth.controller.ts
│   ├── auth.service.ts          ← Uses mock array
│   └── auth.module.ts
└── app.module.ts
```

### After (Database-Driven)

```
src/
├── auth/
│   ├── dto/
│   │   ├── login.dto.ts
│   │   ├── signup.dto.ts
│   │   └── forgot-password.dto.ts
│   ├── auth.controller.ts       ← Receives requests
│   ├── auth.service.ts          ← Uses UsersService
│   └── auth.module.ts           ← Imports UsersModule
├── users/                       ← NEW MODULE
│   ├── entities/
│   │   └── user.entity.ts       ← TypeORM entity with DB schema
│   ├── dto/
│   │   └── create-user.dto.ts   ← DTO for user creation
│   ├── users.service.ts         ← Database operations
│   ├── users.module.ts          ← Exports UserService
│   └── index.ts
├── config/                      ← NEW CONFIG
│   └── database.config.ts       ← Database connection config
├── app.module.ts                ← Imports TypeORM & modules
└── main.ts                      ← Loads env variables
```

---

## 🔄 Data Flow

### Login Flow (Detailed)

```
User Request
    ↓
POST /auth/login { email, password }
    ↓
AuthController.login()
    ↓
ValidationPipe (validates LoginDto)
    ├─ Check email format ✓
    └─ Check password not empty ✓
    ↓
AuthService.login()
    ├─ Call UsersService.findByEmail(email)
    │   ↓
    │   UserRepository.findOne({ email })
    │   ↓
    │   PostgreSQL Query: SELECT * FROM users WHERE email = ?
    │   ↓
    │   Returns User or null
    │
    ├─ Verify password matches ✓
    ├─ Check user is active ✓
    └─ Return { success, user }
    ↓
Response sent to client
```

### Signup Flow (Detailed)

```
User Request
    ↓
POST /auth/signup { username, email, password, confirmPassword, termsAccepted }
    ↓
AuthController.signup()
    ↓
ValidationPipe (validates SignupDto)
    ├─ Email format ✓
    ├─ Password strength (uppercase, lowercase, numbers) ✓
    ├─ Username length >= 3 ✓
    └─ All required fields present ✓
    ↓
AuthService.signup()
    ├─ Check passwords match ✓
    ├─ Check terms accepted ✓
    └─ Call UsersService.createUser()
        ↓
        Check email uniqueness
        ├─ UserRepository.findOne({ email })
        ├─ If exists: throw ConflictException
        └─ If not: continue
        ↓
        Check username uniqueness
        ├─ UserRepository.findOne({ username })
        ├─ If exists: throw ConflictException
        └─ If not: continue
        ↓
        Create User object
        ├─ Generate UUID for id
        ├─ Set createdAt = now
        └─ Set updatedAt = now
        ↓
        UserRepository.save(user)
        ├─ TypeORM auto-hashes relationships
        └─ INSERT INTO users VALUES (...)
        ↓
        PostgreSQL executes INSERT
        ↓
        Return saved User
    ↓
AuthService returns { success, user }
    ↓
Response sent to client
```

---

## 🗄️ Database Schema

### Users Table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    terms_accepted BOOLEAN NOT NULL DEFAULT false,
    reset_token VARCHAR(255) NULL,
    reset_token_expiry TIMESTAMP NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_reset_token ON users(reset_token);
```

---

## 🔌 Module Dependencies

### Auth Module

```
AuthModule
  ├─ imports: [UsersModule]
  ├─ controllers: [AuthController]
  ├─ providers: [AuthService]
  └─ exports: [AuthService]
```

### Users Module

```
UsersModule
  ├─ imports: [TypeOrmModule.forFeature([User])]
  ├─ providers: [UsersService]
  ├─ exports: [UsersService, TypeOrmModule]
  └─ Repository: Repository<User>
```

### App Module

```
AppModule
  ├─ imports: [
  │   TypeOrmModule.forRoot(config),
  │   AuthModule,
  │   UsersModule
  │ ]
  ├─ controllers: [AppController]
  └─ providers: [AppService]
```

---

## 🔐 Service Layer

### AuthService

**Responsibility**: Authentication business logic

```typescript
@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async login(loginDto: LoginDto) { ... }
  async signup(signupDto: SignupDto) { ... }
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) { ... }
}
```

### UsersService

**Responsibility**: User database operations

```typescript
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  async createUser(createUserDto) { ... }
  async findByEmail(email) { ... }
  async findByUsername(username) { ... }
  async updateResetToken(email, token, expiry) { ... }
  async updatePassword(userId, newPassword) { ... }
}
```

---

## 🗝️ Key Components

### Entity (ORM Layer)

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  email: string;

  // TypeORM decorator maps to database table
}
```

### Repository (Data Access)

```typescript
Repository<User>
  │
  ├─ find(options)        → SELECT * FROM users WHERE ...
  ├─ findOne(where)       → SELECT * FROM users WHERE ... LIMIT 1
  ├─ save(entity)         → INSERT or UPDATE
  ├─ update(where, data)  → UPDATE users SET ...
  └─ delete(where)        → DELETE FROM users WHERE ...
```

### Service (Business Logic)

```typescript
UsersService
  │
  ├─ Use Repository to query database
  ├─ Implement business rules (validation, uniqueness)
  ├─ Transform data (DTO → Entity → Database)
  └─ Handle errors appropriately
```

### Controller (HTTP Layer)

```typescript
AuthController
  │
  ├─ Receive HTTP requests
  ├─ Validate DTOs (ValidationPipe)
  ├─ Call AuthService
  └─ Return HTTP responses
```

---

## 🔒 Data Validation Layers

### Layer 1: HTTP

```
Raw JSON from client
```

### Layer 2: DTO Validation (ValidationPipe)

```
class SignupDto {
  @IsString()
  @MinLength(3)
  username: string;

  @IsEmail()
  email: string;

  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  password: string;
}
```

### Layer 3: Service Logic

```
AuthService.signup()
  ├─ Check passwords match
  ├─ Check terms accepted
  └─ Pass to UsersService
```

### Layer 4: Repository Constraints

```
Database Constraints
  ├─ UNIQUE(email)
  ├─ UNIQUE(username)
  ├─ NOT NULL constraints
  └─ Type constraints
```

---

## 📊 Configuration

### TypeORM Configuration

```typescript
// src/config/database.config.ts
export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT,
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [User],
  synchronize: NODE_ENV !== 'production', // Auto-create tables in dev
  logging: NODE_ENV !== 'production', // Log SQL in dev
};
```

### Environment Variables

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=soul_card_db
NODE_ENV=development
```

---

## 🚀 Request Lifecycle

```
1. HTTP Request arrives at NestJS
                ↓
2. Global Middleware (CORS)
                ↓
3. Route matched to Controller method
                ↓
4. ValidationPipe validates DTO
                ↓
5. Controller method executed
                ↓
6. Service method called
                ↓
7. Repository query executed
                ↓
8. Database returns data
                ↓
9. Service processes data
                ↓
10. Controller formats response
                ↓
11. Response sent to client
```

---

## 🔄 Error Handling Flow

```
Database Error
    ↓
Repository catches error
    ↓
Service processes error
    ├─ ConflictException (duplicate key)
    ├─ NotFoundException (not found)
    ├─ DatabaseError (connection failed)
    └─ Generic error
    ↓
Controller returns HTTP Error Response
```

---

## 🎯 Advantages of This Architecture

### 1. **Separation of Concerns**

- Controllers handle HTTP
- Services handle business logic
- Repositories handle database queries

### 2. **Scalability**

- Easy to add new entities
- Easy to add new modules
- Easy to add new features

### 3. **Testability**

- Services are testable (mock repositories)
- Controllers are testable (mock services)
- No HTTP mocking needed

### 4. **Maintainability**

- Clear structure
- Easy to find code
- Easy to modify features

### 5. **Type Safety**

- TypeScript enforces types
- DTO validation prevents invalid data
- Database constraints prevent corruption

### 6. **Database Integrity**

- Types enforce schema
- Indexes improve performance
- Constraints prevent invalid data

---

## 📈 Performance Considerations

### Indexes

```typescript
@Entity('users')
@Index(['email'], { unique: true })      // Fast email lookup
@Index(['username'], { unique: true })   // Fast username lookup
@Index(['resetToken'])                    // Fast token verification
export class User { ... }
```

### Query Optimization

```typescript
// Good - Select only needed fields
async findAll(): Promise<User[]> {
  return this.userRepository.find({
    select: ['id', 'username', 'email', 'createdAt'],
  });
}

// Avoid - Selects all fields including sensitive data
async findAll(): Promise<User[]> {
  return this.userRepository.find();
}
```

---

## 🔮 Future Enhancements

1. **Add Migrations**

   ```bash
   npm run typeorm migration:generate
   npm run typeorm migration:run
   ```

2. **Add Redis Caching**

   ```typescript
   @Cacheable()
   async getUser(id: string) { ... }
   ```

3. **Add Pagination**

   ```typescript
   async findAll(page: number, limit: number) { ... }
   ```

4. **Add Roles & Permissions**

   ```typescript
   @Entity('users')
   export class User {
     @Column({ enum: ['admin', 'user'] })
     role: string;
   }
   ```

5. **Add Auditing**
   ```typescript
   @Column()
   lastLogin: Date;
   ```

---

## 📚 Related Files

- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - How to set up PostgreSQL
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API endpoints
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - How to test

---

**Architecture created with database-first approach for production stability** ✅
