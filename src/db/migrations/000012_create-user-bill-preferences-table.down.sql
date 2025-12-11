-- Remove user_bill_preferences table

-- Drop indexes first
DROP INDEX IF EXISTS idx_user_bill_preferences_user_id;
DROP INDEX IF EXISTS idx_user_bill_preferences_bill_id;

-- Drop the table (this will also drop the foreign key constraints and unique constraint)
DROP TABLE IF EXISTS user_bill_preferences;
