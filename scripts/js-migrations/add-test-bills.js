const postgres = require('postgres');

// Database connection
const sql = postgres(process.env.DATABASE_URL);

async function addTestBills() {
  try {
    console.log('Adding test bills to local database...');
    
    // Add some test bills
    const testBills = [
      {
        bill_number: 'HB1294',
        bill_type: 'HB',
        title: 'Test Bill 1 - Food Safety',
        description: 'A test bill about food safety regulations',
        bill_url: 'https://www.capitol.hawaii.gov/session/measure_indiv.aspx?billtype=HB&billnumber=1294&year=2025',
        food_related: true
      },
      {
        bill_number: 'SB567',
        bill_type: 'SB',
        title: 'Test Bill 2 - Agriculture',
        description: 'A test bill about agricultural practices',
        bill_url: 'https://www.capitol.hawaii.gov/session/measure_indiv.aspx?billtype=SB&billnumber=567&year=2025',
        food_related: true
      },
      {
        bill_number: 'HB890',
        bill_type: 'HB',
        title: 'Test Bill 3 - Transportation',
        description: 'A test bill about transportation infrastructure',
        bill_url: 'https://www.capitol.hawaii.gov/session/measure_indiv.aspx?billtype=HB&billnumber=890&year=2025',
        food_related: false
      }
    ];
    
    for (const bill of testBills) {
      await sql`
        INSERT INTO bills (bill_number, bill_type, title, description, bill_url, food_related)
        VALUES (${bill.bill_number}, ${bill.bill_type}, ${bill.title}, ${bill.description}, ${bill.bill_url}, ${bill.food_related})
      `;
      console.log(`✅ Added test bill: ${bill.bill_number}`);
    }
    
    console.log('\n🎉 Test bills added successfully!');
    console.log('You can now test the "Adopt Bill" feature with these URLs:');
    testBills.forEach(bill => {
      console.log(`- ${bill.bill_url}`);
    });
    
  } catch (error) {
    console.error('Error adding test bills:', error);
  } finally {
    await sql.end();
  }
}

addTestBills();
