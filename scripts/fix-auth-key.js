const bcrypt = require('bcryptjs');
const postgres = require('postgres');

// Database connection
const sql = postgres(process.env.DATABASE_URL);

async function fixAuthKey() {
  try {
    const email = 'hokulanitopping@gmail.com';
    const password = 'hello';
    
    // Get the existing user
    const users = await sql`SELECT * FROM "user" WHERE email = ${email}`;
    if (users.length === 0) {
      console.log('User not found, creating new user...');
      
      // Create new user
      const userId = 'user_' + Math.random().toString(36).substr(2, 9);
      await sql`
        INSERT INTO "user" (id, email, created_at) 
        VALUES (${userId}, ${email}, NOW())
      `;
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create auth key
      await sql`
        INSERT INTO auth_key (id, user_id, hashed_password) 
        VALUES (${'key_' + Math.random().toString(36).substr(2, 9)}, ${userId}, ${hashedPassword})
      `;
      
      console.log('New user created successfully!');
      console.log('Email:', email);
      console.log('Password:', password);
      console.log('User ID:', userId);
      
    } else {
      console.log('User already exists, updating password...');
      
      const user = users[0];
      console.log('Found user:', user.id);
      
      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Update existing auth key or create new one
      const existingKeys = await sql`SELECT * FROM auth_key WHERE user_id = ${user.id}`;
      
      if (existingKeys.length > 0) {
        // Update existing key
        await sql`
          UPDATE auth_key 
          SET hashed_password = ${hashedPassword}
          WHERE user_id = ${user.id}
        `;
        console.log('Password updated successfully!');
      } else {
        // Create new auth key
        await sql`
          INSERT INTO auth_key (id, user_id, hashed_password) 
          VALUES (${'key_' + Math.random().toString(36).substr(2, 9)}, ${user.id}, ${hashedPassword})
        `;
        console.log('Auth key created successfully!');
      }
      
      console.log('Email:', email);
      console.log('Password:', password);
    }
    
  } catch (error) {
    console.error('Error fixing auth key:', error);
  } finally {
    await sql.end();
  }
}

fixAuthKey();
