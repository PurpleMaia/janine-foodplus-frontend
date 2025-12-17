import { db } from '../src/db/kysely/client';
import { createObjectCsvWriter } from 'csv-writer';

async function exportBillsToCsv() {

  try {
    const bills = await db
      .selectFrom('bills')
      .select([
        'bill_number',
        'bill_title',
        'introducer',
        'committee_assignment',
        'current_status_string',
        'description',
        'bill_url',
        'food_related',
        'archived',
      ])
      .execute();

    const csvWriter = createObjectCsvWriter({
      path: 'bills_export.csv',
      header: [
        { id: 'food_related', title: 'Food Related' },
        { id: 'bill_number', title: 'Bill Number' },
        { id: 'bill_title', title: 'Bill Title' },
        { id: 'introducer', title: 'Introducers' },
        { id: 'committee_assignment', title: 'Committee Assignment' },
        { id: 'current_status_string', title: 'Current Status' },
        { id: 'description', title: 'Description' },
        { id: 'bill_url', title: 'Bill URL' },
        { id: 'archived', title: 'Archived' },
    ],
    });

    await csvWriter.writeRecords(
      bills.map((bill) => ({
        food_related: bill.food_related ?? false, 
        bill_number: bill.bill_number ?? '',
        bill_title: bill.bill_title ?? '',
        introducer: bill.introducer ?? '',
        committee_assignment: bill.committee_assignment ?? '',
        current_status_string: bill.current_status_string,
        description: bill.description,
        bill_url: bill.bill_url,
        archived: bill.archived,
      }))
    );

    console.log(`Exported ${bills.length} bills to bills_export.csv`);
  } finally {
    await db.destroy();
  }
}

exportBillsToCsv().catch(console.error);