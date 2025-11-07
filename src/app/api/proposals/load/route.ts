import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie, validateSession } from '@/lib/simple-auth';
import { db } from '../../../../../db/kysely/client';
import { sql } from 'kysely';

export async function GET(request: NextRequest) {
  try {
    // Validate session
    const session_token = getSessionCookie(request);
    if (!session_token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const user = await validateSession(session_token);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    let proposals;

    if (user.role === 'supervisor') {
      // For supervisors: get proposals from adopted interns
      // Join on proposed_by_user_id (the intern who made the proposal)
      proposals = await db
        .selectFrom('pending_proposals')
        .innerJoin('supervisor_users', 'pending_proposals.proposed_by_user_id', 'supervisor_users.user_id')
        .leftJoin('user as proposer', (join: any) =>
          join.on(sql`pending_proposals.proposed_by_user_id::uuid = proposer.id`)
        )
        .leftJoin('bills', (join: any) =>
          join.on(sql`pending_proposals.bill_id::uuid = bills.id`)
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
      console.log('📋 Admin loading all pending proposals...');
      proposals = await db
        .selectFrom('pending_proposals')
        .leftJoin('user as proposer', (join: any) =>
          join.on(sql`pending_proposals.proposed_by_user_id::uuid = proposer.id`)
        )
        .leftJoin('bills', (join: any) =>
          join.on(sql`pending_proposals.bill_id::uuid = bills.id`)
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
      console.log(`✅ Admin found ${proposals.length} pending proposals`);
    } else {
      // For regular users: get their own pending proposals (so they can see the skeleton/temporary bill)
      console.log('📋 [LOAD PROPOSALS] Loading proposals for user:', user.email, 'Role:', user.role);
      proposals = await db
        .selectFrom('pending_proposals')
        .leftJoin('user as proposer', (join: any) =>
          join.on(sql`pending_proposals.proposed_by_user_id::uuid = proposer.id`)
        )
        .leftJoin('bills', (join: any) =>
          join.on(sql`pending_proposals.bill_id::uuid = bills.id`)
        )
        .selectAll('pending_proposals')
        .select([
          'proposer.username as proposer_username',
          'proposer.email as proposer_email',
          'proposer.role as proposer_role',
          'bills.bill_number',
          'bills.bill_title',
        ])
        .where('pending_proposals.user_id', '=', user.id)
        .where('pending_proposals.approval_status', '=', 'pending')
        .execute();
      console.log(`📋 [LOAD PROPOSALS] Found ${proposals.length} pending proposals from database`);
      proposals.forEach((p: any, idx: number) => {
        console.log(`  [${idx + 1}] Bill ID: ${p.bill_id}, Status: ${p.current_status} → ${p.suggested_status}, Proposal ID: ${p.id}`);
      });
    }

    // Format proposals to match TempBill interface
    const formatted = proposals.map((p: any) => ({
      id: p.bill_id,
      bill_id: p.bill_id,
      bill_number: p.bill_number ?? undefined,
      bill_title: p.bill_title ?? undefined,
      current_status: p.current_status,
      suggested_status: p.suggested_status,
      proposed_status: p.suggested_status,
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

    console.log(`✅ [LOAD PROPOSALS] Returning ${formatted.length} formatted proposals`);
    return NextResponse.json({ success: true, proposals: formatted });
  } catch (error) {
    console.error('Error loading proposals:', error);
    return NextResponse.json({ success: false, error: 'Failed to load proposals' }, { status: 500 });
  }
}
