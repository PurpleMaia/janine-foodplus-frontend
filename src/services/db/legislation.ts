'use server';

import type { Bill, BillStatus } from '@/types/legislation';
import { KANBAN_COLUMNS } from '@/lib/kanban-columns';
import { db } from '@/db/kysely/client';
import { Bills } from '@/db/types';
import { mapBillsToBill, mapRawBillsWithUpdates } from '@/lib/utils';

// NOTE: Used these keywords to initially set food_related flags in DB
// const FOOD_KEYWORDS = [
//   'agriculture', 'food', 'farm', 'pesticides', 'eating', 'edible', 'meal',
//   'crop', 'harvest', 'organic', 'nutrition', 'diet', 'restaurant', 'cafe',
//   'kitchen', 'cooking', 'beverage', 'drink', 'produce', 'vegetable', 'fruit',
//   'meat', 'dairy', 'grain', 'seed', 'fertilizer', 'irrigation', 'livestock',
//   'poultry', 'fishery', 'aquaculture', 'grocery', 'market', 'vendor'
// ];

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

// const containsFoodKeywords = (bill: Bill) => {
//   const searchText = `${bill.bill_title || ''} ${bill.description || ''}`.toLowerCase();
//   return FOOD_KEYWORDS.some(keyword => searchText.includes(keyword.toLowerCase()));
// }

const BILL_SELECT_FIELDS = [
  'b.bill_number',
  'b.bill_title',
  'b.bill_url',
  'b.committee_assignment',
  'b.created_at',
  'b.current_status',
  'b.current_status_string',
  'b.description',
  'b.food_related',
  'b.id',
  'b.introducer',
  'b.nickname',
  'b.updated_at',
  'su.id as status_update_id', 
  'su.statustext',
  'su.date',
  'su.chamber'
] as const;

/**
 * Gets all food-related bills adopted/tracked by users
 */
export async function getAllUserAdoptedBills(): Promise<Bill[]> {
      console.log('📋 [ALL USER BILLS] Fetching all bills tracked by users...')

      const rawData = await db
        .selectFrom('bills as b')
        .innerJoin('user_bills as ub', 'b.id', 'ub.bill_id') // Only bills that have been adopted
        .leftJoin('status_updates as su', 'b.id', 'su.bill_id')
        .select(BILL_SELECT_FIELDS)
        .where('food_related', '=', true) // Only food-related bills
        .orderBy('b.updated_at', 'desc')  // Most recently updated first
        .orderBy('su.date', 'desc')       // Then most recently created
        .execute()
      
      // Map rawData to Bill objects
      const bills = mapRawBillsWithUpdates(rawData);

      console.log(`✅ [ALL USER BILLS] Fetched ${bills.length} bills tracked by users`);
      return bills;
}
/**
 * Gets ALL food-related bills from the database (regardless of adoption status)
 * Used for logged-in users who want to see all bills
 */
export async function getAllBills(): Promise<Bill[]> {  
    console.log('📋 [ALL BILLS] Fetching all food-related bills...')
    const rawData = await db
      .selectFrom('bills as b')
      .leftJoin('status_updates as su', 'b.id', 'su.bill_id')
      .select(BILL_SELECT_FIELDS)
      .where('food_related', '=', true) // Only food-related bills
      .orderBy('b.updated_at', 'desc')  // Most recently updated first
      .orderBy('su.date', 'desc')       // Then most recently created
      .execute()

    if (!rawData || rawData.length === 0) {
      console.log('[ALL BILLS] No food-related bills found in database.');
      return [];
    }

    // On successful fetch, map to Bill objects
    const bills = mapRawBillsWithUpdates(rawData);

    console.log(`✅ [ALL BILLS] Fetched ${bills.length} food-related bills from database.`);
    return bills;
}


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
        const updatedBill = await db.updateTable('bills')
        .set({
            current_status: newStatus,
            updated_at: new Date()
        })
        .where('id', '=', billId)
        .returningAll()
        .executeTakeFirst();

        if (updatedBill) {
            
            console.log(`Successfully updated bill ${billId} to status ${newStatus} in database`);
            return mapBillsToBill(updatedBill as unknown as Bills);
        } else {
            console.error(`Bill with ID ${billId} not found in database.`);
            return null;
        }
    } catch (error) {
        console.error('Database update failed:', error);
        return null;
    }
}

