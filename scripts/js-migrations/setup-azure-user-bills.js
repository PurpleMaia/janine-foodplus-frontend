const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

// Manually load .env file
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key] = valueParts.join('=');
  }
});

// Database connection - this will use the .env file (Azure)
const sql = postgres(envVars.DATABASE_URL);

async function setupAzureUserBills() {
  try {
    console.log('Setting up user_bills table in Azure database...');
    
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
    await sql`CREATE INDEX IF NOT EXISTS idx_user_bills_user_id ON user_bills(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_bills_bill_id ON user_bills(bill_id);`;
    console.log('✅ Indexes created');
    
    console.log('\n🎉 Azure user_bills table setup complete!');
    
  } catch (error) {
    console.error('Error setting up Azure user_bills table:', error);
  } finally {
    await sql.end();
  }
}

setupAzureUserBills();
