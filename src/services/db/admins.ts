import { db } from "@/db/kysely/client"
import { User } from "@/types/users";
import { Errors } from "@/lib/errors";

export async function getPendingRequests(userID: string): Promise<User[]> {
    const pendingRequests = await db.selectFrom('user')
      .selectAll()    
      .where('account_status', '=', 'pending')
      .where('id', '!=', userID) // Exclude current user (should never happen)
      .execute();
    return pendingRequests;
} 

/**
 * Approves a user by their ID.
 * @param userIDtoApprove The ID of the user to approve.
 * @throws INTERNAL_ERROR - if the user is not found or the update fails.
 */
export async function approveUser(userIDtoApprove: string) : Promise<void> {  
  // First, get the user to check if they requested admin access
  const user = await db
    .selectFrom('user')
    .select(['id', 'requested_admin'])
    .where('id', '=', userIDtoApprove)
    .where('account_status', '=', 'pending')
    .executeTakeFirst();

  if (!user) {
    console.error('[approveUser] User not found or not pending for ID:', userIDtoApprove);
    throw Errors.INTERNAL_ERROR;
  }

  // Update user based on whether they requested admin access
  const updateData: any = {
    account_status: 'active',
    requested_admin: false // Reset the admin request flag
  };

  // If they requested admin access, grant admin role
  if (user.requested_admin) {
    updateData.role = 'admin';
  }

  const result = await db.updateTable('user')
    .set(updateData)
    .where('id', '=', userIDtoApprove)
    .where('account_status', '=', 'pending')
    .executeTakeFirst();
  
  if (!result) {
    console.error('[approveUser] Failed to update user for ID:', userIDtoApprove);
    throw Errors.INTERNAL_ERROR;
  }  
}

/**
 * @param userIDtoDeny The ID of the user to deny.
 * @returns INTERNAL_ERROR - if the update fails.
 */
export async function denyUser(userIDtoDeny: string): Promise<void> {
  const result = await db.updateTable('user')
    .set({ account_status: 'denied', requested_admin: false })
    .where('id', '=', userIDtoDeny)
    .where('account_status', '=', 'pending')
    .executeTakeFirst();

  if (!result) {
    console.error('[denyUser] Failed to update user for ID:', userIDtoDeny);
    throw Errors.INTERNAL_ERROR;
  }
}

export async function requestAdminAccess(email: string): Promise<boolean> {
  try {
    const result = await db.updateTable('user')
      .set({ requested_admin: true, account_status: 'pending' })
      .where('email', '=', email)
      .where('role', '!=', 'admin') // Prevent already admins from requesting
      .executeTakeFirst();

    return result.numUpdatedRows > 0;
  } catch (error) {
    console.error('Error requesting admin access:', error);
    return false;
  }
}

export async function checkAdminRequestStatus(email: string): Promise<boolean | null> {
  try {
    const user = await db.selectFrom('user')
      .select(['requested_admin'])
      .where('email', '=', email)
      .executeTakeFirst();

    if (!user) {
      console.error('[checkAdminRequestStatus] User not found in database');
      throw Errors.INTERNAL_ERROR;
    }

    return user.requested_admin;
  } catch (error) {
    console.error('Error checking admin request status:', error);
    return null;
  }
}