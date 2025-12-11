-- Remove email verification columns from user table

-- Drop index first
DROP INDEX IF EXISTS idx_user_verification_token;

-- Remove columns
ALTER TABLE "user" DROP COLUMN IF EXISTS verification_token;
ALTER TABLE "user" DROP COLUMN IF EXISTS email_verified;
