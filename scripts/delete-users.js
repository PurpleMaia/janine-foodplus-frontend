const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL);

async function deleteUsers() {
  try {
    // Get command line arguments
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
      console.log('Usage: node scripts/delete-users.js [options]');
      console.log('\nOptions:');
      console.log('  --email <email>           Delete user by email');
      console.log('  --username <username>     Delete user by username');
      console.log('  --id <user_id>            Delete user by ID');
      console.log('  --unverified              Delete all unverified users (email_verified = false)');
      console.log('  --pending                 Delete all pending users (account_status = pending)');
      console.log('  --list                    List all users before deletion (dry run)');
      console.log('\nExamples:');
      console.log('  node scripts/delete-users.js --email test@example.com');
      console.log('  node scripts/delete-users.js --unverified --list');
      console.log('  node scripts/delete-users.js --pending');
      return;
    }

    let emailFilter = null;
    let usernameFilter = null;
    let idFilter = null;
    let unverifiedFilter = false;
    let pendingFilter = false;
    let deleteMode = 'specific';

    // Parse arguments
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--email' && args[i + 1]) {
        emailFilter = args[i + 1];
        i++;
      } else if (args[i] === '--username' && args[i + 1]) {
        usernameFilter = args[i + 1];
        i++;
      } else if (args[i] === '--id' && args[i + 1]) {
        idFilter = args[i + 1];
        i++;
      } else if (args[i] === '--unverified') {
        unverifiedFilter = true;
        deleteMode = 'batch';
      } else if (args[i] === '--pending') {
        pendingFilter = true;
        deleteMode = 'batch';
      }
    }

    if (!emailFilter && !usernameFilter && !idFilter && !unverifiedFilter && !pendingFilter) {
      console.log('❌ No valid deletion criteria provided. Use --help for usage.');
      return;
    }

    // List users that will be deleted
    console.log('🔍 Finding users to delete...\n');
    
    let usersToDelete;
    
    // Build query based on filters
    if (idFilter) {
      usersToDelete = await sql`
        SELECT id, email, username, role, account_status, email_verified, created_at
        FROM "user"
        WHERE id = ${idFilter}
        ORDER BY created_at DESC
      `;
    } else if (emailFilter) {
      console.log(`🔍 Searching for email: "${emailFilter}"`);
      // Search in both email and username columns (some users might have swapped values)
      usersToDelete = await sql`
        SELECT id, email, username, role, account_status, email_verified, created_at
        FROM "user"
        WHERE email = ${emailFilter} OR username = ${emailFilter}
        ORDER BY created_at DESC
      `;
      console.log(`📊 Found ${usersToDelete.length} user(s) with that email`);
    } else if (usernameFilter) {
      console.log(`🔍 Searching for username: "${usernameFilter}"`);
      usersToDelete = await sql`
        SELECT id, email, username, role, account_status, email_verified, created_at
        FROM "user"
        WHERE username = ${usernameFilter}
        ORDER BY created_at DESC
      `;
      console.log(`📊 Found ${usersToDelete.length} user(s) with that username`);
    } else {
      // Build dynamic query for batch operations
      let whereConditions = [];
      if (unverifiedFilter) whereConditions.push('email_verified = false');
      if (pendingFilter) whereConditions.push(`account_status = 'pending'`);
      
      if (whereConditions.length > 0) {
        const whereClause = whereConditions.join(' AND ');
        usersToDelete = await sql.unsafe(`
          SELECT id, email, username, role, account_status, email_verified, created_at
          FROM "user"
          WHERE ${whereClause}
          ORDER BY created_at DESC
        `);
      } else {
        usersToDelete = [];
      }
    }

    if (usersToDelete.length === 0) {
      console.log('✅ No users found matching the criteria.');
      return;
    }

    console.log(`📋 Found ${usersToDelete.length} user(s) to delete:\n`);
    usersToDelete.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.email})`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.account_status || 'null'}`);
      console.log(`   Email Verified: ${user.email_verified}`);
      console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
      console.log('');
    });

    // Check if --list flag was used (dry run)
    if (args.includes('--list')) {
      console.log('🔍 Dry run mode - no users were deleted.');
      return;
    }

    // Confirm deletion
    if (deleteMode === 'batch' && usersToDelete.length > 1) {
      console.log(`⚠️  WARNING: This will delete ${usersToDelete.length} user(s)!`);
      console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Delete related data first (foreign key constraints)
    console.log('🗑️  Deleting related data...');
    
    // Delete from auth_key table
    for (const user of usersToDelete) {
      await sql`DELETE FROM auth_key WHERE user_id = ${user.id}`;
    }
    console.log('   ✅ Deleted auth_key records');

    // Delete from sessions table
    for (const user of usersToDelete) {
      await sql`DELETE FROM sessions WHERE user_id = ${user.id}`;
    }
    console.log('   ✅ Deleted session records');

    // Delete from supervisor_users table (if exists)
    for (const user of usersToDelete) {
      await sql`DELETE FROM supervisor_users WHERE supervisor_id = ${user.id} OR user_id = ${user.id}`;
    }
    console.log('   ✅ Deleted supervisor_users records');

    // Delete from pending_proposals table (if exists)
    for (const user of usersToDelete) {
      await sql`DELETE FROM pending_proposals WHERE user_id = ${user.id} OR proposed_by_user_id = ${user.id}`;
    }
    console.log('   ✅ Deleted pending_proposals records');

    // Finally delete from user table
    console.log('\n🗑️  Deleting users...');
    
    // Build delete query with same conditions
    if (idFilter) {
      await sql`DELETE FROM "user" WHERE id = ${idFilter}`;
    } else if (emailFilter) {
      // Search in both columns (same as SELECT query above)
      await sql`DELETE FROM "user" WHERE email = ${emailFilter} OR username = ${emailFilter}`;
    } else if (usernameFilter) {
      await sql`DELETE FROM "user" WHERE username = ${usernameFilter}`;
    } else {
      // Batch delete with dynamic conditions
      let whereConditions = [];
      if (unverifiedFilter) whereConditions.push('email_verified = false');
      if (pendingFilter) whereConditions.push(`account_status = 'pending'`);
      
      if (whereConditions.length > 0) {
        const whereClause = whereConditions.join(' AND ');
        await sql.unsafe(`DELETE FROM "user" WHERE ${whereClause}`);
      }
    }

    console.log(`\n✅ Successfully deleted ${usersToDelete.length} user(s)!`);

  } catch (error) {
    console.error('❌ Error deleting users:', error);
  } finally {
    await sql.end();
  }
}

deleteUsers();
