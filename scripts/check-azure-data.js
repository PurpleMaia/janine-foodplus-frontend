const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

// Manually load .env file
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key] = valueParts.join('=');
  }
});

// Database connection - this will use the .env file (Azure)
const sql = postgres(envVars.DATABASE_URL);

async function checkAzureData() {
  try {
    console.log('Checking Azure database data...');
    
    // Check user_bills records
    const userBillsCount = await sql`SELECT COUNT(*) as count FROM user_bills`;
    console.log('📊 user_bills records:', userBillsCount[0].count);
    
    if (userBillsCount[0].count > 0) {
      const userBills = await sql`SELECT * FROM user_bills LIMIT 5`;
      console.log('📋 Sample user_bills records:', userBills);
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
    
    // Check auth_key table
    const authKeyCount = await sql`SELECT COUNT(*) as count FROM auth_key`;
    console.log('🔑 Auth keys count:', authKeyCount[0].count);
    
    if (authKeyCount[0].count > 0) {
      const authKeys = await sql`SELECT user_id, LEFT(hashed_password, 20) as hash_start FROM auth_key LIMIT 5`;
      console.log('📋 Sample auth keys:', authKeys);
    }
    
  } catch (error) {
    console.error('Error checking Azure data:', error);
  } finally {
    await sql.end();
  }
}

checkAzureData();
