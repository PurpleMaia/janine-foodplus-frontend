const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL);

async function createPendingProposalsTable() {
  try {
    console.log('📋 Creating pending_proposals table...');

    // Create the table
    await sql`
      CREATE TABLE IF NOT EXISTS pending_proposals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        bill_id TEXT NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
        proposing_user_id TEXT NOT NULL REFERENCES "user"(id),
        proposed_status TEXT NOT NULL,
        current_status TEXT NOT NULL,
        proposed_at TIMESTAMP NOT NULL DEFAULT NOW(),
        approval_status TEXT DEFAULT 'pending',
        approved_by_user_id TEXT REFERENCES "user"(id),
        approved_at TIMESTAMP,
        note TEXT,
        UNIQUE(bill_id, proposing_user_id, proposed_status)
      );
    `;

    console.log('✅ Created pending_proposals table');

  } catch (error) {
    console.error('❌ Error creating pending_proposals table:', error);
  } finally {
    await sql.end();
  }
}

createPendingProposalsTable();
