'use server';

import type { Bill, BillStatus, StatusUpdate, Tag } from '@/types/legislation';
import { KANBAN_COLUMNS } from '@/lib/kanban-columns';
import { db } from '@/db/kysely/client';
import { Bills } from '@/db/types';
import { Selectable } from 'kysely';
import { getBatchBillTags } from '@/services/data/tags';

interface BillData {
  bills: Selectable<Bills>[];
  statusUpdates: Selectable<BillStatus>[];
  tags: Record<string, Tag[]>;
}
async function mapBillDataToBillClient(billData: BillData): Promise<Map<string, Bill>> {
  const { bills, statusUpdates, tags } = billData;
  const billObjects = new Map<string, Bill>();

  // Map bills data (data, updates, tags) to Bill client objects
  await Promise.all(bills.map(async (row: Selectable<Bills>) => {

    // Init map data to client data shape
    if (!billObjects.has(row.id)) {
      billObjects.set(row.id, await convertDataToBillShape(row));
    }

    // Add status updates & tags to the bill object
    const bill = billObjects.get(row.id) as Bill;
    if (bill) {
        const updatesForBill = statusUpdates.filter(update => update.bill_id === row.id);
        bill.updates = updatesForBill.map(update => ({
            id: update.update_id as string,
            statustext: (update.statustext || '') as string,
            date: (update.date || '') as string,
            chamber: (update.chamber || '') as string
        }));

        // Add tags to the bill object
        bill.tags = tags[row.id] || [];
    }
  }));

  return billObjects;
}

async function convertDataToBillShape(bill: Selectable<Bills>): Promise<Bill> {
  const { toDate } = await import('@/lib/utils');
  return {
    // attributes from the database
    bill_number: bill.bill_number ?? '',
    bill_title: bill.bill_title ?? '',
    bill_url: bill.bill_url,
    committee_assignment: bill.committee_assignment ?? '',
    created_at: toDate(bill.created_at),
    current_status: typeof bill.current_status === 'string' ? bill.current_status : '',
    current_status_string: bill.current_status_string ?? '',
    description: bill.description ?? '',
    food_related: typeof bill.food_related === 'boolean' ? bill.food_related : null,
    id: typeof bill.id === 'string' ? bill.id : '',
    introducer: bill.introducer ?? '',
    nickname: bill.nickname ?? '',
    updated_at: toDate(bill.updated_at),

    // client-side attributes
    updates: [],
    tags: [],
    previous_status: undefined,
    llm_suggested: undefined,
    llm_processing: undefined,
  };
}

async function getStatusUpdatesForBills(billIds: string[]): Promise<Selectable<BillStatus>[]> {
    const updates = await db
      .selectFrom('status_updates as su')
      .select([
        'su.chamber',
        'su.date',
        'su.id as update_id',
        'su.statustext',
        'su.bill_id'
      ])
      .where('su.bill_id', 'in', billIds)
      .orderBy('su.date', 'desc')
      .execute();
    return updates;
}

// ==============================================
// FETCH BILL DATA FUNCTIONS
// ===============================================

/**
 * Gets all food-related bills that have been adopted (at least one adoption)
 * Used for public view
 */
export async function getAllTrackedBills(): Promise<Bill[]> {
    console.log('[BILLS FETCH (PUBLIC)] Fetching all food+ tracked bills for public view...');
    try {
        // Fetch all bills that have been adopted at least once
        const bills = await db
          .selectFrom('bills as b')
          .innerJoin('user_bills as ub', 'b.id', 'ub.bill_id') // Only bills that have been adopted
          .selectAll('b')
          .where('food_related', '=', true) // Only food-related bills
          .orderBy('b.updated_at', 'desc')  // Most recently updated first
          .execute();

        const billIds = bills.map(bill => bill.id);
        
        console.log(`[BILLS FETCH (PUBLIC)] Found ${billIds.length} food-related adopted bills, fetching status updates & tags...`);        
        const { statusUpdates, tags } = await getAdditionalBillData(billIds);

        const billObjects = await mapBillDataToBillClient({
          bills,
          statusUpdates,
          tags
        });

        console.log(`[BILLS FETCH (PUBLIC)] Rendering ${billObjects.size} food-related adopted bills...`);
        return Array.from(billObjects.values());
      } catch (e) {
        console.log('Data fetch did not work: ', e);
        return [];
      }
    }

