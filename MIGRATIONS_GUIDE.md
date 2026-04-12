# Database Migration & TypeORM Guide

## 🚀 Auto-Schema Generation (Development)

When you run the application in development:

```bash
npm run start:dev
```

TypeORM automatically:

1. ✅ Connects to PostgreSQL database
2. ✅ Reads all `@Entity` decorators
3. ✅ Generates CREATE TABLE statements
4. ✅ Creates tables if they don't exist
5. ✅ Syncs schema changes

### Configuration (in src/config/database.config.ts)

```typescript
synchronize: process.env.NODE_ENV !== 'production',
// ↑ In development: TRUE (auto-create tables)
// ↑ In production: FALSE (use migrations)
```

---

## 🗂️ What Gets Created

### Database Name

```
soul_card_db
```

### Tables

```
users (auto-created on first run)
```

### Indexes

```
idx_users_email          → Email lookup optimization
idx_users_username       → Username lookup optimization
idx_users_reset_token    → Password reset token lookup
```

---

## 🔧 Manual TypeORM Setup (Production-Ready)

### Step 1: Install TypeORM CLI

```bash
npm install typeorm -g
# OR
npm install --save-dev typeorm
```

### Step 2: Create First Migration

```bash
npx typeorm migration:generate src/migrations/CreateUsersTable -d src/config/database.config.ts
```

This generates:

```typescript
// src/migrations/1724234567890-CreateUsersTable.ts
import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateUsersTable1724234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'username',
            type: 'varchar',
            isUnique: true,
            isNullable: false,
          },
          // ... more columns
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users');
  }
}
```

### Step 3: Run Migration

```bash
npx typeorm migration:run -d src/config/database.config.ts
```

### Step 4: Deploy to Production

- ✅ Copy migrations to production
- ✅ Run migrations: `npm run migrate`
- ✅ Schema is now consistent
- ✅ Changes are tracked in git

---

## 📊 Comparison: Auto-Sync vs Migrations

| Feature            | Auto-Sync       | Migrations  |
| ------------------ | --------------- | ----------- |
| Development        | ✅ Fast         | ⏳ Slower   |
| Production         | ❌ Unsafe       | ✅ Safe     |
| Version Control    | ❌ Not tracked  | ✅ Tracked  |
| Rollback           | ❌ Not possible | ✅ Possible |
| Data Loss Risk     | ⚠️ High         | ✅ Low      |
| Team Collaboration | ❌ Poor         | ✅ Good     |

---

## 🔄 Migration Workflow

### Development Phase

```
1. Create new Entity
        ↓
2. Test with auto-sync: npm run start:dev
        ↓
3. Verify tables created
        ↓
4. Commit code
```

### Pre-Production Phase

```
1. Generate migration
   npx typeorm migration:generate
        ↓
2. Review migration SQL
        ↓
3. Test migration: npx typeorm migration:run
        ↓
4. Commit migration files
        ↓
5. Deploy to production
```

### Production Phase

```
1. Deploy code
        ↓
2. Stop application
        ↓
3. Backup database
   pg_dump > backup.sql
        ↓
4. Run migrations
   npm run migrate
        ↓
5. Start application
        ↓
6. Monitor logs
```

---

## 🛡️ Safety Checklist

Before deploying to production:

- [ ] Backup database: `pg_dump -U user -d soil_card_db > backup.sql`
- [ ] Test migration locally: `npm run migrate`
- [ ] Review migration SQL for safety
- [ ] Have rollback plan ready
- [ ] Schedule deployment during maintenance window
- [ ] Have database admin on standby
- [ ] Monitor application logs post-deployment

---

## 📋 TypeORM Decorators Reference

### Entity Decorators

```typescript
@Entity('table_name')              // Define table name
@Index(['column'], { unique: true })  // Create index
export class User { ... }
```

### Column Decorators

```typescript
@PrimaryGeneratedColumn('uuid')    // UUID primary key
@Column({ type: 'varchar', length: 100 })  // VARCHAR column
@Column({ unique: true })          // Unique constraint
@Column({ nullable: true })        // Allow NULL
@Column({ default: true })         // Default value
@CreateDateColumn()                // Auto set created_at
@UpdateDateColumn()                // Auto set updated_at
```

### Relation Decorators (Future)

```typescript
@OneToMany(() => Post, post => post.author)  // One-to-many
@ManyToOne(() => User)                        // Many-to-one
@ManyToMany(() => Tag)                        // Many-to-many
```

---

## 🔍 Debugging Migrations

### View Migration Status

```bash
npx typeorm migration:show -d src/config/database.config.ts
```

### Revert Last Migration

```bash
npx typeorm migration:revert -d src/config/database.config.ts
```

### View Generated SQL

Add to database config:

```typescript
logging: ['query'],  // Log all queries
```

---

## 🚨 Common Issues & Solutions

### Issue: "Migration already executed"

```bash
# Solution: Revert and re-run
npx typeorm migration:revert -d src/config/database.config.ts
npx typeorm migration:run -d src/config/database.config.ts
```

### Issue: "Cannot drop table - it has dependent objects"

```bash
# Check dependencies
SELECT * FROM pg_depend WHERE refobjid = 'users'::regclass;

# Drop with CASCADE
DROP TABLE users CASCADE;
```

### Issue: "Duplicate key value violates unique constraint"

```bash
# Clear data
DELETE FROM users;

# OR create migration to handle data
```

### Issue: "Connection timeout"

```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Check credentials in .env
DATABASE_USER=correct_user
DATABASE_PASSWORD=correct_password
```

---

## 📈 Performance: Indexes

Automatically created indexes from Entity:

```typescript
@Entity('users')
@Index(['email'], { unique: true })
@Index(['username'], { unique: true })
@Index(['resetToken'])
export class User {
  // These make queries faster:
  // - findByEmail()
  // - findByUsername()
  // - verifyResetToken()
}
```

---

## 🔐 Data Integrity

### Constraints Enforced by Entity

```typescript
@Entity('users')
export class User {
  @Column({ length: 100 })           // Max 100 chars
  @Column({ unique: true })          // Can't duplicate
  @Column({ nullable: false })       // Can't be NULL
}
```

Equivalent SQL:

```sql
CREATE TABLE users (
  username VARCHAR(100) NOT NULL UNIQUE,
  ...
);
```

---

## 📚 Full Migration Example

### Define Entity

```typescript
// src/users/entities/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  username: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @CreateDateColumn()
  createdAt: Date;
}
```

### Generate Migration

```bash
npx typeorm migration:generate src/migrations/CreateUsersTable -d src/config/database.config.ts
```

### Run Migration

```bash
npx typeorm migration:run -d src/config/database.config.ts
```

### Result

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  ...
);
```

---

## 🎯 Next Steps

### Immediate

1. ✅ Run `npm install` (installs TypeORM)
2. ✅ Set up PostgreSQL
3. ✅ Create `.env` file
4. ✅ Start app: `npm run start:dev`
5. ✅ Tables auto-created ✨

### Later (Production)

1. ⏳ Generate migrations
2. ⏳ Test migrations locally
3. ⏳ Deploy migrations to production
4. ⏳ Set `synchronize: false` in production

---

## 📖 Resources

- [TypeORM Documentation](https://typeorm.io/)
- [TypeORM Migrations](https://typeorm.io/migrations)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [NestJS + TypeORM](https://docs.nestjs.com/techniques/database)

---

## ✅ Status

- ✅ TypeORM configured
- ✅ User entity created
- ✅ Auto-sync enabled for development
- ✅ Database indexes created
- ✅ Ready for production migrations

**Next: Run `npm install && npm run start:dev`** 🚀
