-- Create user_bill_preferences table for storing user-specific bill preferences (like nicknames)

CREATE TABLE IF NOT EXISTS user_bill_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    nickname TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT user_bill_preferences_user_bill_unique UNIQUE (user_id, bill_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_bill_preferences_user_id ON user_bill_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bill_preferences_bill_id ON user_bill_preferences(bill_id);
