-- Create supervisor system tables and columns

-- Add requested_supervisor column to user table
ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS requested_supervisor BOOLEAN DEFAULT false;

-- Create supervisor_users table for adoption relationships
CREATE TABLE IF NOT EXISTS supervisor_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supervisor_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(supervisor_id, user_id)
);

-- Add foreign key constraints
ALTER TABLE supervisor_users 
ADD CONSTRAINT fk_supervisor 
FOREIGN KEY (supervisor_id) REFERENCES "user"(id) ON DELETE CASCADE;

ALTER TABLE supervisor_users 
ADD CONSTRAINT fk_user 
FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_supervisor_users_supervisor ON supervisor_users(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_supervisor_users_user ON supervisor_users(user_id);
