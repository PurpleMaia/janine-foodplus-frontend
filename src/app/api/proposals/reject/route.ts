import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie, validateSession } from '@/lib/simple-auth';
import { db } from '../../../../../db/kysely/client';

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

    const { proposalId } = await request.json();

    if (!proposalId) {
      return NextResponse.json({ success: false, error: 'Missing proposal ID' }, { status: 400 });
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
