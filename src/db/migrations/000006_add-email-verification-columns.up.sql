-- Add email verification columns to user table

-- Add email_verified column (default false)
ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- Add verification_token column (nullable, will be set when user registers)
ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS verification_token TEXT;

-- Create index on verification_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_verification_token 
ON "user"(verification_token) 
WHERE verification_token IS NOT NULL;

-- Update existing users to have email_verified = false
UPDATE "user" 
SET email_verified = false 
WHERE email_verified IS NULL;