export async function findExistingBillByURL(billURl: string): Promise<Bill | null> {
  try {
    const result = await db.selectFrom('bills')
      .selectAll()
      .where('bill_url', 'like', `${billURl}%`)      
      .executeTakeFirst();

    if (result) {
      console.log(`Found existing bill in database based on: `, billURl)
      return mapBillsToBill(result as unknown as Bills);
    } else {
      console.log('Could not find bill in database based on: ', billURl)
      return null
    }
  } catch (error) {
    console.error('Database search failed', error)
    return null
  }
}

export async function updateFoodRelatedFlagByURL(billURL: string, state: boolean | null) {
  try {
    const result = await db.updateTable('bills')
      .set({ food_related: state })
      .where('bill_url', '=', billURL)
      .returningAll()
      .executeTakeFirst();

    if (result) {
      console.log(`Successfully updated bill ${result.bill_number || result.bill_number} to food_related ${state} in database`)
      return mapBillsToBill(result as unknown as Bills)
    } else {
      console.log('Could not find bill in database based on: ', billURL)
      return null
    }
  } catch (error) {
    console.error('Database update failed', error)
    return null
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

// Bill adoption functions
export async function adoptBill(userId: string, billUrl: string): Promise<boolean> {
  try {

    // First find the bill by URL
    const billResult = await findExistingBillByURL(billUrl);
    if (!billResult) {
      console.log('Bill not found with URL:', billUrl);
      return false;
    }    

    const billId = billResult.id;

    // Check if already adopted
    const alreadyAdopted = await db.selectFrom('user_bills').selectAll()
      .where('user_id', '=', userId)
      .where('bill_id', '=', billId)
      .execute();

    if (alreadyAdopted && alreadyAdopted.length > 0) {
      console.log('Bill already adopted by user');
      return false;
    }

    // Add the adoption record
    await db.insertInto('user_bills').values({
      user_id: userId,
      bill_id: billId,
      adopted_at: new Date()
    }).executeTakeFirst();

    console.log(`Successfully adopted bill ${billId} for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Failed to adopt bill:', error);
    return false;
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

export async function getUserAdoptedBills(userId: string): Promise<Bill[]> {
  try {    
    // First, check if the user is a supervisor
    const user = await db
      .selectFrom('user')
      .select(['id', 'role'])
      .where('id', '=', userId)
      .executeTakeFirst();

    if (!user) {
      return [];
    }

    // Get bills directly adopted by the user
    let rawData = await (db
      .selectFrom('bills as b')
      .innerJoin('user_bills as ub', 'b.id', 'ub.bill_id') // Only bills that have been adopted (bills that have a bill id in the user_bills table)
      .leftJoin('status_updates as su', 'b.id', 'su.bill_id')
      // @ts-expect-error - user_bill_preferences table is created dynamically and not in DB types
      .leftJoin('user_bill_preferences as ubp', (join: any) =>
        join
          .onRef('ubp.bill_id', '=', 'ub.bill_id')
          .onRef('ubp.user_id', '=', 'ub.user_id')
      ) as any)
      .where('ub.user_id', '=', userId)
      .select([
        'b.bill_number',
        'b.bill_title',
        'b.bill_url',
        'b.committee_assignment',
        'b.created_at',
        'b.current_status',
        'b.current_status_string',
        'b.description',
        'b.food_related',
        'b.id',
        'b.introducer',
        'b.nickname',
        'b.updated_at',
        'su.id as status_update_id',
        'su.statustext',
        'su.date',
        'su.chamber',
        'ubp.nickname as user_nickname'
      ])
      .orderBy('b.updated_at', 'desc')
      .orderBy('su.date', 'desc')
      .execute();
    
    console.log(`📋 [USER BILLS] Found ${rawData.length} bills directly adopted by user ${userId} (role: ${user.role})`);

    // If user is a supervisor, also get bills from their adopted interns
    if (user.role === 'supervisor') {
      console.log(`🔍 [SUPERVISOR BILLS] Loading bills for supervisor: ${userId}`);
      
      // First, get all adopted intern IDs for this supervisor
      const supervisorRelations = await db
        .selectFrom('supervisor_users')
        .select(['user_id'])
        .where('supervisor_id', '=', userId)
        .execute();

      const internIds = supervisorRelations.map((rel: any) => rel.user_id);
      console.log(`👥 [SUPERVISOR BILLS] Found ${internIds.length} adopted interns:`, internIds);

      if (internIds.length > 0) {
        // Now get all bills adopted by these interns (using same query structure as main query)
        const internBills = await db
          .selectFrom('bills as b')
          .innerJoin('user_bills as ub', 'b.id', 'ub.bill_id')
          .leftJoin('status_updates as su', 'b.id', 'su.bill_id')
          .where('ub.user_id', 'in', internIds)
          .select([
            'b.bill_number',
            'b.bill_title',
            'b.bill_url',
            'b.committee_assignment',
            'b.created_at',
            'b.current_status',
            'b.current_status_string',
            'b.description',
            'b.food_related',
            'b.id',
            'b.introducer',
            'b.nickname',
            'b.updated_at',
            'su.id as status_update_id',
            'su.statustext',
            'su.date',
            'su.chamber'
          ])
          .orderBy('b.updated_at', 'desc')
          .orderBy('su.date', 'desc')
          .execute();

        console.log(`✅ [SUPERVISOR BILLS] Found ${internBills.length} bills from adopted interns`);
        internBills.forEach((bill: any, idx: number) => {
          console.log(`  [${idx + 1}] ${bill.bill_number}: ${bill.bill_title} (ID: ${bill.id})`);
        });

        // Combine both sets of bills
        rawData = [...rawData, ...internBills];
        console.log(`📊 [SUPERVISOR BILLS] Total bills (direct + intern): ${rawData.length}`);
      } else {
        console.log(`ℹ️ [SUPERVISOR BILLS] No adopted interns, skipping intern bills query`);
      }
    }

    // Map rawData to Bill objects using Map to handle duplicates
    const billObject = new Map<string, Bill>();

    rawData.forEach((row: any) => {
      // If bill not already added to client-side bill object, map to client container
      if (!billObject.has(row.id)) {
        billObject.set(row.id, mapBillsToBill(row as unknown as Bills));
      }

      // Add status update if it exists
      if (row.status_update_id) {
        const bill = billObject.get(row.id);
        if (bill) {
          if (!bill.updates) {
            bill.updates = [];
          }
          bill.updates.push({
            id: row.status_update_id,
            statustext: row.statustext || '',
            date: row.date || '',
            chamber: row.chamber || ''
          });
        }
      }

      if (Object.prototype.hasOwnProperty.call(row, 'user_nickname')) {
        const bill = billObject.get(row.id);
        if (bill) {
          bill.user_nickname = row.user_nickname ?? null;
        }
      }
    });

    const finalBills = Array.from(billObject.values());
    console.log(`✅ [USER BILLS] Returning ${finalBills.length} unique bills for user ${userId} (role: ${user.role})`);
    if (user.role === 'supervisor') {
      finalBills.forEach((bill, idx) => {
        console.log(`  [${idx + 1}] ${bill.bill_number}: ${bill.bill_title}`);
      });
    }
    return finalBills;
  } catch (error) {
    console.error('Failed to get user adopted bills:', error);
    return [];
  }
}