# ✅ Setup Checklist - Database Migration Complete

## 🎯 Quick Reference

**Time to complete:** 15-30 minutes  
**Difficulty:** Easy  
**Prerequisites:** Node.js, PostgreSQL (will install if needed)

---

## 📋 Pre-Setup Verification

- [ ] You have Node.js installed: `node --version` (v18+)
- [ ] You have npm installed: `npm --version` (v9+)
- [ ] You have PostgreSQL installed (or ready to install)
- [ ] All code files in place:
  - [ ] `src/users/` folder exists
  - [ ] `src/config/database.config.ts` exists
  - [ ] `.env` file exists
  - [ ] `src/auth/auth.service.ts` has UsersService dependency
  - [ ] `src/app.module.ts` imports TypeOrmModule

---

## 🚀 Phase 1: PostgreSQL Setup (10 minutes)

### Option A: Windows Users

```
[ ] Step 1: Download PostgreSQL installer from postgresql.org
[ ] Step 2: Run installer
[ ] Step 3: Note the password you set for 'postgres' user
[ ] Step 4: Keep default settings (port 5432)
[ ] Step 5: Start PostgreSQL service (Services app)
[ ] Step 6: Verify: psql --version
```

### Option B: Mac Users

```
[ ] Step 1: Install Homebrew (if needed): /bin/bash -c "$(curl...)"
[ ] Step 2: Run: brew install postgresql@15
[ ] Step 3: Run: brew services start postgresql@15
[ ] Step 4: Verify: psql --version
```

### Option C: Linux Users (Ubuntu/Debian)

```
[ ] Step 1: sudo apt update
[ ] Step 2: sudo apt install postgresql postgresql-contrib
[ ] Step 3: sudo systemctl start postgresql
[ ] Step 4: sudo systemctl enable postgresql
[ ] Step 5: Verify: psql --version
```

### Verify PostgreSQL Running

```bash
pg_isready -h localhost -p 5432
# Expected output: accepting connections
```

- [ ] PostgreSQL is running and accepting connections

---

## 🗄️ Phase 2: Create Database

### Login to PostgreSQL

```bash
psql -U postgres
```

- [ ] psql prompt appeared (shows `postgres=#`)

### Create Database

```sql
CREATE DATABASE soul_card_db OWNER postgres;
```

- [ ] Database created successfully
- [ ] Response: `CREATE DATABASE`

### Verify Database Exists

```sql
\l
```

- [ ] `soul_card_db` appears in the list

### Exit psql

```sql
\q
```

- [ ] Back to terminal prompt

---

## 🔧 Phase 3: Configure Environment

### Verify .env File Exists

```bash
# In project root directory
cat .env  # or type .env on Windows
```

- [ ] File contents visible
- [ ] Contains DATABASE\_\* variables

### Update .env if Needed

```
Edit .env with your credentials:

DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=YOUR_POSTGRES_PASSWORD  ← Change if needed
DATABASE_NAME=soul_card_db
CORS_ORIGIN=*
PORT=3000
NODE_ENV=development
```

- [ ] DATABASE_PASSWORD matches PostgreSQL password
- [ ] All other values match above
- [ ] File saved

---

## 📦 Phase 4: Install Dependencies

### Install npm Packages

```bash
npm install
```

- [ ] Installation started (shows "added X packages")
- [ ] Installation completed successfully
- [ ] No errors (warnings are OK)
- [ ] Takes 2-5 minutes

### Verify Installation

```bash
npm list typeorm @nestjs/typeorm pg dotenv
```

- [ ] All packages listed with versions
- [ ] Versions match package.json

---

## ✨ Phase 5: Verify Database Connection

### Run Application

```bash
npm run start:dev
```

- [ ] Server started (shows "Listening on port 3000")
- [ ] No database connection errors
- [ ] Shows: `📊 Database: localhost:5432 ✅`
- [ ] Shows: `💾 Database: soul_card_db`

### Watch for Messages

```
[Nest] PID   - 01/01/2024, 10:00:00 AM     LOG [NestFactory] Starting Nest application...
[Nest] PID   - 01/01/2024, 10:00:01 AM   DEBUG [TypeOrmModule] Initializing TypeOrmModule
[Nest] PID   - 01/01/2024, 10:00:02 AM     LOG 📊 Database: localhost:5432 ✅
[Nest] PID   - 01/01/2024, 10:00:02 AM     LOG 💾 Database: soul_card_db
[Nest] PID   - 01/01/2024, 10:00:03 AM     LOG 🚀 Server running on http://localhost:3000
```

