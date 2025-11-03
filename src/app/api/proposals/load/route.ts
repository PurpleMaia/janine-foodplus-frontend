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
      proposals = await (db as any)
        .selectFrom('pending_proposals')
        .innerJoin('supervisor_users', 'pending_proposals.user_id', 'supervisor_users.user_id')
        .selectAll('pending_proposals')
        .where('supervisor_users.supervisor_id', '=', user.id)
        .where('pending_proposals.approval_status', '=', 'pending')
        .execute();
    } else if (user.role === 'admin') {
      // For admins: get ALL pending proposals (they can approve/reject any proposal)
      console.log('📋 Admin loading all pending proposals...');
      proposals = await (db as any)
        .selectFrom('pending_proposals')
        .selectAll('pending_proposals')
        .where('pending_proposals.approval_status', '=', 'pending')
        .execute();
      console.log(`✅ Admin found ${proposals.length} pending proposals`);
    } else {
      // For regular users: get their own pending proposals (so they can see the skeleton/temporary bill)
      proposals = await (db as any)
        .selectFrom('pending_proposals')
        .selectAll('pending_proposals')
        .where('pending_proposals.user_id', '=', user.id)
        .where('pending_proposals.approval_status', '=', 'pending')
        .execute();
    }

    // Format proposals to match TempBill interface
    const formatted = proposals.map((p: any) => ({
      id: p.bill_id,
      current_status: p.current_status,
      suggested_status: p.suggested_status,
      target_idx: 0, // Not needed for display
      source: 'human' as const,
      approval_status: 'pending' as const,
      proposed_by: {
        user_id: p.proposed_by_user_id,
        role: 'intern',
        at: new Date(p.proposed_at).toISOString(),
        note: p.note || undefined,
      },
      proposalId: p.id, // Store actual proposal ID for approve/reject
    }));

    return NextResponse.json({ success: true, proposals: formatted });
  } catch (error) {
    console.error('Error loading proposals:', error);
    return NextResponse.json({ success: false, error: 'Failed to load proposals' }, { status: 500 });
  }
}
