const postgres = require('postgres');

// Database connection
const sql = postgres(process.env.DATABASE_URL);

async function checkUsers() {
  try {
    console.log('Checking existing users...');
    
    // Check users table
    const users = await sql`SELECT * FROM "user"`;
    console.log('\nUsers:', users);
    
    // Check auth keys
    const authKeys = await sql`SELECT * FROM auth_key`;
    console.log('\nAuth Keys:', authKeys);
    
    // Check sessions
    const sessions = await sql`SELECT * FROM session`;
    console.log('\nSessions:', sessions);
    
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await sql.end();
  }
}

checkUsers();
