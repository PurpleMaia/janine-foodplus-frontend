const { Pool } = require('pg');

async function fixMisclassifiedBills() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    // Find bills that are incorrectly classified as "scheduled_for_1st_reading"
    // but have text indicating they've moved beyond that stage
    const misclassifiedQuery = `
      SELECT 
        b.id,
        b.title,
        b.current_status_str,
        su.update_text,
        su.created_at as last_update
      FROM bills b
      LEFT JOIN status_updates su ON b.id = su.bill_id
      WHERE b.current_status_str = 'scheduled_for_1st_reading'
        AND (
          su.update_text ILIKE '%passed%first%reading%'
          OR su.update_text ILIKE '%second%reading%'
          OR su.update_text ILIKE '%third%reading%'
          OR su.update_text ILIKE '%committee%passed%'
          OR su.update_text ILIKE '%amended%'
        )
      ORDER BY b.id, su.created_at DESC;
    `;
    
    const result = await pool.query(misclassifiedQuery);
    
    console.log(`Found ${result.rows.length} potentially misclassified bills`);
    
    for (const bill of result.rows) {
      console.log(`\nBill: ${bill.title}`);
      console.log(`Current status: ${bill.current_status_str}`);
      console.log(`Last update: ${bill.update_text}`);
      
      // Determine correct status based on update text
      let correctStatus = 'introduced';
      const updateText = bill.update_text?.toLowerCase() || '';
      
      if (updateText.includes('passed') && updateText.includes('first') && updateText.includes('reading')) {
        correctStatus = 'passed_1st_reading';
      } else if (updateText.includes('second') && updateText.includes('reading')) {
        correctStatus = updateText.includes('scheduled') ? 'scheduled_for_2nd_reading' : 'passed_2nd_reading';
      } else if (updateText.includes('third') && updateText.includes('reading')) {
        correctStatus = updateText.includes('scheduled') ? 'scheduled_for_3rd_reading' : 'passed_3rd_reading';
      }
      
      if (correctStatus !== 'introduced') {
        console.log(`  -> Should be: ${correctStatus}`);
        
        // Update the bill status
        await pool.query(
          'UPDATE bills SET current_status_str = $1, updated_at = NOW() WHERE id = $2',
          [correctStatus, bill.id]
        );
        
        // Log the correction
        await pool.query(`
          INSERT INTO ai_misclassifications (
            bill_id, 
            original_text, 
            ai_classification, 
            correct_classification, 
            confidence_score, 
            created_at, 
            reasoning
          ) VALUES ($1, $2, $3, $4, $5, NOW(), $6)
        `, [
          bill.id,
          bill.update_text,
          'scheduled_for_1st_reading',
          correctStatus,
          0.9,
          'Manual correction of misclassified bill'
        ]);
        
        console.log(`  ✓ Updated to ${correctStatus}`);
      }
    }
    
    console.log('\nMisclassification fix completed');
    
  } catch (error) {
    console.error('Error fixing misclassified bills:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  fixMisclassifiedBills();
}

module.exports = { fixMisclassifiedBills };