/**
 * Gets ALL food-related bills from the database (regardless of adoption status)
 * Used for logged in Food+ members who want to see all bills
 */
export async function getAllFoodRelatedBills(): Promise<Bill[]> {
    console.log('[BILLS FETCH (ALL)] Fetching all food-related bills for member view...');
    try {
        const bills = await db
          .selectFrom('bills as b')          
          .selectAll('b')
          .where('food_related', '=', true) // Only food-related bills
          .orderBy('b.updated_at', 'desc')  // Most recently updated first
          .execute()
        
        const billIds = bills.map(bill => bill.id);
        
        console.log(`[BILLS FETCH (ALL)] Found ${billIds.length} food-related adopted bills, fetching status updates & tags...`);        
        const { statusUpdates, tags } = await getAdditionalBillData(billIds);

        const billObjects = await mapBillDataToBillClient({
          bills,
          statusUpdates,
          tags
        });

        console.log(`[BILLS FETCH (ALL)] Rendering ${billObjects.size} food-related adopted bills...`);

        return Array.from(billObjects.values());
    } catch (e) {
      console.log('Data fetch did not work: ', e);
      return [];
    }
}

/**
 * Gets all bills tracked by a specific user 
 * If user is a supervisor, also includes bills adopted by their interns
 * @param userId User ID to get tracked bills for
 */
export async function getUserTrackedBills(userId: string): Promise<Bill[]> {
  
  let bills: Selectable<Bill>[] = []; // init empty array to hold combined bills (if supervisor, contains supervisor + intern bills)

  try {
    // Check user role
    const user = await db
      .selectFrom('user')
      .select(['id', 'role'])
      .where('id', '=', userId)
      .executeTakeFirst();

    if (!user) {
      console.log('[BILLS FETCH (USER)] User not found:', userId);
      throw new Error('User not found');
    }

    // Get bills directly adopted by the user
    const userBills = await db
      .selectFrom('bills as b')
      .innerJoin('user_bills as ub', 'b.id', 'ub.bill_id') // Only bills that have been adopted (bills that have a bill id in the user_bills table)
      .where('ub.user_id', '=', userId)
      .selectAll('b')
      .orderBy('b.updated_at', 'desc')
      .execute();

    console.log(`[BILLS FETCH (USER)] Found ${userBills.length} bill(s) directly tracked by user ${userId.slice(0, 6)} (role: ${user.role})`);
    let bills = [...userBills];

    // If user is a supervisor, also get bills from their adopted interns
    if (user.role === 'supervisor') {
      console.log(`[BILLS FETCH (SUPERVISOR)] User is a supervisor, fetching bills managed by intern(s)...`);

      // Get intern IDs adopted by this supervisor
      const supervisorRelations = await db
        .selectFrom('supervisor_users')
        .select(['user_id'])
        .where('supervisor_id', '=', userId)
        .execute();

      const internIds = supervisorRelations.map((rel) => rel.user_id);
      console.log(`[BILLS FETCH (SUPERVISOR)] Found ${internIds.length} interns for this supervisor...`);

      // Get bills adopted by these interns
      if (internIds.length > 0) {
        const internBills = await db
          .selectFrom('bills as b')
          .innerJoin('user_bills as ub', 'b.id', 'ub.bill_id')          
          .where('ub.user_id', 'in', internIds)
          .selectAll('b')
          .orderBy('b.updated_at', 'desc')
          .execute();

        console.log(`[BILLS FETCH (SUPERVISOR)] Found ${internBills.length} bills from adopted interns`);
        // Combine both sets of bills
        bills = [...userBills, ...internBills];
        console.log(`[BILLS FETCH (SUPERVISOR)] Total bills (direct + intern): ${bills.length}`);
      }
    }

    const billIds = bills.map(bill => bill.id);
    console.log(`[BILLS FETCH (USER)] Fetching status updates & tags for ${billIds.length} bills...`);    
    const { statusUpdates, tags } = await getAdditionalBillData(billIds);

    const billObjects = await mapBillDataToBillClient({
      bills,
      statusUpdates,
      tags
    });

    console.log(`[BILLS FETCH (USER)] Rendering ${billObjects.size} tracked bills...`);
    return Array.from(billObjects.values());
  } catch (error) {
    console.error('Failed to get user adopted bills:', error);
    return [];
  }
}

