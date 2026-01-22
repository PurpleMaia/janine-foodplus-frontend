
ALTER TABLE bills
  RENAME COLUMN bill_status TO current_status;

ALTER TABLE bills
  ALTER COLUMN current_status DROP DEFAULT,
  ALTER COLUMN current_status TYPE varchar(50) USING current_status::text,
  ALTER COLUMN current_status SET DEFAULT '';

ALTER TABLE bills
  DROP CONSTRAINT IF EXISTS bills_bill_number_year_key,
  DROP COLUMN IF EXISTS year;

DROP TYPE IF EXISTS bill_status;
