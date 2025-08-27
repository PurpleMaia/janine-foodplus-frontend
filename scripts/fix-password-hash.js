const postgres = require('postgres');
const bcrypt = require('bcryptjs');

// Database connection
const sql = postgres(process.env.DATABASE_URL);

async function fixPasswordHash() {
  try {
    console.log('Fixing password hash to use bcrypt...');
    
    const password = 'password123';
    const bcryptHash = await bcrypt.hash(password, 10);
    
    // Update the auth_key with bcrypt hash
    await sql`
      UPDATE auth_key 
      SET hashed_password = ${bcryptHash}
      WHERE user_id = (SELECT id FROM "user" WHERE email = 'test@example.com')
    `;
    
    console.log('✅ Password hash updated to bcrypt!');
    console.log(`📧 Email: test@example.com`);
    console.log(`🔑 Password: ${password}`);
    
  } catch (error) {
    console.error('Error fixing password hash:', error);
  } finally {
    await sql.end();
  }
}

fixPasswordHash();
