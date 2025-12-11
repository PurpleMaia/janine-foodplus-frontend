# Database Migration Guide

## Installation

### Prerequisites - Install golang-migrate CLI

**macOS (Homebrew):**
```bash
brew install golang-migrate
```

**Windows (Scoop):**
```bash
scoop install migrate
```

### Project Dependencies
```bash
npm i kysely
npm i --save-dev @types/pg
npm i --save-dev kysely-codegen
```

---

## Using NPM Scripts (Recommended)

The project includes convenient npm scripts that wrap the migration shell scripts. Make sure your `DATABASE_URL` is set in your `.env` file.

### Check Current Migration Version
```bash
npm run migrate:version
```

### Create a New Migration
```bash
npm run migrate:create <migration_name>
```
Example:
```bash
npm run migrate:create add_user_preferences
```
This creates two files in `db/migrations/`:
- `000013_add_user_preferences.up.sql`
- `000013_add_user_preferences.down.sql`

### Run All Pending Migrations (Up, test Down, then Up)
```bash
npm run migrate:up d
# or
npm run migrate:up dev
```

### Rollback Migrations (Down)
```bash
# Rollback a specific number of migrations
npm run migrate:down <number>
```
Example:
```bash
npm run migrate:down 1   # Rollback 1 migration
npm run migrate:down 3   # Rollback 3 migrations
```

### Rollback ALL Migrations
```bash
npm run migrate:down-all
```
⚠️ **Warning:** This will drop all tables. Use with caution!

### Force Migration Version
Use this when a migration fails partway through and the database is in a dirty state:
```bash
npm run migrate:force <version>
```
Example:
```bash
npm run migrate:force 5   # Force to version 5
```

---

## Using Shell Scripts Directly

The npm scripts call shell scripts located in `scripts/migrations/`. You can also run them directly:

| Script | Purpose |
|--------|---------|
| `./scripts/migrations/version.sh` | Show current migration version |
| `./scripts/migrations/create.sh <name>` | Create new migration files |
| `./scripts/migrations/migrate.sh p` | Run migrations (with test rollback) |
| `./scripts/migrations/down.sh <n>` | Rollback n migrations |
| `./scripts/migrations/down-all.sh` | Rollback all migrations |
| `./scripts/migrations/force.sh <version>` | Force to specific version |

---

## Manual Commands (Raw migrate CLI)

If you prefer using the migrate CLI directly:

### Set Environment
```bash
export DATABASE_URL=<your_database_url>?sslmode=disable
```

### Create Migration
```bash
migrate create -ext sql -dir db/migrations -seq <migration_name>
```

### Run Migrations Up
```bash
migrate -database "${DATABASE_URL}" -path db/migrations up
```

### Run Migrations Down
```bash
migrate -database "${DATABASE_URL}" -path db/migrations down 1
```

### Force Version
```bash
migrate -database "${DATABASE_URL}" -path db/migrations force <version>
```

---

## Troubleshooting

### Migration Failed with SQL Errors
1. Fix the SQL in the migration file
2. Force back to a previous good version:
   ```bash
   npm run migrate:force <good_version>
   ```
3. Try running migrations again:
   ```bash
   npm run migrate:up p
   ```

### Database is in "Dirty" State
This happens when a migration fails partway through. Force to the last successful version:
```bash
npm run migrate:force <last_good_version>
```

---

## After Migrations: Update TypeScript Types

After running migrations, regenerate the Kysely types to match your new schema:
```bash
npm run codegen
```

This updates `db/types.ts` with the latest table definitions.