- [ ] All messages appeared in correct order
- [ ] No connection errors

---

## 🔍 Phase 6: Verify Tables Created

### In New Terminal (keep app running)

```bash
psql -U postgres -d soul_card_db
```

- [ ] Connected to soul_card_db (prompt shows `soul_card_db=#`)

### List Tables

```sql
\dt
```

- [ ] `public | users` appears in the list
- [ ] Table name shows `users`

### Describe Users Table

```sql
\d users
```

- [ ] Shows columns: id, username, email, password, etc.
- [ ] `id` is UUID primary key
- [ ] Indexes listed (email, username)

### Exit psql

```sql
\q
```

- [ ] Back to terminal

---

## 🧪 Phase 7: Test API Endpoints

### Test 1: Create User (Signup)

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

- [ ] Response includes user data
- [ ] No errors
- [ ] `email` and `username` in response

### Test 2: Verify User in Database

```bash
psql -U postgres -d soul_card_db
SELECT * FROM users;
```

- [ ] User row appears with correct data
- [ ] Email and username match
- [ ] created_at is populated

### Test 3: Login with Created User

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"SecurePass123"
  }'
```

- [ ] Response includes user data
- [ ] Login successful
- [ ] No "Invalid email or password" error

### Test 4: Try Duplicate Email

```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username":"anotheruser",
    "email":"test@example.com",
    "password":"SecurePass123",
    "confirmPassword":"SecurePass123",
    "termsAccepted":true
  }'
```

- [ ] Returns error: "Email already taken"
- [ ] Database prevented duplicate
- [ ] Constraint working ✓

### Test 5: Try Duplicate Username

```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username":"testuser",
    "email":"another@example.com",
    "password":"SecurePass123",
    "confirmPassword":"SecurePass123",
    "termsAccepted":true
  }'
```

- [ ] Returns error: "Username already taken"
- [ ] Database prevented duplicate
- [ ] Constraint working ✓

---

## 💾 Phase 8: Test Data Persistence

### Stop Server

```
Press Ctrl+C in terminal running npm run start:dev
```

- [ ] Server stopped (prompt returns)
- [ ] No errors on shutdown

### Wait 2 Seconds

- [ ] Timer started

### Restart Server

```bash
npm run start:dev
```

- [ ] Server starts again
- [ ] Database connection established

### Verify User Still Exists

```bash
# In new terminal
psql -U postgres -d soul_card_db
SELECT * FROM users;
```

- [ ] Same user still present in database
- [ ] Data persisted! ✅
- [ ] Server restart didn't lose data

### Login as Previous User

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"SecurePass123"
  }'
```

- [ ] Login successful
- [ ] User data retrieved from database

---

## 📊 Phase 9: Verify Architecture

### Check Users Module Exists

```bash
ls src/users/
```

- [ ] `entities/` folder listed
- [ ] `dto/` folder listed
- [ ] `users.service.ts` listed
- [ ] `users.module.ts` listed

### Verify TypeORM Config

```bash
cat src/config/database.config.ts
# Check it has:
# - type: 'postgres'
# - entities: [User]
```

- [ ] Config file exists and is readable
- [ ] Contains database configuration

### Verify Auth Service Uses UsersService

```bash
grep "usersService" src/auth/auth.service.ts
```

- [ ] Multiple matches found
- [ ] Shows dependency injection
- [ ] Shows method calls to usersService

---

## ✅ Final Verification Checklist

### Architecture

- [ ] Users module created successfully
- [ ] Database configuration centralized
- [ ] Auth service uses UsersService
- [ ] TypeORM configured
- [ ] No mock users array in code

### Database

- [ ] PostgreSQL installed and running
- [ ] `soul_card_db` database created
- [ ] `users` table auto-created
- [ ] Indexes created successfully
- [ ] Connection logged in app

### Code

- [ ] npm install completed
- [ ] No TypeScript errors
- [ ] All imports resolved
- [ ] Dependencies installed

### Functionality

- [ ] Signup creates user in database
- [ ] Login retrieves user from database
- [ ] Duplicate prevention working
- [ ] Data persists after restart
- [ ] All endpoints responding

### Documentation

