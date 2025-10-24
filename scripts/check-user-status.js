const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL);

async function checkUserStatus() {
  try {
    console.log('Checking user status...');
    
    const result = await sql`
      SELECT id, email, username, account_status, google_id, auth_provider
      FROM "user" 
      WHERE email = 'hokulani@purplemaia.org'
    `;
    
    if (result.length > 0) {
      console.log('✅ User found:');
      console.log(`📧 Email: ${result[0].email}`);
      console.log(`👤 Username: ${result[0].username}`);
      console.log(`🆔 User ID: ${result[0].id}`);
      console.log(`✅ Status: ${result[0].account_status}`);
      console.log(`🔑 Google ID: ${result[0].google_id}`);
      console.log(`🔐 Auth Provider: ${result[0].auth_provider}`);
    } else {
      console.log('❌ No user found with email hokulani@purplemaia.org');
    }
    
  } catch (error) {
    console.error('Error checking user:', error);
  } finally {
    await sql.end();
  }
}

checkUserStatus();
