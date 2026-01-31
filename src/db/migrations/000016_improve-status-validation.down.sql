-- Rollback the status validation improvements
DROP INDEX IF EXISTS idx_bills_manual_review;
DROP INDEX IF EXISTS idx_bills_status_confidence;

ALTER TABLE bills 
DROP COLUMN IF EXISTS status_confidence,
DROP COLUMN IF EXISTS last_validation_check,
DROP COLUMN IF EXISTS needs_manual_review;

ALTER TABLE ai_misclassification_tracking 
DROP COLUMN IF EXISTS validation_rule_triggered,
DROP COLUMN IF EXISTS manual_override_applied,
DROP COLUMN IF EXISTS resolved_at;