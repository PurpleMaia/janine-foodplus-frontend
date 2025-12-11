const postgres = require('postgres');
require('dotenv').config();

// Database connection
const sql = postgres(process.env.DATABASE_URL);

async function setupAuthTables() {
  try {
    console.log('Setting up authentication tables...');
    
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS "user" (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    console.log('✅ Users table created');
    
    // Create auth_key table
    await sql`
      CREATE TABLE IF NOT EXISTS auth_key (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        hashed_password TEXT
      );
    `;
    console.log('✅ Auth key table created');
    
    // Create session table
    await sql`
      CREATE TABLE IF NOT EXISTS session (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL
      );
    `;
    console.log('✅ Session table created');
    
    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_auth_key_user_id ON auth_key(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_session_user_id ON session(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_session_expires_at ON session(expires_at);`;
    console.log('✅ Indexes created');
    
    console.log('\n🎉 Authentication tables setup complete!');
    
  } catch (error) {
    console.error('Error setting up tables:', error);
  } finally {
    await sql.end();
  }
}

setupAuthTables();
