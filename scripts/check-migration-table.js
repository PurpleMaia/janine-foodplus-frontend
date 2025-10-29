const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL);

async function checkMigrationTable() {
  try {
    // Check if schema_migrations table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'schema_migrations'
      );
    `;

    console.log('\n📋 Migration Table Check:\n');
    console.log('Does schema_migrations table exist?', tableExists[0].exists);
    
    if (tableExists[0].exists) {
      // Get table structure
      const columns = await sql`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = 'schema_migrations'
        ORDER BY ordinal_position;
      `;

      console.log('\n📊 Table Structure:');
      columns.forEach(col => {
        console.log(`   ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}${col.column_default ? ` DEFAULT ${col.column_default}` : ''}`);
      });

      // Get current migration version
      const version = await sql`
        SELECT version, dirty FROM schema_migrations;
      `;

      console.log('\n📈 Current Migration State:');
      if (version.length > 0) {
        console.log(`   Version: ${version[0].version}`);
        console.log(`   Dirty (needs fix): ${version[0].dirty}`);
      } else {
        console.log('   No migration version recorded');
      }
    } else {
      console.log('\n⚠️  schema_migrations table does not exist in the database.');
      console.log('   This table is created automatically by golang-migrate when you run migrations.');
    }

  } catch (error) {
    console.error('Error checking migration table:', error);
  } finally {
    await sql.end();
  }
}

checkMigrationTable();

