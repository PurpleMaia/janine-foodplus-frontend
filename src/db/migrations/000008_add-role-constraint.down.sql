-- Remove CHECK constraint for role values

ALTER TABLE "user" 
DROP CONSTRAINT IF EXISTS check_valid_role;
