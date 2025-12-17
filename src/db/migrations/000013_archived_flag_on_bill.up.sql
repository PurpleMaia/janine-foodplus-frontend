ALTER TABLE bills
ADD COLUMN archived BOOLEAN NOT NULL DEFAULT FALSE;

-- This sets all existing bills to archived = TRUE
UPDATE bills
SET archived = TRUE