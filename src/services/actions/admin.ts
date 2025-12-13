// actions/admin.ts
'use server';

import { z } from 'zod';
import { db } from '@/db/kysely/client';
import { revalidatePath } from 'next/cache';
import { protectedAction } from './helpers';
import { nicknameSchema } from '@/lib/validators';
import { auth } from '@/lib/auth';

// ============ Data Fetching ============

export async function getAdminDashboardData() {
  const session = await auth();  
  const user = session?.user;

  if (!user) {
    return { success: false as const, error: 'Not authenticated' };
  }

  try {
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
      console.log(`📋 [LOAD PROPOSALS] Admin found ${proposals.length} pending proposals`);
    } else {
      // For regular users: get their own pending proposals (so they can see the skeleton/temporary bill)
      console.log('📋 [LOAD PROPOSALS] Loading proposals for user:', user.email, 'Role:', user.role);
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
      console.log(`📋 [LOAD PROPOSALS] Found ${proposals.length} pending proposals from database`);
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

    return {
      success: true as const,
      data: {        
        pendingProposals: formattedProposals,
      },
    };
  } catch (e) {
    console.error('getAdminDashboardData error:', e);
    return { success: false as const, error: 'Failed to fetch dashboard data' };
  }
}

// export async function getAllInterns() {
//   const session = await auth();
  
//   if (session?.user?.role !== 'admin') {
//     return { success: false as const, error: 'Admin access required' };
//   }

//   try {
//     // Get all active interns
//     const interns = await db
//       .selectFrom('user as u')
//       .leftJoin('user as s', 'u.supervisor_id', 's.id')
//       .select([
//         'u.id',
//         'u.email',
//         'u.username',
//         'u.created_at',
//         'u.account_status',
//         'u.supervisor_id',
//         's.email as supervisor_email',
//         's.username as supervisor_username',
//       ])
//       .where('u.role', '=', 'intern')
//       .where('u.account_status', '=', 'active')
//       .orderBy('u.created_at', 'desc')
//       .execute();

//     // Get adopted bills for each intern
//     const internIds = interns.map(i => i.id);
    
//     const adoptedBills = internIds.length > 0
//       ? await db
//           .selectFrom('user_bill as ub')
//           .innerJoin('bill as b', 'ub.bill_id', 'b.id')
//           .select([
//             'ub.user_id',
//             'b.id as bill_id',
//             'b.bill_number',
//             'b.bill_title',
//             'b.current_status',
//           ])
//           .where('ub.user_id', 'in', internIds)
//           .execute()
//       : [];

//     // Group bills by intern
//     const billsByIntern = adoptedBills.reduce((acc, bill) => {
//       if (!acc[bill.user_id]) acc[bill.user_id] = [];
//       acc[bill.user_id].push({
//         bill_id: bill.bill_id,
//         bill_number: bill.bill_number,
//         bill_title: bill.bill_title,
//         current_status: bill.current_status,
//       });
//       return acc;
//     }, {} as Record<string, any[]>);

//     // Combine interns with their bills
//     const internsWithBills = interns.map(intern => ({
//       id: intern.id,
//       email: intern.email,
//       username: intern.username,
//       created_at: intern.created_at,
//       account_status: intern.account_status,
//       supervisor_id: intern.supervisor_id,
//       supervisor_email: intern.supervisor_email,
//       supervisor_username: intern.supervisor_username,
//       adopted_bills: billsByIntern[intern.id] || [],
//     }));

//     return { success: true as const, data: internsWithBills };
//   } catch (e) {
//     console.error('getAllInterns error:', e);
//     return { success: false as const, error: 'Failed to fetch interns' };
//   }
// }

// export async function getSupervisorRelationships() {
//   const session = await auth();
  
//   if (session?.user?.role !== 'admin') {
//     return { success: false as const, error: 'Admin access required' };
//   }

//   try {
//     // Get all supervisors
//     const supervisors = await db
//       .selectFrom('user')
//       .select(['id', 'email', 'username'])
//       .where('role', '=', 'supervisor')
//       .execute();

