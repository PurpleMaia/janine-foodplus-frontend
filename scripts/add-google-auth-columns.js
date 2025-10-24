const postgres = require('postgres');
// require('dotenv').config();

// Database connection
const sql = postgres(process.env.DATABASE_URL);

async function addGoogleAuthColumns() {
  try {
    console.log('Adding Google authentication columns to user table...');
    
    // Add columns to user table
    await sql`
      ALTER TABLE "user" 
      ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE,
      ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
      ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'local'
    `;
    console.log('✅ Added google_id, profile_picture_url, and auth_provider columns to user table');
    
    // Add columns to auth_key table  
    await sql`
      ALTER TABLE auth_key
      ADD COLUMN IF NOT EXISTS google_refresh_token TEXT
    `;
    console.log('✅ Added google_refresh_token column to auth_key table');
    
    // Make hashed_password nullable for Google users
    await sql`
      ALTER TABLE auth_key
      ALTER COLUMN hashed_password DROP NOT NULL
    `;
    console.log('✅ Made hashed_password nullable in auth_key table');
    
    // Add indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_user_google_id ON "user"(google_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_auth_provider ON "user"(auth_provider);`;
    console.log('✅ Created indexes for google_id and auth_provider');
    
    // Verify the changes
    const userColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'user' 
      AND column_name IN ('google_id', 'profile_picture_url', 'auth_provider')
      ORDER BY column_name
    `;
    
    const authKeyColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'auth_key' 
      AND column_name = 'google_refresh_token'
    `;
    
    console.log('\n📋 Verification - New columns added:');
    console.log('User table:');
    userColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default || 'none'})`);
    });
    
    console.log('\nAuth_key table:');
    authKeyColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    console.log('\n🎉 Google authentication columns migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Update db/types.ts with the new column types');
    console.log('2. Update your authentication logic to handle Google auth');
    console.log('3. Test the changes with existing functionality');
    
  } catch (error) {
    console.error('❌ Error adding Google auth columns:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await sql.end();
  }
}

addGoogleAuthColumns();
