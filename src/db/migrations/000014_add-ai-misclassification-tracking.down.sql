

ALTER TABLE bills
    DROP COLUMN IF EXISTS ai_misclassification_type;

DROP TYPE IF EXISTS ai_misclassification;

