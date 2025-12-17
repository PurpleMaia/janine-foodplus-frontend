'use server';

import { db } from '@/db/kysely/client';
import { auth } from '@/lib/auth';
import { Errors } from '@/lib/errors';
import { BillWithInterns, InternWithBills, PendingProposal, PendingUser, SupervisorWithInterns } from '@/types/admin';
import { revalidatePath } from 'next/cache';

interface ActionResult<T = void> {
  success: boolean;
  error?: string;
  data?: T;
}

// Helper to verify admin access
async function verifyAdminAccess(): Promise<{ userId: string }> {
  const session = await auth();

  if (!session) throw Errors.NO_SESSION_COOKIE;

  if (session.user.role !== 'admin') {
    throw Errors.UNAUTHORIZED;
  }

  const userId = session.user.id;  
  
  return { userId };
}

// ============================================
// FETCH ACTIONS
// ============================================

export async function getPendingRequests(): Promise<ActionResult<PendingUser[]>> {
  try {
    const admin = await verifyAdminAccess();    

    console.log('📋 [PENDING REQUESTS] Loading pending user account requests');

    const pendingRequests: PendingUser[] = await db.selectFrom('user')
      .select(['id', 'email', 'username', 'created_at', 'requested_admin', 'requested_supervisor', 'account_status'])
      .where('account_status', '=', 'pending')
      .where('id', '!=', admin.userId) // Exclude current user (should never happen)
      .execute();

    console.log(`✅ [PENDING REQUESTS] Successfully loaded ${pendingRequests.length} pending requests`);

    return { success: true, data: pendingRequests };
  } catch (error) {
    console.error('❌ [PENDING REQUESTS] Error fetching pending requests:', error);
    return { success: false, error: 'Failed to fetch pending requests' };
  }
}
// NOTE will be available to all not just admin
export async function getPendingProposals(): Promise<ActionResult<PendingProposal[]>> {
  try {
    await verifyAdminAccess();

    console.log('📋 [PENDING PROPOSALS] Admin loading all pending proposals...');
    const proposals = await db
      .selectFrom('pending_proposals')
      .leftJoin('user as proposer', (join: any) =>
        join.onRef('pending_proposals.proposed_by_user_id', '=', 'proposer.id')
      )
      .leftJoin('bills', (join: any) =>
        join.onRef('pending_proposals.bill_id', '=', 'bills.id')
      )
      .selectAll('pending_proposals')
      .select([
        'proposer.username as proposer_username',
        'proposer.email as proposer_email',
        'proposer.role as proposer_role',
        'bills.bill_number',
        'bills.bill_title',
      ])
      .where('pending_proposals.approval_status', '=', 'pending')
      .execute();

    const formattedProposals = proposals.map((proposal) => ({
      ...proposal,
      bill_number: proposal.bill_number,
      bill_title: proposal.bill_title,
      proposer: {
        username: proposal.proposer_username,
        email: proposal.proposer_email,
        role: proposal.proposer_role,
      }
    }));

    console.log(`✅ [PENDING PROPOSALS] Admin found ${proposals.length} pending proposals`);

    return { success: true, data: formattedProposals };
  } catch (error) {
    console.error('Error fetching pending proposals:', error);
    return { success: false, error: 'Failed to fetch pending proposals' };
  }
}

export async function getAllInterns(): Promise<ActionResult<InternWithBills[]>> {
  try {
    await verifyAdminAccess();    

    // Get all interns (users with role 'user')
    console.log('📋 [ALL INTERNS] Loading all interns with bills...');

    const rows = await db
      .selectFrom('user')
      .leftJoin('supervisor_users', 'user.id', 'supervisor_users.user_id')
      .leftJoin('user as supervisor', 'supervisor_users.supervisor_id', 'supervisor.id')
      .leftJoin('user_bills', 'user.id', 'user_bills.user_id')
      .leftJoin('bills', 'user_bills.bill_id', 'bills.id')
      .select([
        'user.id',
        'user.email',
        'user.username',
        'user.created_at',
        'user.account_status',
        'supervisor.id as supervisor_id',
        'supervisor.email as supervisor_email',
        'supervisor.username as supervisor_username',
        'bills.id as bill_id',
        'bills.bill_number',
        'bills.bill_title',
        'bills.current_status',
        'user_bills.adopted_at'
      ])
      .where('user.role', '=', 'user')
      .where('user.account_status', '!=', 'denied') 
      .where('user.account_status', '!=', 'unverified')
      .orderBy('account_status', 'asc')       
      .execute();

    // Aggregate rows into nested structure
    const internMap = new Map<string, InternWithBills>();

    for (const row of rows) {
      if (!internMap.has(row.id)) {
        internMap.set(row.id, {
          id: row.id,
          email: row.email,
          username: row.username,
          created_at: row.created_at,
          account_status: row.account_status,
          supervisor_id: row.supervisor_id,
          supervisor_email: row.supervisor_email,
          supervisor_username: row.supervisor_username,
          adopted_bills: []
        });
      }

      if (row.bill_id) {
        internMap.get(row.id)!.adopted_bills.push({
          bill_id: row.bill_id,
          bill_number: row.bill_number,
          bill_title: row.bill_title,
          current_status: row.current_status,
          adopted_at: row.adopted_at
        });
      }
    }

    const internsWithDetails = [...internMap.values()];

    console.log(`✅ [ALL INTERNS] Successfully compiled intern details with bills and supervisors`);

    return { success: true, data: internsWithDetails };
  } catch (error) {
    console.error('❌ [ALL INTERNS] Error fetching all interns:', error);
    return { success: false, error: 'Failed to fetch all interns' };
  }
}

