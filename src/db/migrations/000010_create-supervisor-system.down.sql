-- Remove supervisor system tables and columns

-- Drop indexes first
DROP INDEX IF EXISTS idx_supervisor_users_supervisor;
DROP INDEX IF EXISTS idx_supervisor_users_user;

-- Drop supervisor_users table (this will also drop the foreign key constraints)
DROP TABLE IF EXISTS supervisor_users;

-- Remove requested_supervisor column from user table
ALTER TABLE "user" DROP COLUMN IF EXISTS requested_supervisor;
