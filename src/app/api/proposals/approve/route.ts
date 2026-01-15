import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { getSessionCookie } from '@/lib/cookies';
import { db } from '../../../../db/kysely/client';
import { updateBillStatus } from '@/services/data/legislation';
import { uuidSchema } from '@/lib/validators';

export async function POST(request: NextRequest) {
  try {
    // Validate session
    const session_token = getSessionCookie(request);
    const user = await validateSession(session_token);

    // Check if user is admin or supervisor
    if (user.role !== 'admin' && user.role !== 'supervisor') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { proposalId } = await request.json();
    const validation = uuidSchema.safeParse(proposalId);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }    

    // Get the proposal
    const proposal = await db
      .selectFrom('pending_proposals')
      .selectAll()
      .where('id', '=', proposalId)
      .where('approval_status', '=', 'pending')
      .executeTakeFirst();

    if (!proposal) {
      return NextResponse.json({ success: false, error: 'Proposal not found' }, { status: 404 });
    }

    // Update the bill status
    await updateBillStatus(proposal.bill_id, proposal.suggested_status as any);

    // Mark proposal as approved
    await db
      .updateTable('pending_proposals')
      .set({
        approval_status: 'approved',
      })
      .where('id', '=', proposalId)
      .execute();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error approving proposal:', error);
    return NextResponse.json({ success: false, error: 'Failed to approve proposal' }, { status: 500 });
  }
}
