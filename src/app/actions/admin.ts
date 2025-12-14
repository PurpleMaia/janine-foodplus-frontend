'use server';

import { db } from '@/db/kysely/client';
import { auth } from '@/lib/auth';
import { Errors } from '@/lib/errors';
import { PendingUser } from '@/types/admin';
import { revalidatePath } from 'next/cache';

// Types - adjust based on your actual data structures
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
// FETCH ACTIONS (replacing GET/POST fetch endpoints)
// ============================================

export async function getPendingRequests(): Promise<ActionResult<PendingUser[]>> {
  try {
    const admin = await verifyAdminAccess();    

    console.log('📋 [PENDING REQUESTS] Loading pending requests for admin:', admin.userId);

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

export async function getPendingProposals(): Promise<ActionResult<Proposal[]>> {
  try {
    const admin = await verifyAdminAccess();
    if (!admin) {
      return { success: false, error: 'Unauthorized' };
    }

    // Replace with your actual database query
    // const proposals = await db
    //   .selectFrom('proposals')
    //   .where('status', '=', 'pending')
    //   .selectAll()
    //   .execute();

    const proposals: Proposal[] = []; // Replace with actual query

    return { success: true, data: proposals };
  } catch (error) {
    console.error('Error fetching pending proposals:', error);
    return { success: false, error: 'Failed to fetch pending proposals' };
  }
}

export async function getSupervisorRequests(): Promise<ActionResult<SupervisorRequest[]>> {
  try {
    const admin = await verifyAdminAccess();
    if (!admin) {
      return { success: false, error: 'Unauthorized' };
    }

    // Replace with actual query
    const requests: SupervisorRequest[] = [];

    return { success: true, data: requests };
  } catch (error) {
    console.error('Error fetching supervisor requests:', error);
    return { success: false, error: 'Failed to fetch supervisor requests' };
  }
}

export async function getAllInterns(): Promise<ActionResult<Intern[]>> {
  try {
    const admin = await verifyAdminAccess();
    if (!admin) {
      return { success: false, error: 'Unauthorized' };
    }

    // Replace with actual query
    const interns: Intern[] = [];

    return { success: true, data: interns };
  } catch (error) {
    console.error('Error fetching all interns:', error);
    return { success: false, error: 'Failed to fetch all interns' };
  }
}

export async function getSupervisorRelationships(): Promise<ActionResult<SupervisorRelationship[]>> {
  try {
    const admin = await verifyAdminAccess();
    if (!admin) {
      return { success: false, error: 'Unauthorized' };
    }

    // Replace with actual query
    const relationships: SupervisorRelationship[] = [];

    return { success: true, data: relationships };
  } catch (error) {
    console.error('Error fetching supervisor relationships:', error);
    return { success: false, error: 'Failed to fetch supervisor relationships' };
  }
}

export async function getAllInternBills(): Promise<ActionResult<InternBill[]>> {
  try {
    const admin = await verifyAdminAccess();
    if (!admin) {
      return { success: false, error: 'Unauthorized' };
    }

    // Replace with actual query
    const bills: InternBill[] = [];

    return { success: true, data: bills };
  } catch (error) {
    console.error('Error fetching all intern bills:', error);
    return { success: false, error: 'Failed to fetch all intern bills' };
  }
}

// ============================================
// MUTATION ACTIONS (replacing POST action endpoints)
// ============================================

export async function approveProposal(
  proposalId: string,
  billId: string
): Promise<ActionResult> {
  try {
    const admin = await verifyAdminAccess();
    if (!admin) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!proposalId) {
      return { success: false, error: 'Proposal ID is required' };
    }

    // Replace with actual database mutation
    // await db
    //   .updateTable('proposals')
    //   .set({ status: 'approved', approvedAt: new Date(), approvedBy: admin.userId })
    //   .where('id', '=', proposalId)
    //   .execute();

    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Error approving proposal:', error);
    return { success: false, error: 'Failed to approve proposal' };
  }
}

export async function rejectProposal(proposalId: string): Promise<ActionResult> {
  try {
    const admin = await verifyAdminAccess();
    if (!admin) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!proposalId) {
      return { success: false, error: 'Proposal ID is required' };
    }

    // Replace with actual database mutation
    // await db
    //   .updateTable('proposals')
    //   .set({ status: 'rejected', rejectedAt: new Date(), rejectedBy: admin.userId })
    //   .where('id', '=', proposalId)
    //   .execute();

    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Error rejecting proposal:', error);
    return { success: false, error: 'Failed to reject proposal' };
  }
}

export async function approveUser(userId: string): Promise<ActionResult> {
  try {
    const admin = await verifyAdminAccess();
    if (!admin) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }

    // Replace with actual database mutation
    // await db
    //   .updateTable('users')
    //   .set({ status: 'approved', approvedAt: new Date() })
    //   .where('id', '=', userId)
    //   .execute();

    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Error approving user:', error);
    return { success: false, error: 'Failed to approve user' };
  }
}

export async function denyUser(userId: string): Promise<ActionResult> {
  try {
    const admin = await verifyAdminAccess();
    if (!admin) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }

    // Replace with actual database mutation
    // await db
    //   .deleteFrom('users')
    //   .where('id', '=', userId)
    //   .execute();

    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Error denying user:', error);
    return { success: false, error: 'Failed to deny user' };
  }
}

export async function approveSupervisor(userId: string): Promise<ActionResult> {
  try {
    const admin = await verifyAdminAccess();
    if (!admin) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }

    // Replace with actual database mutation
    // await db
    //   .updateTable('users')
    //   .set({ isSupervisor: true, supervisorApprovedAt: new Date() })
    //   .where('id', '=', userId)
    //   .execute();

    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Error approving supervisor:', error);
    return { success: false, error: 'Failed to approve supervisor request' };
  }
}

export async function rejectSupervisor(userId: string): Promise<ActionResult> {
  try {
    const admin = await verifyAdminAccess();
    if (!admin) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }

    // Replace with actual database mutation
    // await db
    //   .updateTable('supervisor_requests')
    //   .set({ status: 'rejected', rejectedAt: new Date() })
    //   .where('userId', '=', userId)
    //   .execute();

    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Error rejecting supervisor:', error);
    return { success: false, error: 'Failed to reject supervisor request' };
  }
}