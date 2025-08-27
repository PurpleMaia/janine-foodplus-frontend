const postgres = require('postgres');

// Database connection - this will use the .env file (Azure)
const sql = postgres(process.env.DATABASE_URL);

async function checkAzureTables() {
  try {
    console.log('Checking Azure database tables and data...');
    
    // Check if user_bills table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'user_bills'
      );
    `;
    
    console.log('✅ user_bills table exists:', tableCheck[0].exists);
    
    if (tableCheck[0].exists) {
      // Check user_bills records
      const userBillsCount = await sql`SELECT COUNT(*) as count FROM user_bills`;
      console.log('📊 user_bills records:', userBillsCount[0].count);
      
      if (userBillsCount[0].count > 0) {
        const userBills = await sql`SELECT * FROM user_bills LIMIT 5`;
        console.log('📋 Sample user_bills records:', userBills);
      }
    }
    
    // Check users table
    const usersCount = await sql`SELECT COUNT(*) as count FROM "user"`;
    console.log('👥 Users count:', usersCount[0].count);
    
    if (usersCount[0].count > 0) {
      const users = await sql`SELECT id, email FROM "user" LIMIT 5`;
      console.log('📋 Sample users:', users);
    }
    
    // Check bills table
    const billsCount = await sql`SELECT COUNT(*) as count FROM bills`;
    console.log('📜 Bills count:', billsCount[0].count);
    
  } catch (error) {
    console.error('Error checking Azure tables:', error);
  } finally {
    await sql.end();
  }
}

checkAzureTables();
