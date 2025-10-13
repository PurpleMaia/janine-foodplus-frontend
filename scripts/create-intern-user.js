const postgres = require('postgres');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Database connection
const sql = postgres(process.env.DATABASE_URL);

async function createInternUser() {
  try {
    console.log('Creating intern test user...');
    
    const userId = crypto.randomUUID();
    const email = 'intern.test@example.com';
    const password = 'intern123';
    const username = 'intern_user_' + Math.random().toString(36).substr(2, 5);
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user with intern role
    await sql`
      INSERT INTO "user" (id, email, username, created_at, role, account_status)
      VALUES (${userId}, ${email}, ${username}, NOW(), 'intern', 'active')
    `;
    
    // Create auth key
    await sql`
      INSERT INTO auth_key (id, user_id, hashed_password)
      VALUES (${crypto.randomUUID()}, ${userId}, ${hashedPassword})
    `;
    
    console.log('✅ Intern test user created successfully!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`🆔 User ID: ${userId}`);
    console.log(`👤 Role: intern`);
    
  } catch (error) {
    console.error('Error creating intern user:', error);
  } finally {
    await sql.end();
  }
}

createInternUser();
