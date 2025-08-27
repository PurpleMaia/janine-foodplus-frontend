const postgres = require('postgres');
const crypto = require('crypto');

// Database connection
const sql = postgres(process.env.DATABASE_URL);

async function addAuthKey() {
  try {
    console.log('Adding auth key for existing user...');
    
    // Get the existing user ID
    const userResult = await sql`SELECT id FROM "user" WHERE email = 'test@example.com'`;
    
    if (userResult.length === 0) {
      console.log('❌ User not found');
      return;
    }
    
    const userId = userResult[0].id;
    const password = 'password123';
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    
    // Create auth key
    await sql`
      INSERT INTO auth_key (id, user_id, hashed_password)
      VALUES (${crypto.randomUUID()}, ${userId}, ${hashedPassword})
    `;
    
    console.log('✅ Auth key created successfully!');
    console.log(`📧 Email: test@example.com`);
    console.log(`🔑 Password: ${password}`);
    console.log(`🆔 User ID: ${userId}`);
    
  } catch (error) {
    console.error('Error adding auth key:', error);
  } finally {
    await sql.end();
  }
}

addAuthKey();