/**
 * Helper to fetch status updates and tags for fetched bills
 */
async function getAdditionalBillData(billIds: string[]) {
  // Batch fetch status updates for these bills
  const statusUpdates = await getStatusUpdatesForBills(billIds);
  
  // Batch fetch tags for these bills
  const tags = await getBatchBillTags(billIds);

  return { statusUpdates, tags };
}

// ==============================================
// BILL UPDATE FUNCTIONS
// ==============================================

/**
 * Asynchronously updates the status of a bill.
 * Also updates the updated_at timestamp.
 *
 * @param billId The ID of the bill to update.
 * @param newStatus The new status (Kanban column ID) for the bill.
 * @returns The updated Bill object.
 */
export async function updateBillStatus(billId: string, newStatus: BillStatus): Promise<Bill> {
    console.log(`[UPDATE STATUS] Updating bill ${billId.slice(0, 6)} to new status: ${newStatus}`);

    // Validate if newStatus is a valid column ID
    if (!KANBAN_COLUMNS.some(col => col.id === newStatus)) {
        console.error(`Invalid status update: ${newStatus}`);
        throw new Error('Invalid status requested');
    }

    try {
        const updatedBill = await db.updateTable('bills')
        .set({
            current_status: newStatus,
            updated_at: new Date()
        })
        .where('id', '=', billId)
        .returningAll()
        .executeTakeFirst();

        if (updatedBill) {
            console.log(`[UPDATE STATUS] Successfully updated bill ${billId.slice(0, 6)} to status ${newStatus} in database`);
            const bill = await convertDataToBillShape(updatedBill);

            return bill;
        } else {
            console.error(`Bill with ID ${billId} not found in database.`);
            throw new Error('Bill not found');
        }
    } catch (error) {
        console.error('Database update failed:', error);
        throw new Error('Failed to update bill status');
    }
}

/**
 * Updates the food-related flag for a bill using its URL.
 *
 * @param billURL The URL of the bill to update.
 * @param state The new state of the food-related flag.
 * @returns The updated Bill object
 */
export async function updateFoodRelatedFlagByURL(billURL: string, state: boolean | null): Promise<Bill> {
  try {
    const result = await db.updateTable('bills')
      .set({ food_related: state })
      .where('bill_url', '=', billURL)
      .returningAll()
      .executeTakeFirst();

    if (result) {
      console.log(`Successfully updated bill ${result.bill_number} food_related statet to ${state} in database`)
      const bill = await convertDataToBillShape(result);

      return bill;
    } else {
      console.log('Could not find bill in database based on: ', billURL)
      throw new Error('Bill not found');
    }
  } catch (error) {
    console.error('Database update failed', error)
    throw new Error('Failed to update food-related flag');
  }
}

// ==============================================
// BILL SEARCH FUNCTIONS
// ==============================================

/**
 * Asynchronously searches for bills based on a query (ID, bill_title, or description).
 *
 * @param query The search query.
 * @returns A promise that resolves to an array of matching Bill objects.
 */
export async function searchBills(bills: Bill[], query: string): Promise<Bill[]> {

  if (!query) {
    return bills; // Return all sorted bills if query is empty
  }
  const lowerCaseQuery = query.toLowerCase();  

  return bills.filter(bill =>
    bill.id.toLowerCase().includes(lowerCaseQuery) ||
    bill.bill_number.toLowerCase().includes(lowerCaseQuery) ||
    bill.bill_title.toLowerCase().includes(lowerCaseQuery) ||
    bill.description.toLowerCase().includes(lowerCaseQuery)
  );
}

