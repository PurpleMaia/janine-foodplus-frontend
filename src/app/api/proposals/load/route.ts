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

    // Get pending proposals for bills owned by the user (supervisor/admin)
    // Cast bill_id to UUID to match user_bills.bill_id type
    const proposals = await db
      .selectFrom('pending_proposals as pp')
      .innerJoin('user_bills as ub', (join) =>
        join.on(sql`CAST(pp.bill_id AS UUID)`, '=', sql`ub.bill_id`)
      )
      .select([
        'pp.id',
        'pp.bill_id',
        'pp.suggested_status',
        'pp.current_status',
        'pp.proposed_at',
        'pp.note',
        'pp.proposed_by_user_id',
      ])
      .where('ub.user_id', '=', user.id) // Bills owned by the current user
      .where('pp.approval_status', '=', 'pending')
      .execute();

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
