import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { getSessionCookie } from '@/lib/cookies';
import { db } from '../../../../db/kysely/client';
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

    // Mark proposal as rejected (soft delete by changing status)
    await db
      .updateTable('pending_proposals')
      .set({
        approval_status: 'rejected',
      })
      .where('id', '=', proposalId)
      .execute();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error rejecting proposal:', error);
    return NextResponse.json({ success: false, error: 'Failed to reject proposal' }, { status: 500 });
  }
}
