const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL);

async function listVerifiedAccounts() {
  try {
    console.log('📋 Fetching all accounts with verification status...\n');
    
    const users = await sql`
      SELECT 
        id,
        email, 
        username, 
        role, 
        account_status, 
        email_verified,
        requested_admin,
        created_at
      FROM "user"
      ORDER BY 
        email_verified DESC,
        created_at DESC
    `;

    console.log('=' .repeat(120));
    console.log(`Total Users: ${users.length}\n`);

    const verifiedUsers = users.filter(u => u.email_verified === true);
    const unverifiedUsers = users.filter(u => u.email_verified === false || u.email_verified === null);
    
    console.log(`✅ Verified Accounts: ${verifiedUsers.length}`);
    console.log(`❌ Unverified Accounts: ${unverifiedUsers.length}`);
    console.log('=' .repeat(120));
    console.log('\n');

    if (verifiedUsers.length > 0) {
      console.log('✅ VERIFIED ACCOUNTS:\n');
      verifiedUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.username} (${user.email})`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Account Status: ${user.account_status || 'null'}`);
        console.log(`   Requested Admin: ${user.requested_admin || false}`);
        console.log(`   Created: ${user.created_at ? new Date(user.created_at).toLocaleString() : 'unknown'}`);
        console.log('');
      });
    }

    if (unverifiedUsers.length > 0) {
      console.log('\n' + '=' .repeat(120));
      console.log('❌ UNVERIFIED ACCOUNTS:\n');
      unverifiedUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.username} (${user.email})`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Account Status: ${user.account_status || 'null'}`);
        console.log(`   Email Verified: ${user.email_verified === false ? 'false' : 'null/unknown'}`);
        console.log(`   Created: ${user.created_at ? new Date(user.created_at).toLocaleString() : 'unknown'}`);
        console.log('');
      });
    }

    // Summary by status
    console.log('\n' + '=' .repeat(120));
    console.log('📊 SUMMARY BY STATUS:\n');
    const statusCounts = users.reduce((acc, user) => {
      const status = user.account_status || 'null';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    for (const [status, count] of Object.entries(statusCounts)) {
      console.log(`   ${status}: ${count}`);
    }

    console.log('\n' + '=' .repeat(120));
    console.log(`📊 SUMMARY BY VERIFICATION:\n`);
    console.log(`   Verified: ${verifiedUsers.length}`);
    console.log(`   Unverified: ${unverifiedUsers.length}`);
    console.log(`   Total: ${users.length}`);

  } catch (error) {
    console.error('Error listing verified accounts:', error);
  } finally {
    await sql.end();
  }
}

listVerifiedAccounts();

