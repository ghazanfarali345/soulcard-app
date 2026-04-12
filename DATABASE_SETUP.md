# Database Setup Guide

## Prerequisites

Ensure PostgreSQL is installed on your system:

- **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
- **Mac**: `brew install postgresql@15`
- **Linux**: `sudo apt-get install postgresql postgresql-contrib`

---

## Setup Steps

### 1. Start PostgreSQL Service

#### Windows

```bash
# Check if PostgreSQL service is running
pg_isready -h localhost

# If not running, start the service
net start postgresql-x64-15
```

#### Mac

```bash
brew services start postgresql@15
```

#### Linux

```bash
sudo systemctl start postgresql
```

### 2. Create Database and User

#### Option A: Using psql Command Line

Open PostgreSQL command line:

```bash
psql -U postgres
```

Create user and database:

```sql
-- Create user
CREATE USER soul_card_user WITH PASSWORD 'secure_password';

-- Create database
CREATE DATABASE soul_card_db OWNER soul_card_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE soul_card_db TO soul_card_user;

-- Exit psql
\q
```

#### Option B: Using pgAdmin (GUI)

1. Open pgAdmin
2. Right-click on "Databases" → "Create" → "Database"
3. Name: `soul_card_db`
4. Owner: Create new login role if needed
5. Click "Save"

### 3. Update Environment Variables

Edit `.env` file:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=soul_card_user
DATABASE_PASSWORD=secure_password
DATABASE_NAME=soul_card_db
NODE_ENV=development
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Start Development Server

```bash
npm run start:dev
```

The server will:

- Connect to PostgreSQL
- Auto-create the `users` table (via TypeORM synchronize)
- Run on `http://localhost:3000`

---

## Verification

### Check Database Connection

1. Start the server: `npm run start:dev`
2. Look for log output:
   ```
   🚀 Server running on port 3000
   📊 Database: localhost:5432
   💾 Database Name: soul_card_db
   ```

### Test an Endpoint

```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username":"testuser",
    "email":"test@example.com",
    "password":"SecurePass123",
    "confirmPassword":"SecurePass123",
    "termsAccepted":true
  }'
```

If successful, user is created in database!

### Verify Data in Database

Using psql:

```bash
psql -U soul_card_user -d soul_card_db

\dt  # List tables
SELECT * FROM users;  # View all users
```

---

## Database Schema

The `users` table is auto-created with these columns:

| Column           | Type         | Properties                   |
| ---------------- | ------------ | ---------------------------- |
| id               | UUID         | Primary Key (auto-generated) |
| username         | VARCHAR(100) | Unique, Not Null             |
| email            | VARCHAR(255) | Unique, Not Null             |
| password         | VARCHAR(255) | Not Null                     |
| termsAccepted    | BOOLEAN      | Not Null, Default: false     |
| resetToken       | VARCHAR(255) | Nullable                     |
| resetTokenExpiry | TIMESTAMP    | Nullable                     |
| isActive         | BOOLEAN      | Not Null, Default: true      |
| createdAt        | TIMESTAMP    | Auto-set to current time     |
| updatedAt        | TIMESTAMP    | Auto-updated on changes      |

---

## Troubleshooting

### "Could not connect to database"

- ✓ Ensure PostgreSQL is running
- ✓ Check DATABASE_HOST and DATABASE_PORT in .env
- ✓ Verify DATABASE_USER and DATABASE_PASSWORD are correct
- ✓ Check if database exists: `psql -U postgres -l | grep soul_card_db`

### "Port 5432 already in use"

- ✓ PostgreSQL is running on a different port
- ✓ Check port: `netstat -an | find "5432"`
- ✓ Change DATABASE_PORT in .env to the correct port

### "Permission denied"

- ✓ Ensure the user has database creation permissions
- ✓ Grant privileges:
  ```sql
  GRANT ALL PRIVILEGES ON DATABASE soul_card_db TO soul_card_user;
  ```

### "Table doesn't exist"

- ✓ Make sure NODE_ENV is not set to 'production'
- ✓ TypeORM will auto-create tables in development
- ✓ Restart the server: `npm run start:dev`

### "Column already exists"

- ✓ Delete and recreate the database:
  ```sql
  DROP DATABASE soul_card_db;
  CREATE DATABASE soul_card_db OWNER soul_card_user;
  ```

---

## Advanced Configuration

### Custom Database Port

If PostgreSQL is on a different port:

1. Find the correct port:

   ```bash
   psql -U postgres -h localhost -p 5433
   ```

2. Update .env:
   ```env
   DATABASE_PORT=5433
   ```

### Disable Auto-Synchronize (Production)

In `src/config/database.config.ts`, synchronize is set to false in production:

```typescript
synchronize: process.env.NODE_ENV !== 'production';
```

For production, use migrations instead.

### Enable SQL Query Logging

In development, SQL queries are logged. To disable:

```typescript
// In database.config.ts
logging: false,  // Change from true
```

---

## Database Commands

### Create database backup

```bash
pg_dump -U soul_card_user soul_card_db > backup.sql
```

### Restore from backup

```bash
psql -U soul_card_user soul_card_db < backup.sql
```

### Connect to database

```bash
psql -U soul_card_user -d soul_card_db
```

### Useful psql commands

```sql
\dt              -- List all tables
\d users         -- Describe users table
\l               -- List all databases
SELECT * FROM users;  -- View all users
DELETE FROM users;    -- Delete all users
```

---

## Next Steps

1. ✅ Setup database
2. ✅ Create .env file
3. ✅ Install dependencies: `npm install`
4. ✅ Start server: `npm run start:dev`
5. ⏳ Implement password hashing (bcrypt)
6. ⏳ Add JWT authentication
7. ⏳ Implement email verification
8. ⏳ Create database migrations

---

For more information, see:

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TypeORM Documentation](https://typeorm.io/)
- [NestJS Database Integration](https://docs.nestjs.com/techniques/database)
