const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL);

async function listUsers() {
  try {
    const users = await sql`
      SELECT id, email, username, role, account_status, requested_admin, created_at
      FROM "user"
      ORDER BY created_at DESC
    `;

    console.log('\n📋 All Users:\n');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.username})`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.account_status}`);
      console.log(`   Admin Requested: ${user.requested_admin}`);
      console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
      console.log(`   ID: ${user.id}\n`);
    });

    const activeUsers = users.filter(u => u.account_status === 'active').length;
    const pendingUsers = users.filter(u => u.account_status === 'pending').length;
    const adminUsers = users.filter(u => u.role === 'admin').length;

    console.log('📊 Summary:');
    console.log(`   Total: ${users.length}`);
    console.log(`   Active: ${activeUsers}`);
    console.log(`   Pending: ${pendingUsers}`);
    console.log(`   Admins: ${adminUsers}`);

  } catch (error) {
    console.error('Error listing users:', error);
  } finally {
    await sql.end();
  }
}

listUsers();

