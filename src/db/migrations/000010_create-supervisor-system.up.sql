-- Create supervisor system tables and columns

-- Add requested_supervisor column to user table
ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS requested_supervisor BOOLEAN DEFAULT false;

-- Create supervisor_users table for adoption relationships
CREATE TABLE IF NOT EXISTS supervisor_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supervisor_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(supervisor_id, user_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_supervisor_users_supervisor ON supervisor_users(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_supervisor_users_user ON supervisor_users(user_id);