export async function getAllSupervisors(): Promise<ActionResult<SupervisorWithInterns[]>> {
  try {
    await verifyAdminAccess();

    console.log('📋 [ALL SUPERVISORS] Loading all supervisors with interns...');

   const rows = await db
    .selectFrom('user as supervisor')
    .leftJoin('supervisor_users', 'supervisor.id', 'supervisor_users.supervisor_id')
    .leftJoin('user as intern', 'supervisor_users.user_id', 'intern.id')
    .select([
      'supervisor.id as supervisor_id',
      'supervisor.email as supervisor_email',
      'supervisor.username as supervisor_username',
      'intern.id as intern_id',
      'intern.email as intern_email',
      'intern.username as intern_username',
      'supervisor_users.created_at as adopted_at'
    ])
    .where('supervisor.role', '=', 'supervisor')
    .where('supervisor.account_status', '=', 'active')
    .execute();

  // Aggregate into nested structure
  const supervisorMap = new Map<string, SupervisorWithInterns>();

  for (const row of rows) {
    if (!supervisorMap.has(row.supervisor_id)) {
      supervisorMap.set(row.supervisor_id, {
        supervisor_id: row.supervisor_id,
        supervisor_email: row.supervisor_email,
        supervisor_username: row.supervisor_username,
        interns: []
      });
    }

    if (row.intern_id) {
      supervisorMap.get(row.supervisor_id)!.interns.push({
        id: row.intern_id,
        email: row.intern_email!,
        username: row.intern_username!,
        adopted_at: row.adopted_at!
      });
    }
  }

  const supervisors = [...supervisorMap.values()];

    console.log(`✅ [ALL SUPERVISORS] Successfully compiled supervisor-intern relationships`);

  return { success: true, data: supervisors };
  } catch (error) {
    console.error('❌ [ALL SUPERVISORS] Error fetching supervisor relationships:', error);
    return { success: false, error: 'Failed to fetch supervisor relationships' };
  }
}

export async function getAllInternBills(): Promise<ActionResult<BillWithInterns[]>> {
  try {
    await verifyAdminAccess();    

    console.log('📋 [ALL INTERN BILLS] Loading all bills tracked by users...');

      const rows = await db
      .selectFrom('bills')
      .innerJoin('user_bills', 'bills.id', 'user_bills.bill_id')
      .leftJoin('user', 'user_bills.user_id', 'user.id')
      .select([
        'bills.id as bill_id',
        'bills.bill_number',
        'bills.bill_title',
        'bills.current_status',
        'user.id as intern_id',
        'user.email as intern_email',
        'user.username as intern_username',
        'user_bills.adopted_at'
      ])
      .orderBy('bills.bill_number', 'asc')
      .execute();

    // Aggregate into nested structure
    const billMap = new Map<string, BillWithInterns>();

    for (const row of rows) {
      if (!billMap.has(row.bill_id)) {
        billMap.set(row.bill_id, {
          bill_id: row.bill_id,
          bill_number: row.bill_number,
          bill_title: row.bill_title,
          current_status: row.current_status,
          tracked_by: []
        });
      }

      if (row.intern_id) {
        billMap.get(row.bill_id)!.tracked_by.push({
          id: row.intern_id,
          email: row.intern_email!,
          username: row.intern_username!,
          adopted_at: row.adopted_at!
        });
      }
    }

    const billsWithInterns = [...billMap.values()];

    console.log(`✅ [ALL INTERN BILLS] Successfully compiled bills tracked by interns`);

    return { success: true, data: billsWithInterns };
  } catch (error) {
    console.error('❌ [ALL INTERN BILLS] Error fetching all intern bills:', error);
    return { success: false, error: 'Failed to fetch all intern bills' };
  }
}

// ============================================
// MUTATION ACTIONS
// ============================================

export async function approveUser(userId: string, role: string): Promise<ActionResult> {
  try {
    await verifyAdminAccess();

    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }
    console.log('📋 [APPROVING ACCOUNT REQUEST] Approving user account request...');


    // First, get the user to check if they requested admin access
    const user = await db
      .selectFrom('user')
      .select(['id', 'requested_admin'])
      .where('id', '=', userId)
      .where('account_status', '=', 'pending')
      .executeTakeFirst();

    if (!user) {      
      throw new Error('User not found or not pending');
    }    

    await db.updateTable('user')
      .set({
        account_status: 'active',
        requested_admin: false, // reset
        role
      })
      .where('id', '=', userId)
      .where('account_status', '=', 'pending')
      .executeTakeFirst();

    console.log(`✅ [APPROVING ACCOUNT REQUEST] Approved user ${userId} with role ${role}`);

    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('❌ [APPROVING ACCOUNT REQUEST] Error approving user:', error);
    return { success: false, error: 'Failed to approve user' };
  }
}

export async function denyUser(userId: string): Promise<ActionResult> {
  try {
    await verifyAdminAccess();

    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }

    console.log('📋 [DENYING ACCOUNT REQUEST] Denying user account request...');

    await db.updateTable('user')
      .set({ account_status: 'denied', requested_admin: false })
      .where('id', '=', userId)
      .where('account_status', '=', 'pending')
      .executeTakeFirst();

    revalidatePath('/admin');
    
    console.log(`✅ [DENYING ACCOUNT REQUEST] Denied user ${userId}`);
    return { success: true };
  } catch (error) {
    console.error('❌ [DENYING ACCOUNT REQUEST] Error denying user:', error);
    return { success: false, error: 'Failed to deny user' };
  }
}