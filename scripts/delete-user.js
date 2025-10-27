const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL);

async function deleteUser() {
  try {
    const email = process.argv[2];
    
    if (!email) {
      console.log('Usage: node scripts/delete-user.js <email>');
      console.log('Example: node scripts/delete-user.js newintern1@gmail.com');
      return;
    }
    
    console.log(`🔍 Looking for user with email: ${email}`);
    
    const user = await sql`
      SELECT id, email, username, role, account_status
      FROM "user"
      WHERE email = ${email}
    `;

    if (user.length === 0) {
      console.log('❌ User not found');
      return;
    }

    const foundUser = user[0];
    console.log(`\n📝 Found user:`);
    console.log(`   Email: ${foundUser.email}`);
    console.log(`   Username: ${foundUser.username}`);
    console.log(`   Role: ${foundUser.role}`);
    console.log(`   Status: ${foundUser.account_status}`);
    console.log(`   ID: ${foundUser.id}\n`);

    // Delete user (cascade will handle related records)
    await sql`DELETE FROM "user" WHERE id = ${foundUser.id}`;
    
    console.log('✅ User deleted successfully');

  } catch (error) {
    console.error('Error deleting user:', error);
  } finally {
    await sql.end();
  }
}

deleteUser();

