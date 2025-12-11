const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL);

async function markUserVerified(email) {
  try {
    console.log(`🔍 Finding user: ${email}...\n`);
    
    // Find user
    const user = await sql`
      SELECT id, email, username, email_verified, account_status
      FROM "user"
      WHERE email = ${email}
      OR username = ${email}
    `;

    if (user.length === 0) {
      console.log(`❌ User not found: ${email}`);
      return;
    }

    const foundUser = user[0];
    console.log('Found user:');
    console.log(`  ID: ${foundUser.id}`);
    console.log(`  Email: ${foundUser.email}`);
    console.log(`  Username: ${foundUser.username}`);
    console.log(`  Current Email Verified: ${foundUser.email_verified}`);
    console.log(`  Current Account Status: ${foundUser.account_status || 'null'}\n`);

    if (foundUser.email_verified === true) {
      console.log('✅ User is already verified!');
      return;
    }

    // Update to verified
    const result = await sql`
      UPDATE "user"
      SET email_verified = true
      WHERE id = ${foundUser.id}
    `;

    console.log('✅ User marked as verified successfully!');
    console.log(`   Updated: ${foundUser.email} (${foundUser.username})`);

  } catch (error) {
    console.error('❌ Error marking user as verified:', error);
  } finally {
    await sql.end();
  }
}

// Get email from command line argument
const email = process.argv[2];
if (!email) {
  console.log('Usage: node scripts/mark-user-verified.js <email>');
  process.exit(1);
}

markUserVerified(email);

