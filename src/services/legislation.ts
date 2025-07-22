'use server';

import type { Bill, BillStatus, BillDraft, Introducer, NewsArticle } from '@/types/legislation';
import { KANBAN_COLUMNS } from '@/lib/kanban-columns';
import { NextRequest, NextResponse } from 'next/server';

let sql: any = null;
if (typeof window === 'undefined') {
  // Server-side only
  const postgres = require('postgres');
  sql = postgres(process.env.DATABASE_URL!);
}

// Helper function to create placeholder introducers
const createIntroducers = (names: string[]): Introducer[] =>
    names.map((name, index) => ({
        name,
        // Placeholder image URL using picsum.photos - requires next.config.js update if not already present
        imageUrl: `https://picsum.photos/seed/${name.replace(/\s+/g, '')}/40/40`,
    }));

// Helper function to create placeholder bill drafts
const createBillDrafts = (billId: string, versions: string[]): BillDraft[] =>
    versions.map((version, index) => ({
        version,
        htmlUrl: `/bills/${billId}/drafts/${version}.html`, // Placeholder links
        pdfUrl: `/bills/${billId}/drafts/${version}.pdf`, // Placeholder links
        date: new Date(2024, 5, 25 - index * 5), // Stagger dates
    }));

// Helper function to create placeholder news articles
const createNewsArticles = (count: number): NewsArticle[] =>
    Array.from({ length: count }, (_, index) => ({
        title: `Article Title ${index + 1} about the Bill`,
        url: `https://news.example.com/article${index + 1}`, // Placeholder links
        source: index % 2 === 0 ? 'Honolulu Star-Advertiser' : 'Civil Beat',
        date: new Date(2024, 5, 28 - index * 3),
    }));


// Mock data with diverse statuses and lastUpdated timestamps, updated to match new Bill type
// const mockBills: Bill[] = [
//   {
//       id: '1',
//       bill_url: '/bills/HB101',
//       description: 'Promotes renewable energy sources and sets new standards for emissions.',
//       current_status: '',
//       created_at: new Date(2024, 5, 1),
//       updated_at: new Date(2024, 5, 1),
//       committee_assignment: 'Energy',
//       bill_title: 'Clean Energy Act',
//       introducers: 'Rep. Aloha, Rep. Mahalo',
//       bill_number: 'HB101',
//   },
//   {
//       id: '2',
//       bill_url: '/bills/SB205',
//       description: 'Improves funding mechanisms and accountability for public schools.',
//       current_status: '',
//       created_at: new Date(2024, 5, 10),
//       updated_at: new Date(2024, 5, 10),
//       committee_assignment: 'Education',
//       bill_title: 'Education Reform Bill',
//       introducers: 'Sen. Kokua, Sen. Pono',
//       bill_number: 'SB205',
//   },
//   {
//       id: '3',
//       bill_url: '/bills/HB330',
//       description: 'Expands healthcare coverage options for underserved populations.',
//       current_status: '',
//       created_at: new Date(2024, 5, 5),
//       updated_at: new Date(2024, 5, 5),
//       committee_assignment: 'Health',
//       bill_title: 'Healthcare Access Initiative',
//       introducers: 'Rep. Laulima',
//       bill_number: 'HB330',
//   },
//   {
//       id: '4',
//       bill_url: '/bills/SB410',
//       description: 'Funds critical infrastructure projects across the state, including roads and bridges.',
//       current_status: '',
//       created_at: new Date(2024, 5, 12),
//       updated_at: new Date(2024, 5, 12),
//       committee_assignment: 'Transportation',
//       bill_title: 'Infrastructure Investment Plan',
//       introducers: 'Sen. Alakai',
//       bill_number: 'SB410',
//   },
//   {
//       id: '5',
//       bill_url: '/bills/HB500',
//       description: 'Strengthens consumer data protection rights and regulations for businesses.',
//       current_status: '',
//       created_at: new Date(2024, 5, 20),
//       updated_at: new Date(2024, 5, 20),
//       committee_assignment: 'Consumer Protection',
//       bill_title: 'Data Privacy Law',
//       introducers: 'Rep. Malama, Rep. Kuleana',
//       bill_number: 'HB500',
//   },
//   {
//       id: '6',
//       bill_url: '/bills/SB621',
//       description: 'Provides incentives and zoning changes to encourage affordable housing.',
//       current_status: '',
//       created_at: new Date(2024, 5, 28),
//       updated_at: new Date(2024, 5, 28),
//       committee_assignment: 'Housing',
//       bill_title: 'Affordable Housing Act',
//       introducers: 'Sen. Ohana',
//       bill_number: 'SB621',
//   },
// ];


/**
 * Asynchronously retrieves bill information by ID.
 *
 * @param id The ID of the bill to retrieve.
 * @returns A promise that resolves to a Bill object or null if not found.
 */
// export async function getBill(id: string): Promise<Bill | null> {
//   // Simulate API call delay
//   await new Promise(resolve => setTimeout(resolve, 100));
//   const bill = mockBills.find(b => b.id === id);
//   // Ensure dates are Date objects (if they were strings)
//    if (bill) {
//      bill.created_at = new Date(bill.created_at);
//      bill.updated_at = new Date(bill.updated_at);
//    }
//   return bill ? { ...bill } : null; // Return a copy
// }

