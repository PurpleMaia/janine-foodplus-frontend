const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL);

async function mergeInternIntoUser() {
  try {
    console.log('🔄 Merging intern role into user role...');

    // First, update all intern users to user
    const result = await sql`
      UPDATE "user" 
      SET role = 'user' 
      WHERE role = 'intern'
    `;
    console.log(`✅ Updated ${result.count} intern user(s) to 'user' role`);

    // Drop the old constraint
    await sql`
      ALTER TABLE "user" 
      DROP CONSTRAINT IF EXISTS check_valid_role
    `;
    console.log('✅ Dropped old constraint');

    // Add new constraint with only user, supervisor, admin
    await sql`
      ALTER TABLE "user" 
      ADD CONSTRAINT check_valid_role 
      CHECK (role IN ('user', 'supervisor', 'admin'))
    `;
    console.log('✅ Added new constraint');
    console.log('   Valid roles: user, supervisor, admin');

    // Show final role distribution
    const final = await sql`
      SELECT role, COUNT(*) as count 
      FROM "user" 
      GROUP BY role
    `;
    console.log('\n📊 Final role distribution:');
    console.table(final);

  } catch (error) {
    console.error('Error merging roles:', error);
  } finally {
    await sql.end();
  }
}

mergeInternIntoUser();

