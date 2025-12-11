-- Add CHECK constraint to enforce valid role values on user table

ALTER TABLE "user" 
ADD CONSTRAINT check_valid_role 
CHECK (role IN ('user', 'intern', 'supervisor', 'admin'));
