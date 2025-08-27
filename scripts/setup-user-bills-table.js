const fs = require('fs');
const path = require('path');
const postgres = require('postgres');

// Load .env file manually
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key] = valueParts.join('=');
  }
});

// Database connection with single connection
const sql = postgres(envVars.DATABASE_URL, {
  max: 1, // Only use 1 connection
  idle_timeout: 20,
  connect_timeout: 10,
});

async function setupUserBillsTable() {
  try {
    console.log('Setting up user_bills table...');
    
    // Create user_bills table to track which bills each user has adopted
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
    
    // Create indexes for performance
    await sql`CREATE INDEX IF NOT EXISTS idx_user_bills_user_id ON user_bills(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_bills_bill_id ON user_bills(bill_id);`;
    console.log('✅ Indexes created');
    
    console.log('\n🎉 User bills table setup complete!');
    
  } catch (error) {
    console.error('Error setting up user_bills table:', error);
  } finally {
    await sql.end();
  }
}

setupUserBillsTable();
