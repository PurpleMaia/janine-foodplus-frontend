const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL);

async function addRoleConstraint() {
  try {
    console.log('📋 Adding role constraint to user table...');

    // Add CHECK constraint to enforce valid role values
    await sql`
      ALTER TABLE "user" 
      ADD CONSTRAINT check_valid_role 
      CHECK (role IN ('user', 'intern', 'supervisor', 'admin'));
    `;

    console.log('✅ Successfully added role constraint');
    console.log('   Valid roles: user, intern, supervisor, admin');

  } catch (error) {
    if (error.code === '23505' || error.message.includes('already exists')) {
      console.log('ℹ️  Constraint already exists, skipping...');
    } else {
      console.error('Error adding role constraint:', error);
    }
  } finally {
    await sql.end();
  }
}

addRoleConstraint();

