const postgres = require('postgres');

// Database connection
const sql = postgres(process.env.DATABASE_URL);

async function setupBasicTables() {
  try {
    console.log('Setting up basic database tables...');
    
    // Create bills table
    await sql`
      CREATE TABLE IF NOT EXISTS bills (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        bill_number TEXT NOT NULL,
        bill_type TEXT NOT NULL,
        title TEXT,
        description TEXT,
        bill_url TEXT,
        food_related BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    console.log('✅ Bills table created');
    
    // Create status_updates table
    await sql`
      CREATE TABLE IF NOT EXISTS status_updates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
        chamber TEXT,
        date TIMESTAMPTZ,
        statustext TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    console.log('✅ Status updates table created');
    
    // Create user_bills table
    await sql`
      CREATE TABLE IF NOT EXISTS user_bills (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
        adopted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, bill_id)
      );
    `;
    console.log('✅ User bills table created');
    
    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_bills_bill_number ON bills(bill_number);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_bills_bill_type ON bills(bill_type);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_bills_food_related ON bills(food_related);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_status_updates_bill_id ON status_updates(bill_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_bills_user_id ON user_bills(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_bills_bill_id ON user_bills(bill_id);`;
    console.log('✅ Indexes created');
    
    console.log('\n🎉 Basic tables setup complete!');
    
  } catch (error) {
    console.error('Error setting up tables:', error);
  } finally {
    await sql.end();
  }
}

setupBasicTables();