//     // Get interns for each supervisor
//     const supervisorIds = supervisors.map(s => s.id);
    
//     const interns = supervisorIds.length > 0
//       ? await db
//           .selectFrom('user')
//           .select(['id', 'email', 'username', 'created_at', 'supervisor_id'])
//           .where('supervisor_id', 'in', supervisorIds)
//           .execute()
//       : [];

//     // Group interns by supervisor
//     const internsBySupervisor = interns.reduce((acc, intern) => {
//       if (!intern.supervisor_id) return acc;
//       if (!acc[intern.supervisor_id]) acc[intern.supervisor_id] = [];
//       acc[intern.supervisor_id].push({
//         id: intern.id,
//         email: intern.email,
//         username: intern.username,
//         adopted_at: intern.created_at, // or whenever they were assigned
//       });
//       return acc;
//     }, {} as Record<string, any[]>);

//     // Combine supervisors with their interns
//     const relationships = supervisors.map(supervisor => ({
//       supervisor_id: supervisor.id,
//       supervisor_email: supervisor.email,
//       supervisor_username: supervisor.username,
//       interns: internsBySupervisor[supervisor.id] || [],
//     }));

//     return { success: true as const, data: relationships };
//   } catch (e) {
//     console.error('getSupervisorRelationships error:', e);
//     return { success: false as const, error: 'Failed to fetch relationships' };
//   }
// }

// export async function getAllInternBills() {
//   const session = await auth();
  
//   if (session?.user?.role !== 'admin') {
//     return { success: false as const, error: 'Admin access required' };
//   }

//   try {
//     // Get all bills that have been adopted
//     const bills = await db
//       .selectFrom('bill as b')
//       .innerJoin('user_bill as ub', 'b.id', 'ub.bill_id')
//       .select([
//         'b.id',
//         'b.bill_number',
//         'b.bill_title',
//         'b.current_status',
//       ])
//       .groupBy(['b.id', 'b.bill_number', 'b.bill_title', 'b.current_status'])
//       .execute();

//     const billIds = bills.map(b => b.id);

//     // Get adopters for each bill
//     const adopters = billIds.length > 0
//       ? await db
//           .selectFrom('user_bill as ub')
//           .innerJoin('user as u', 'ub.user_id', 'u.id')
//           .leftJoin('user as s', 'u.supervisor_id', 's.id')
//           .select([
//             'ub.bill_id',
//             'ub.created_at as adopted_at',
//             'u.id as intern_id',
//             'u.email as intern_email',
//             'u.username as intern_username',
//             's.id as supervisor_id',
//             's.email as supervisor_email',
//             's.username as supervisor_username',
//           ])
//           .where('ub.bill_id', 'in', billIds)
//           .execute()
//       : [];

//     // Get pending proposals for each bill
//     const proposals = billIds.length > 0
//       ? await db
//           .selectFrom('proposal as p')
//           .innerJoin('user as u', 'p.proposed_by', 'u.id')
//           .select([
//             'p.id as proposal_id',
//             'p.bill_id',
//             'p.current_status',
//             'p.suggested_status',
//             'p.created_at as proposed_at',
//             'u.id as intern_id',
//             'u.email as intern_email',
//           ])
//           .where('p.bill_id', 'in', billIds)
//           .where('p.status', '=', 'pending')
//           .execute()
//       : [];

//     // Group by bill
//     const adoptersByBill = adopters.reduce((acc, a) => {
//       if (!acc[a.bill_id]) acc[a.bill_id] = [];
//       acc[a.bill_id].push({
//         intern_id: a.intern_id,
//         intern_email: a.intern_email,
//         intern_username: a.intern_username,
//         supervisor_id: a.supervisor_id,
//         supervisor_email: a.supervisor_email,
//         supervisor_username: a.supervisor_username,
//         adopted_at: a.adopted_at,
//       });
//       return acc;
//     }, {} as Record<string, any[]>);

