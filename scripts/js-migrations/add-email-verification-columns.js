const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL);

async function addEmailVerificationColumns() {
  try {
    console.log('Adding email verification columns to user table...');
    
    // Add email_verified column (default false)
    await sql`
      ALTER TABLE "user" 
      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false
    `;
    console.log('✅ Added email_verified column');
    
    // Add verification_token column (nullable, will be set when user registers)
    await sql`
      ALTER TABLE "user" 
      ADD COLUMN IF NOT EXISTS verification_token TEXT
    `;
    console.log('✅ Added verification_token column');
    
    // Create index on verification_token for faster lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_user_verification_token 
      ON "user"(verification_token) 
      WHERE verification_token IS NOT NULL
    `;
    console.log('✅ Created index on verification_token');
    
    // Update existing users to have email_verified = false (can be updated manually if needed)
    await sql`
      UPDATE "user" 
      SET email_verified = false 
      WHERE email_verified IS NULL
    `;
    console.log('✅ Updated existing users with default email_verified value');
    
    console.log('\n🎉 Email verification columns added successfully!');
    
  } catch (error) {
    console.error('Error adding email verification columns:', error);
  } finally {
    await sql.end();
  }
}

addEmailVerificationColumns();

