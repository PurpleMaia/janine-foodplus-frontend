import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie, validateSession } from '@/lib/simple-auth';
import { db } from '../../../../db/kysely/client';

export async function POST(request: NextRequest) {
  try {
    // Validate session
    const session_token = getSessionCookie(request);
    if (!session_token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const user = await validateSession(session_token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin access only' }, { status: 403 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    // Reject the supervisor request by clearing the flag
    const result = await db
      .updateTable('user')
      .set({ requested_supervisor: false })
      .where('id', '=', userId)
      .where('requested_supervisor', '=', true)
      .executeTakeFirst();

    if (result.numUpdatedRows === BigInt(0)) {
      return NextResponse.json({ success: false, error: 'User not found or not requesting supervisor access' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error rejecting supervisor request:', error);
    return NextResponse.json({ success: false, error: 'Failed to reject supervisor request' }, { status: 500 });
  }
}

