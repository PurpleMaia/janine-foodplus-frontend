-- Remove Google authentication columns

-- Drop indexes first
DROP INDEX IF EXISTS idx_user_google_id;
DROP INDEX IF EXISTS idx_user_auth_provider;

-- Remove columns from auth_key table
ALTER TABLE auth_key DROP COLUMN IF EXISTS google_refresh_token;

-- Note: We don't restore NOT NULL on hashed_password as it may break existing data

-- Remove columns from user table
ALTER TABLE "user" DROP COLUMN IF EXISTS auth_provider;
ALTER TABLE "user" DROP COLUMN IF EXISTS profile_picture_url;
ALTER TABLE "user" DROP COLUMN IF EXISTS google_id;
