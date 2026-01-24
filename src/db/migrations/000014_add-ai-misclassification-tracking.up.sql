

CREATE TYPE ai_misclassification AS ENUM (
    'false_positive',
    'false_negative'
);

ALTER TABLE bills
   ADD COLUMN ai_misclassification_type ai_misclassification DEFAULT NULL;

