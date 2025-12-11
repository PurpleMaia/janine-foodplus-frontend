-- Create pending_proposals table for status change proposals

CREATE TABLE IF NOT EXISTS pending_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    proposed_by_user_id UUID NOT NULL REFERENCES "user"(id),
    proposed_status TEXT NOT NULL,
    current_status TEXT NOT NULL,
    proposed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    approval_status TEXT DEFAULT 'pending',
    approved_by_user_id UUID REFERENCES "user"(id),
    approved_at TIMESTAMP,
    note TEXT,
    UNIQUE(bill_id, proposed_by_user_id, proposed_status)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pending_proposals_bill_id ON pending_proposals(bill_id);
CREATE INDEX IF NOT EXISTS idx_pending_proposals_proposed_by_user_id ON pending_proposals(proposed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_pending_proposals_approval_status ON pending_proposals(approval_status);
