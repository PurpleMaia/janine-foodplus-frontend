-- Add columns to track status validation and improve classification accuracy
ALTER TABLE bills 
ADD COLUMN IF NOT EXISTS status_confidence DECIMAL(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS last_validation_check TIMESTAMP,
ADD COLUMN IF NOT EXISTS needs_manual_review BOOLEAN DEFAULT FALSE;

-- Add index for bills that need manual review
CREATE INDEX IF NOT EXISTS idx_bills_manual_review ON bills (needs_manual_review) WHERE needs_manual_review = TRUE;

-- Add index for status confidence scoring
CREATE INDEX IF NOT EXISTS idx_bills_status_confidence ON bills (status_confidence);

-- Update the ai_misclassification_tracking table to include more context
ALTER TABLE ai_misclassification_tracking 
ADD COLUMN IF NOT EXISTS validation_rule_triggered TEXT,
ADD COLUMN IF NOT EXISTS manual_override_applied BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP;