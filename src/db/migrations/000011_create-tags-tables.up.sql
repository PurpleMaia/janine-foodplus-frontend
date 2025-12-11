-- Create tags tables for bill tagging

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    color TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create bill_tags junction table
CREATE TABLE IF NOT EXISTS bill_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(bill_id, tag_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bill_tags_bill_id ON bill_tags(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_tags_tag_id ON bill_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
