import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/kysely/client';
import { uuidSchema } from '@/lib/validators';
import { getSessionCookie, validateSession } from '@/lib/auth';
import { updateBillStatusServerAction } from '@/services/db/legislation';

export async function POST(request: NextRequest) {
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

    // Check if user is admin or supervisor
    if (user.role !== 'admin' && user.role !== 'supervisor') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    // Parse and validate proposalId from request body
    const { proposalId } = await request.json();

    const validation = uuidSchema.safeParse(proposalId);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: 'Invalid proposal ID' }, { status: 400 });
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
    await updateBillStatusServerAction(proposal.bill_id, proposal.suggested_status as any);

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
