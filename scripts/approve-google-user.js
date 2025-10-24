const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL);

async function approveGoogleUser() {
  try {
    console.log('Approving Google user account...');
    
    // Update the Google user account to active
    const result = await sql`
      UPDATE "user" 
      SET account_status = 'active'
      WHERE email = 'hokulani@purplemaia.org'
      RETURNING id, email, username, account_status
    `;
    
    if (result.length > 0) {
      console.log('✅ User account approved successfully!');
      console.log(`📧 Email: ${result[0].email}`);
      console.log(`👤 Username: ${result[0].username}`);
      console.log(`🆔 User ID: ${result[0].id}`);
      console.log(`✅ Status: ${result[0].account_status}`);
    } else {
      console.log('❌ No user found with email hokulani@purplemaia.org');
    }
    
  } catch (error) {
    console.error('Error approving user:', error);
  } finally {
    await sql.end();
  }
}

approveGoogleUser();
