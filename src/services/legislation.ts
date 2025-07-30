'use server';

import type { Bill, BillStatus, BillDraft, Introducer, NewsArticle, StatusUpdate } from '@/types/legislation';
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

const FOOD_KEYWORDS = [
  'agriculture', 'food', 'farm', 'pesticides', 'eating', 'edible', 'meal',
  'crop', 'harvest', 'organic', 'nutrition', 'diet', 'restaurant', 'cafe',
  'kitchen', 'cooking', 'beverage', 'drink', 'produce', 'vegetable', 'fruit',
  'meat', 'dairy', 'grain', 'seed', 'fertilizer', 'irrigation', 'livestock',
  'poultry', 'fishery', 'aquaculture', 'grocery', 'market', 'vendor'
];

export async function getAllBills(): Promise<Bill[]> {    

    // Server-side database query
    let data: Bill[] = [];
    try {
        if (sql) {
            data = await sql<Bill[]>`
                SELECT * FROM bills
                WHERE food_related = true
            `;
        } else {
            console.log('SQL connection not available');            
        }
    } catch (e) {
        console.log('Data fetch did not work: ', e);                
    }   

    // filtering the bill results only by food-related keywords    
    
    // ----- Holding this code here if need to set the flags based on the filter ----------
    // const filteredData = [...data].filter((bill) => containsFoodKeywords(bill))
    // const billIds = filteredData.map(bill => bill.id)
    // if (billIds.length > 0) {
      //   if (billIds.length > 0) {
        //     const result = await sql`
        //       UPDATE bills 
        //       SET food_related = true 
        //       WHERE id = ANY(${billIds})
        //     `;
        //     console.log(`Updated ${result.count} rows`);
        //   }
        // }
      // ----- Holding this code here if need to set the flags based on the filter again ----------

    // update each bill object with its status updates
    const dataWithStatusUpdates = await Promise.all(
        data.map(async(bill) => {
        try {
          if (sql) {
            const result = await sql<StatusUpdate[]>`
                SELECT id, chamber, date, statustext FROM status_updates su
                WHERE su.bill_id = ${bill.id}
            `
            return {
              ...bill,
              updates: result
            }
          } else {
            console.log('SQL Connection not available, setting updates to []')
            return {
              ...bill,
              updates: []
            }
          }
        } catch (e) {
          console.log('Status update fetch did not work for: ', bill.id, e)
          return {
            ...bill,
            updates: []
          }
        }
      })
    )
    
    // Sort by updated_at date descending (most recent first) before returning
    let sortedBills = [...dataWithStatusUpdates].sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime());
    // sortedBills = sortedBills.slice(0,9)
    // console.log('sortedBills', sortedBills)
    return sortedBills; // Returning only 5
}

const containsFoodKeywords = (bill: Bill) => {
  const searchText = `${bill.bill_title || ''} ${bill.description || ''}`.toLowerCase();
  return FOOD_KEYWORDS.some(keyword => searchText.includes(keyword.toLowerCase()));
}


/**
 * Asynchronously searches for bills based on a query (ID, bill_title, or description).
 *
 * @param query The search query.
 * @returns A promise that resolves to an array of matching Bill objects.
 */
export async function searchBills(query: string): Promise<Bill[]> {

  const allBills = await getAllBills()

  if (!query) {
    return allBills; // Return all sorted bills if query is empty
  }
  const lowerCaseQuery = query.toLowerCase();

  if (!allBills) {
    throw new Error('Error fetching data')
  }

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

export async function findExistingBillByURL(billURl: string): Promise<Bill | null> {
  try {
    if (sql) {
      const result = await sql`
        SELECT * FROM bills
        WHERE bill_url = ${billURl}       
        limit 1       
      `

      if (result) {
        return result[0]
      } else {
        console.log('Could not find bill in database based on: ', billURl)
        return null
      } 
    } else {
      console.error('SQL connection not available');
      return null;
  }
  } catch (error) {
    console.error('Database search failed', error)
    return null
  }
}

export async function updateFoodRelatedFlagByURL(billURL: string, state: boolean | null) {
  try {
    if (sql) {
      const result = await sql`
       UPDATE bills 
       SET food_related = ${state} 
       WHERE bill_url = ${billURL}
       RETURNING * 
      `

      if (result) {
        console.log(`Successfully updated bill ${result[0].bill_number} to food_related ${state} in database`)
        return result[0]
      } else {
        console.log('Could not find bill in database based on: ', billURL)
        return null
      } 
    } else {
      console.error('SQL connection not available');
      return null;
    }
  } catch (error) {
    console.error('Database update failed', error)
    return null
  }
}

export async function insertNewBill(bill: Bill): Promise<Bill | null> {
  try {
    if (sql) {
      const result = await sql`
        INSERT INTO bills
        VALUES ${sql(bill)}
      `

      return result
    } else {
      console.error('SQL connection not available')
      return null
    }
  } catch (error) {
    console.error('Database insert failed', error)
    return null
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