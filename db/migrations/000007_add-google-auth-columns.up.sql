-- Add Google authentication columns

-- Add columns to user table
ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE;

ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'local';

-- Add google_refresh_token column to auth_key table
ALTER TABLE auth_key
ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;

-- Make hashed_password nullable for Google users
ALTER TABLE auth_key
ALTER COLUMN hashed_password DROP NOT NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_google_id ON "user"(google_id);
CREATE INDEX IF NOT EXISTS idx_user_auth_provider ON "user"(auth_provider);
