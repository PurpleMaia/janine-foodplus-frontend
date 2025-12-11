const postgres = require('postgres');

// Database connection
const sql = postgres(process.env.DATABASE_URL);

async function updateUserRole() {
  try {
    const email = process.argv[2];
    const newRole = process.argv[3];
    
    if (!email || !newRole) {
      console.log('Usage: node scripts/update-user-role.js <email> <role>');
      console.log('Roles: intern, supervisor, admin');
      console.log('Example: node scripts/update-user-role.js user@example.com intern');
      return;
    }
    
    if (!['intern', 'supervisor', 'admin'].includes(newRole)) {
      console.log('❌ Invalid role. Must be: intern, supervisor, or admin');
      return;
    }
    
    console.log(`Updating user ${email} to role: ${newRole}`);
    
    // Update the user's role
    const result = await sql`
      UPDATE "user" 
      SET role = ${newRole}
      WHERE email = ${email}
    `;
    
    if (result.count === 0) {
      console.log('❌ User not found with email:', email);
    } else {
      console.log('✅ User role updated successfully!');
      console.log(`📧 Email: ${email}`);
      console.log(`👤 New Role: ${newRole}`);
    }
    
  } catch (error) {
    console.error('Error updating user role:', error);
  } finally {
    await sql.end();
  }
}

updateUserRole();