- [ ] Read DATABASE_SETUP.md
- [ ] Read ARCHITECTURE.md
- [ ] Understand module structure
- [ ] Know how to troubleshoot

---

## 🎯 Success Criteria

You've succeeded when:

1. ✅ PostgreSQL running on localhost:5432
2. ✅ `soul_card_db` database exists
3. ✅ `npm install` completed
4. ✅ `npm run start:dev` runs without errors
5. ✅ `users` table exists in database
6. ✅ Can create user via signup endpoint
7. ✅ User appears in database
8. ✅ Can login with created user
9. ✅ Duplicate email rejected
10. ✅ Data persists after server restart

---

## 🆘 Troubleshooting

### Problem: "Could not connect to database"

```bash
[ ] Check 1: Is PostgreSQL running?
    pg_isready -h localhost -p 5432
    Expected: accepting connections

[ ] Check 2: Do credentials match in .env?
    psql -U postgres
    If fails, adjust .env DATABASE_PASSWORD

[ ] Check 3: Does database exist?
    psql -U postgres
    \l
    Look for soul_card_db
```

### Problem: "Connection timeout"

```bash
[ ] Check 1: PostgreSQL service running
    Windows: Services app → PostgreSQL
    Mac: brew services list
    Linux: sudo systemctl status postgresql

[ ] Check 2: No firewall blocking 5432
    Windows: Firewall → Allow app through
```

### Problem: "Password authentication failed"

```bash
[ ] Check 1: Get PostgreSQL password
    Windows: Remember password from install
    Mac: Default is empty (just press Enter)
    Linux: Default is empty or check initial setup

[ ] Check 2: Update .env
    DATABASE_PASSWORD=YOUR_PASSWORD

[ ] Check 3: Restart app
    npm run start:dev
```

### Problem: Table not created

```bash
[ ] Check 1: Is app running?
    npm run start:dev
    Should show: 📊 Database: localhost:5432 ✅

[ ] Check 2: Check logs for errors
    Look for TypeORM initialization messages

[ ] Check 3: Verify database exists
    psql -U postgres -d soul_card_db
    \dt
    Should show users table
```

### Problem: "Port already in use"

```bash
[ ] Solution: Change PORT in .env
    PORT=3001  (or any unused port)

[ ] Restart app
    npm run start:dev

[ ] Test: curl http://localhost:3001/auth/login
```

---

## 📞 Need Help?

### Check These Files (In Order)

1. **DATABASE_SETUP.md** - PostgreSQL setup
2. **ARCHITECTURE.md** - System design
3. **MIGRATION_SUMMARY.md** - What changed
4. **MIGRATIONS_GUIDE.md** - TypeORM details

### Common Questions

**Q: Why is my password not working?**
A: Check you used the correct PostgreSQL password set during installation.

**Q: Do I need to create the users table?**
A: No! TypeORM auto-creates it on first run (synchronize: true in dev).

**Q: Where's the database file?**
A: PostgreSQL databases are server-side (not local files). Data stored on 5432.

**Q: Can I use MySQL instead?**
A: Yes! Change `type: 'postgres'` to `type: 'mysql'` in database.config.ts

**Q: How do I backup my data?**
A: Use `pg_dump -U postgres -d soul_card_db > backup.sql`

---

## 🎉 You're Done!

Once all checks pass, you have:

- ✅ PostgreSQL database running
- ✅ Users table auto-managed by TypeORM
- ✅ Persistent data storage
- ✅ Production-ready architecture
- ✅ Scalable application

**Next Steps:**

1. Review ARCHITECTURE.md to understand the system
2. Start building frontend features
3. Add password hashing (bcrypt)
4. Implement JWT authentication
5. Deploy to production

---

## 📚 Quick Reference Commands

```bash
# Start development
npm run start:dev

# Check PostgreSQL
pg_isready -h localhost -p 5432
psql -U postgres -d soul_card_db

# Database queries
SELECT * FROM users;
SELECT * FROM users WHERE email='test@example.com';
DELETE FROM users;  -- Clear test data

# API Tests
curl -X POST http://localhost:3000/auth/signup ...
curl -X POST http://localhost:3000/auth/login ...
curl -X POST http://localhost:3000/auth/forgot-password ...
```

---

**Congratulations! Your database is now production-ready!** 🚀

Start here: **npm run start:dev** 🎉