/**
 * Finds an existing bill in the database by its URL.
 *
 * @param billURL The URL of the bill to find.
 * @returns The found Bill object or null if not found.
 */
export async function findExistingBillByURL(billURl: string): Promise<Bill | null> {
  try {
    const result = await db.selectFrom('bills')
      .selectAll()
      .where('bill_url', 'like', `${billURl}%`)      
      .executeTakeFirst();

    if (result) {
      console.log(`Found existing bill in database based on: `, billURl)
      const bill = await convertDataToBillShape(result);

      return bill;
    } else {
      console.log('Could not find bill in database based on: ', billURl)
      return null
    }
  } catch (error) {
    console.error('Database search failed', error)
    return null
  }
}

// ==============================================
// BILL TRACK & INSERT FUNCTIONS
// ==============================================

export async function trackBill(userId: string, billUrl: string): Promise<Bill | null> {
  try {
    // Find bill by URL or scrape if not found
    let bill: Bill;
    const billResult = await findExistingBillByURL(billUrl);

    if (!billResult) {
      // Bill not found - scrape and add to database
      console.log('[TRACK BILL] Bill not found with URL:', billUrl);
      console.log('[TRACK BILL] Scraping bill URL:', billUrl, '...');

      const { findBill } = await import('@/services/scraper');
      const scrapedData = await findBill(billUrl);

      console.log('[TRACK BILL] Scraped new bill data:', scrapedData);
      bill = scrapedData.individualBill;
    } else {
      // Bill found in database
      console.log('[TRACK BILL] Bill found with URL:', billUrl);
      bill = billResult;
    }

    // Check if already tracked by user
    const alreadyTracked = await db.selectFrom('user_bills').selectAll()
      .where('user_id', '=', userId)
      .where('bill_id', '=', bill.id)
      .execute();

    if (alreadyTracked && alreadyTracked.length > 0) {
      console.log('Bill already tracked by user', userId.slice(0, 6), 'bill', bill.id.slice(0, 6));
      throw new Error('Bill already tracked by this user');
    }

    // Create user_bills relation
    await db.insertInto('user_bills').values({
      user_id: userId,
      bill_id: bill.id,
      adopted_at: new Date()
    }).executeTakeFirst();

    console.log(`Successfully tracked bill ${bill.id} for user ${userId}`);

    // Return bill with empty tags - context will handle batch tag fetching
    // This eliminates 2 unnecessary database queries
    return { ...bill, tags: [] } as Bill;
  } catch (error) {
    console.error('Failed to adopt bill:', error);
    return null;
  }
}

export async function unadoptBill(userId: string, billId: string): Promise<boolean> {
  try {
    console.log('unadoptBill called with:', { userId, billId });
    const result = await db.deleteFrom('user_bills')
      .where('user_id', '=', userId)
      .where('bill_id', '=', billId)
      .executeTakeFirstOrThrow();

    console.log(`Successfully unadopted bill ${billId} for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Failed to unadopt bill:', error);
    return false;
  }
}

export async function insertNewBill(bill: Bill): Promise<Bill | null> {
  try {
    // Convert Bill to database format (snake_case)
    const dbBill = {
      id: bill.id,
      bill_number: bill.bill_number,
      bill_title: bill.bill_title,
      bill_url: bill.bill_url,
      committee_assignment: bill.committee_assignment,
      created_at: bill.created_at,
      current_status: bill.current_status,
      current_status_string: bill.current_status_string,
      description: bill.description,
      food_related: bill.food_related,
      introducer: bill.introducer,
      nickname: bill.nickname,
      updated_at: bill.updated_at,
    };
    const result = await db.insertInto('bills').values(dbBill).returningAll().executeTakeFirst();

    console.log(`Successfully inserted new bill ${bill.bill_number} into database`)
    return mapBillsToBill(result as unknown as Bills);
  } catch (error) {
    console.error('Database insert failed', error)
    return null
  }
}