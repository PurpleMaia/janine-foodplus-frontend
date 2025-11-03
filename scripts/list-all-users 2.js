const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL);

async function listAllUsers() {
  try {
    const users = await sql`
      SELECT 
        id, 
        email, 
        username, 
        role, 
        account_status, 
        requested_admin, 
        requested_supervisor, 
        created_at
      FROM "user"
      ORDER BY 
        CASE role
          WHEN 'admin' THEN 1
          WHEN 'supervisor' THEN 2
          WHEN 'user' THEN 3
          ELSE 4
        END,
        created_at DESC
    `;

    console.log('\n📋 All Users in Database:\n');
    console.log('=' .repeat(100));
    
    const roleCounts = { admin: 0, supervisor: 0, user: 0, other: 0 };
    
    users.forEach((user, index) => {
      const role = user.role || 'unknown';
      roleCounts[role] = (roleCounts[role] || 0) + 1;
      
      console.log(`${index + 1}. ${user.email} (${user.username || 'no username'})`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Role: ${role}`);
      console.log(`   Account Status: ${user.account_status || 'unknown'}`);
      console.log(`   Requested Admin: ${user.requested_admin || false}`);
      console.log(`   Requested Supervisor: ${user.requested_supervisor || false}`);
      console.log(`   Created: ${user.created_at ? new Date(user.created_at).toLocaleString() : 'unknown'}`);
      console.log('-'.repeat(100));
    });

    console.log('\n📊 Summary by Role:');
    console.log(`   Admins: ${roleCounts.admin || 0}`);
    console.log(`   Supervisors: ${roleCounts.supervisor || 0}`);
    console.log(`   Users: ${roleCounts.user || 0}`);
    console.log(`   Other: ${Object.keys(roleCounts).filter(r => !['admin', 'supervisor', 'user'].includes(r)).reduce((sum, r) => sum + (roleCounts[r] || 0), 0)}`);
    console.log(`   Total: ${users.length}\n`);

  } catch (error) {
    console.error('Error listing users:', error);
  } finally {
    await sql.end();
  }
}

listAllUsers();

