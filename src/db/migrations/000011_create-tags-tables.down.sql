-- Remove tags tables

-- Drop indexes first
DROP INDEX IF EXISTS idx_bill_tags_bill_id;
DROP INDEX IF EXISTS idx_bill_tags_tag_id;
DROP INDEX IF EXISTS idx_tags_name;

-- Drop bill_tags table first (depends on tags)
DROP TABLE IF EXISTS bill_tags;

-- Drop tags table
DROP TABLE IF EXISTS tags;
