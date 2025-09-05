import { NextRequest } from "next/server";
import { db } from "../../db/kysely/client";
import { User, getSessionCookie, validateSession } from "./simple-auth";

export async function getAdminUserData(request: NextRequest): Promise<User | { error: string } | null> {
  try {
    //gets session token from cookie 
    const session_token = getSessionCookie(request);
    console.log('Session token from cookie:', session_token);
    
    //if there is no cookie, user is not logged in
    if (!session_token) {
        return { error: 'Invalid session' };
    }

    //validates session in the databse 
    const user = await validateSession(session_token);
    console.log('Validated user from session token:', user);

    if (!user) {
        return { error: 'Not authorized' };
    } else if (user.role !== 'admin') {
        return { error: 'Unauthorized: Admin Access only' };
    }

    return user;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

export async function getPendingRequests(userID: string): Promise<User[]> {
    const pendingRequests = db.selectFrom('user')
      .selectAll()    
      .where('account_status', '=', 'pending')
      .where('id', '!=', userID) // Exclude current user (should never happen)
      .execute();
    return pendingRequests;
} 

export async function approveUser(userIDtoApprove: string): Promise<boolean> {
  try {
    const result = await db.updateTable('user')
      .set({ account_status: 'active' })
      .where('id', '=', userIDtoApprove)
      .where('account_status', '=', 'pending')
      .executeTakeFirst();

    return result.numUpdatedRows > 0;
  } catch (error) {
    console.error('Error approving user:', error);
    return false;
  }
}

export async function denyUser(userIDtoDeny: string): Promise<boolean> {
  try {
    const result = await db.updateTable('user')
      .set({ account_status: 'denied' })
      .where('id', '=', userIDtoDeny)
      .where('account_status', '=', 'pending')
      .executeTakeFirst();

    return result.numUpdatedRows > 0;
  } catch (error) {
    console.error('Error denying user:', error);
    return false;
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

export async function checkAdminRequestStatus(email: string): Promise<boolean> {
  try {
    const user = await db.selectFrom('user')
      .select(['requested_admin'])
      .where('email', '=', email)
      .executeTakeFirst();

    if (!user) {
      return false; // User not found
    }

    return user.requested_admin;
  } catch (error) {
    console.error('Error checking admin request status:', error);
    return false;
  }
}