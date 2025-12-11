-- Remove pending_proposals table

DROP INDEX IF EXISTS idx_pending_proposals_approval_status;
DROP INDEX IF EXISTS idx_pending_proposals_proposing_user_id;
DROP INDEX IF EXISTS idx_pending_proposals_bill_id;

DROP TABLE IF EXISTS pending_proposals;
