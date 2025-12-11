const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL);

async function setupTagsTables() {
  try {
    console.log('Setting up tags tables...');
    
    // Create tags table
    await sql`
      CREATE TABLE IF NOT EXISTS tags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        color TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    console.log('✅ Tags table created');
    
    // Create bill_tags junction table
    await sql`
      CREATE TABLE IF NOT EXISTS bill_tags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
        tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(bill_id, tag_id)
      );
    `;
    console.log('✅ Bill tags table created');
    
    // Create indexes for performance
    await sql`CREATE INDEX IF NOT EXISTS idx_bill_tags_bill_id ON bill_tags(bill_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_bill_tags_tag_id ON bill_tags(tag_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);`;
    console.log('✅ Indexes created');
    
    console.log('\n🎉 Tags tables setup complete!');
    
  } catch (error) {
    console.error('Error setting up tags tables:', error);
  } finally {
    await sql.end();
  }
}

setupTagsTables();

