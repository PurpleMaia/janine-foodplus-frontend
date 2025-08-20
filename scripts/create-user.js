const bcrypt = require('bcryptjs');
const postgres = require('postgres');

// Database connection
const sql = postgres(process.env.DATABASE_URL);

async function createUser() {
  try {
    const email = 'admin@example.com';
    const password = 'admin123';
    const userId = 'user_' + Math.random().toString(36).substr(2, 9);
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    await sql`
      INSERT INTO "user" (id, email, created_at) 
      VALUES (${userId}, ${email}, NOW())
    `;
    
    // Create auth key
    await sql`
      INSERT INTO auth_key (id, user_id, hashed_password) 
      VALUES (${'key_' + Math.random().toString(36).substr(2, 9)}, ${userId}, ${hashedPassword})
    `;
    
    console.log('User created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('User ID:', userId);
    
  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await sql.end();
  }
}

createUser();
