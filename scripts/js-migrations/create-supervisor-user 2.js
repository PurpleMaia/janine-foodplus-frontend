const postgres = require('postgres');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL);

async function createSupervisorUser() {
  try {
    console.log('Creating supervisor test user...');
    
    const userId = require('crypto').randomUUID();
    const email = 'supervisor@test.com';
    const password = 'supervisor';
    const username = 'supervisor';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user with supervisor role
    await sql`
      INSERT INTO "user" (id, email, username, created_at, role, account_status, requested_admin, requested_supervisor)
      VALUES (${userId}, ${email}, ${username}, NOW(), 'supervisor', 'active', false, false)
    `;
    
    // Create auth key
    const authKeyId = require('crypto').randomUUID();
    await sql`
      INSERT INTO auth_key (id, user_id, hashed_password)
      VALUES (${authKeyId}, ${userId}, ${hashedPassword})
    `;
    
    console.log('✅ Supervisor test user created successfully!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`👤 Username: ${username}`);
    console.log(`🆔 User ID: ${userId}`);
    console.log(`👤 Role: supervisor`);
    
  } catch (error) {
    if (error.message.includes('duplicate key')) {
      console.log('⚠️  User already exists with this email or username');
    } else {
      console.error('Error creating supervisor user:', error);
    }
  } finally {
    await sql.end();
  }
}

createSupervisorUser();

