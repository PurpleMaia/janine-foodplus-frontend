const postgres = require('postgres');
const crypto = require('crypto');

// Database connection
const sql = postgres(process.env.DATABASE_URL);

async function createTestUser() {
  try {
    console.log('Creating test user...');
    
    const userId = crypto.randomUUID();
    const email = 'test@example.com';
    const password = 'password123';
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    
    // Create user
    await sql`
      INSERT INTO "user" (id, email, created_at)
      VALUES (${userId}, ${email}, NOW())
    `;
    
    // Create auth key
    await sql`
      INSERT INTO auth_key (id, user_id, hashed_password)
      VALUES (${crypto.randomUUID()}, ${userId}, ${hashedPassword})
    `;
    
    console.log('✅ Test user created successfully!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`🆔 User ID: ${userId}`);
    
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await sql.end();
  }
}

createTestUser();
