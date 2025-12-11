-- Add CHECK constraint to enforce valid role values on user table

ALTER TABLE "user" 
DROP CONSTRAINT IF EXISTS check_valid_role;

ALTER TABLE "user" 
ADD CONSTRAINT check_valid_role 
CHECK (role IN ('user', 'intern', 'supervisor', 'admin'));