/**
 * Asynchronously retrieves all bills.
 *
 * @returns A promise that resolves to an array of all Bill objects.
 */


export async function getAllBills(): Promise<Bill[]> {    

    // Server-side database query
    let data: Bill[] = [];
    try {
        if (sql) {
            data = await sql<Bill[]>`
                SELECT * FROM bills
            `;
        } else {
            console.log('SQL connection not available');            
        }
    } catch (e) {
        console.log('Data fetch did not work: ', e);                
    }   

    // FOR TESTING ADDING THIS INDIVIDUAL SCRAPED BILL
    // 11b31720-81d9-47c9-8451-55d215569805
    const test_bill = {
      id: '11b31720-81d9-47c9-8451-55d215569805',
      bill_url:	'https://www.capitol.hawaii.gov/session/measure_indiv.aspx?billtype=SB&billnumber=1186&year=2025',
      description: 'Establishes the Statewide Interagency Food Systems Coordination Team and the Interagency Food Systems Working Group within the Agribusiness Development Corporation. Requires reports to the Legislature.  Appropriates funds.  (CD1)',
      current_status_string: 'S 5/2/2025: Enrolled to Governor.',	
      created_at: new Date('2025-06-12 12:19:23.970 -1000'),
      updated_at: new Date('2025-06-12 12:19:23.970 -1000'),
      committee_assignment:	'AGR_ ECD_ FIN',
      bill_title:	'RELATING TO SUSTAINABLE FOOD SYSTEMS.',
      introducers: 'GABBARD_ AQUINO_ MCKELVEY_ San Buenaventura',
      bill_number:	'SB1186 SD2 HD3 CD1',
      current_status: ''
    }
    
    // Sort by updated_at date descending (most recent first) before returning
    let sortedBills = [...data].sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime());
    // console.log('SORTED', sortedBills.slice(0,5))
    sortedBills = sortedBills.slice(0,5)
    sortedBills.push(test_bill)
    return sortedBills; // Returning only 5
}


/**
 * Asynchronously searches for bills based on a query (ID, bill_title, or description).
 *
 * @param query The search query.
 * @returns A promise that resolves to an array of matching Bill objects.
 */
export async function searchBills(query: string): Promise<Bill[]> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 200));

   // Get all bills, already sorted by updated_at
   const allBills = await getAllBills();

  if (!query) {
    return allBills; // Return all sorted bills if query is empty
  }

  const lowerCaseQuery = query.toLowerCase();
  return allBills.filter(bill =>
    bill.id.toLowerCase().includes(lowerCaseQuery) ||
    bill.bill_number.toLowerCase().includes(lowerCaseQuery) ||
    bill.bill_title.toLowerCase().includes(lowerCaseQuery) ||
    bill.description.toLowerCase().includes(lowerCaseQuery)
  );
}


/**
 * Asynchronously updates the status of a bill.
 * Also updates the updated_at timestamp.
 *
 * @param billId The ID of the bill to update.
 * @param newStatus The new status (Kanban column ID) for the bill.
 * @returns A promise that resolves to the updated Bill object or null if not found.
 */
export async function updateBillStatusServerAction(billId: string, newStatus: BillStatus): Promise<Bill | null> {
    console.log('updateBillStatusServerAction called with:', { billId, newStatus });
    
    // Validate if newStatus is a valid column ID
    if (!KANBAN_COLUMNS.some(col => col.id === newStatus)) {
        console.error(`Invalid status update: ${newStatus}`);
        return null; // Invalid status
    }

    try {
        // Update the database using the same approach as getAllBills
        if (sql) {
            const result = await sql<Bill[]>`
                UPDATE bills 
                SET current_status = ${newStatus}, updated_at = NOW()
                WHERE id = ${billId}
                RETURNING *
            `;
            
            if (result && result.length > 0) {
                const updatedBill = result[0];
                // Ensure dates are Date objects
                updatedBill.created_at = new Date(updatedBill.created_at);
                updatedBill.updated_at = new Date(updatedBill.updated_at);
                
                console.log(`Successfully updated bill ${billId} to status ${newStatus} in database`);
                return updatedBill;
            } else {
                console.error(`Bill with ID ${billId} not found in database.`);
                return null;
            }
        } else {
            console.error('SQL connection not available');
            return null;
        }
    } catch (error) {
        console.error('Database update failed:', error);
        return null;
    }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await request.json();
    const billId = params.id;

    console.log('Updating bill:', { billId, status });

    const result = await sql`
      UPDATE bills 
      SET current_status = ${status}, updated_at = NOW()
      WHERE id = ${billId}
      RETURNING *
    `;

    if (result && result.length > 0) {
      const updatedBill = result[0];
      // Ensure dates are Date objects
      updatedBill.created_at = new Date(updatedBill.created_at);
      updatedBill.updated_at = new Date(updatedBill.updated_at);
      
      console.log('Successfully updated bill:', updatedBill);
      return NextResponse.json(updatedBill);
    } else {
      console.error('Bill not found:', billId);
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Database update failed:', error);
    return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
  }
}