//     const proposalsByBill = proposals.reduce((acc, p) => {
//       if (!acc[p.bill_id]) acc[p.bill_id] = [];
//       acc[p.bill_id].push({
//         proposal_id: p.proposal_id,
//         intern_id: p.intern_id,
//         intern_email: p.intern_email,
//         current_status: p.current_status,
//         suggested_status: p.suggested_status,
//         proposed_at: p.proposed_at,
//       });
//       return acc;
//     }, {} as Record<string, any[]>);

//     // Combine everything
//     const billsWithDetails = bills.map(bill => ({
//       bill: {
//         id: bill.id,
//         bill_number: bill.bill_number,
//         bill_title: bill.bill_title,
//         current_status: bill.current_status,
//       },
//       adopted_by: adoptersByBill[bill.id] || [],
//       pending_proposals: proposalsByBill[bill.id] || [],
//     }));

//     return { success: true as const, data: billsWithDetails };
//   } catch (e) {
//     console.error('getAllInternBills error:', e);
//     return { success: false as const, error: 'Failed to fetch bills' };
//   }
// }

// // ============ Mutations ============

// export async function approveUser(input: z.infer<typeof userIdSchema>) {
//   return roleAction('admin', userIdSchema, input, async (data) => {
//     await db
//       .updateTable('user')
//       .set({ account_status: 'active' })
//       .where('id', '=', data.userId)
//       .execute();
    
//     revalidatePath('/');
//     return { approved: true };
//   });
// }

// export async function denyUser(input: z.infer<typeof userIdSchema>) {
//   return roleAction('admin', userIdSchema, input, async (data) => {
//     await db
//       .updateTable('user')
//       .set({ account_status: 'denied' })
//       .where('id', '=', data.userId)
//       .execute();
    
//     revalidatePath('/');
//     return { denied: true };
//   });
// }

// export async function approveSupervisorRequest(input: z.infer<typeof userIdSchema>) {
//   return roleAction('admin', userIdSchema, input, async (data) => {
//     await db
//       .updateTable('user')
//       .set({ 
//         role: 'supervisor',
//         requested_supervisor: false,
//       })
//       .where('id', '=', data.userId)
//       .execute();
    
//     revalidatePath('/');
//     return { approved: true };
//   });
// }

// export async function rejectSupervisorRequest(input: z.infer<typeof userIdSchema>) {
//   return roleAction('admin', userIdSchema, input, async (data) => {
//     await db
//       .updateTable('user')
//       .set({ requested_supervisor: false })
//       .where('id', '=', data.userId)
//       .execute();
    
//     revalidatePath('/');
//     return { rejected: true };
//   });
// }

// export async function approveProposal(input: z.infer<typeof proposalIdSchema>) {
//   return roleAction('admin', proposalIdSchema, input, async (data, user) => {
//     // First get the proposal
//     const proposal = await db
//       .selectFrom('proposal')
//       .select(['id', 'bill_id', 'suggested_status'])
//       .where('id', '=', data.proposalId)
//       .executeTakeFirst();
    
//     if (!proposal) {
//       throw new Error('Proposal not found');
//     }

//     // Use transaction for atomic updates
//     await db.transaction().execute(async (trx) => {
//       // Update bill status
//       await trx
//         .updateTable('bill')
//         .set({ current_status: proposal.suggested_status })
//         .where('id', '=', proposal.bill_id)
//         .execute();
      
//       // Mark proposal as approved
//       await trx
//         .updateTable('proposal')
//         .set({ 
//           status: 'approved',
//           approved_by: user.id,
//           approved_at: new Date(),
//         })
//         .where('id', '=', data.proposalId)
//         .execute();
//     });
    
//     revalidatePath('/');
//     return { approved: true };
//   });
// }

// export async function rejectProposal(input: z.infer<typeof proposalIdSchema>) {
//   return roleAction('admin', proposalIdSchema, input, async (data, user) => {
//     await db
//       .updateTable('proposal')
//       .set({ 
//         status: 'rejected',
//         rejected_by: user.id,
//         rejected_at: new Date(),
//       })
//       .where('id', '=', data.proposalId)
//       .execute();
    
//     revalidatePath('/');
//     return { rejected: true };
//   });
// }