const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL);

async function createSupervisorSystem() {
  try {
    console.log('📋 Setting up supervisor system...');

    // 1. Add requested_supervisor column to user table
    try {
      await sql`
        ALTER TABLE "user" 
        ADD COLUMN IF NOT EXISTS requested_supervisor BOOLEAN DEFAULT false
      `;
      console.log('✅ Added requested_supervisor column to user table');
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
      console.log('ℹ️  requested_supervisor column already exists');
    }

    // 2. Create supervisor_users table for adoption relationships
    // Note: Using TEXT for both IDs since user.id is TEXT
    await sql`
      CREATE TABLE IF NOT EXISTS supervisor_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        supervisor_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(supervisor_id, user_id)
      )
    `;
    
    // Add foreign key constraints manually since user.id is TEXT
    try {
      await sql`
        ALTER TABLE supervisor_users 
        ADD CONSTRAINT fk_supervisor 
        FOREIGN KEY (supervisor_id) REFERENCES "user"(id) ON DELETE CASCADE
      `;
      console.log('✅ Added foreign key constraint for supervisor_id');
    } catch (error) {
      if (!error.message.includes('already exists')) {
        console.log('ℹ️  supervisor_id foreign key already exists');
      }
    }
    
    try {
      await sql`
        ALTER TABLE supervisor_users 
        ADD CONSTRAINT fk_user 
        FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
      `;
      console.log('✅ Added foreign key constraint for user_id');
    } catch (error) {
      if (!error.message.includes('already exists')) {
        console.log('ℹ️  user_id foreign key already exists');
      }
    }
    
    console.log('✅ Created supervisor_users table');

    // 3. Create index for faster lookups
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_supervisor_users_supervisor ON supervisor_users(supervisor_id)`;
      console.log('✅ Created index on supervisor_users(supervisor_id)');
    } catch (error) {
      console.log('ℹ️  Index already exists');
    }

    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_supervisor_users_user ON supervisor_users(user_id)`;
      console.log('✅ Created index on supervisor_users(user_id)');
    } catch (error) {
      console.log('ℹ️  Index already exists');
    }

    console.log('\n✅ Supervisor system setup complete!');
    console.log('   - supervisor_users table created');
    console.log('   - requested_supervisor column added');

  } catch (error) {
    console.error('Error setting up supervisor system:', error);
  } finally {
    await sql.end();
  }
}

createSupervisorSystem();

