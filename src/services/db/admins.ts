import { db } from "@/db/kysely/client"
import { User } from "@/types/users";
import { Errors } from "@/lib/errors";
import { auth } from "@/lib/auth";

/**
 * Get all bill proposals for the current user.
 * @returns A list of all bill proposals formatted for admin/supervisor view.
 */
export async function getAllBillProposals() {
    const session = await auth();  
    const user = session?.user;

    if (!user) {
      throw Errors.UNAUTHORIZED;
    }

    let proposals;

    if (user.role === 'supervisor') {
      // For supervisors: get proposals from adopted interns
      // Join on proposed_by_user_id::uuid (the intern who made the proposal)
      proposals = await db
        .selectFrom('pending_proposals')
        .innerJoin('supervisor_users', 'pending_proposals.proposed_by_user_id', 'supervisor_users.user_id')
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
        .where('supervisor_users.supervisor_id', '=', user.id)
        .where('pending_proposals.approval_status', '=', 'pending')
        .execute();
        
    } else if (user.role === 'admin') {
      // For admins: get ALL pending proposals (they can approve/reject any proposal)
      console.log('📋 [LOAD PROPOSALS] Admin loading all pending proposals...');
      proposals = await db
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
      console.log(`✅ [LOAD PROPOSALS] Admin found ${proposals.length} pending proposals`);
    } else {
      // For regular users: get their own pending proposals (so they can see the skeleton/temporary bill)
      console.log('✅ [LOAD PROPOSALS] Loading proposals for user:', user.email, 'Role:', user.role);
      proposals = await db
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
        .where('pending_proposals.proposed_by_user_id', '=', user.id)
        .where('pending_proposals.approval_status', '=', 'pending')
        .execute();
      console.log(`✅ [LOAD PROPOSALS] Found ${proposals.length} pending proposals from database`);
      proposals.forEach((p: any, idx: number) => {
        console.log(`  [${idx + 1}] Bill ID: ${p.bill_id}, Status: ${p.current_status} → ${p.suggested_status}, Proposal ID: ${p.id}`);
      });
    }

    // Transform proposals to match expected shape
    const formattedProposals = proposals.map(p => ({
      id: p.bill_id,
      bill_id: p.bill_id,
      bill_number: p.bill_number ?? undefined,
      bill_title: p.bill_title ?? undefined,
      current_status: p.current_status,      
      proposed_status: p.proposed_status,
      target_idx: 0, // Not needed for display
      source: 'human' as const,
      approval_status: 'pending' as const,
      proposing_user_id: p.proposed_by_user_id,
      proposing_username: p.proposer_username || undefined,
      proposing_email: p.proposer_email || undefined,
      proposed_by: {
        user_id: p.proposed_by_user_id,
        role: p.proposer_role ?? 'intern',
        at: new Date(p.proposed_at).toISOString(),
        note: p.note || undefined,
        username: p.proposer_username || undefined,
        email: p.proposer_email || undefined,
      },
      proposalId: p.id, // Store actual proposal ID for approve/reject
    }));

    return formattedProposals    
}

export async function getPendingUserRequests() {
    const session = await auth();  
    const user = session?.user;

    if (!user) {
      throw Errors.UNAUTHORIZED;
    }

    console.log('📋 [USER REQUESTS] Admin loading all pending user requests...');
    
    const pendingRequests = await db.selectFrom('user')
    .selectAll()
    .where('account_status', '=', 'pending')
    .where('id', '!=', user.id) // Exclude current user (should never happen)
    .execute();

    console.log(`✅ [USER REQUESTS] found ${pendingRequests.length} pending requests`);
    return pendingRequests;
}

export async function getPendingSupervisorRequests() {
    const session = await auth();
    const user = session?.user;

    if (!user) {
      throw Errors.UNAUTHORIZED;
    }

    console.log('📋 [SUPERVISOR REQUESTS] Admin loading all pending supervisor requests...');
    const pendingRequests = await db
      .selectFrom('user')
      .selectAll()
      .where('requested_supervisor', '=', true)
      .where('role', '!=', 'supervisor') // Exclude users already promoted
      .execute();
    console.log(`✅ [SUPERVISOR REQUESTS] Found ${pendingRequests.length} pending requests`);

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