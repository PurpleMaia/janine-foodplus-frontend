import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie, validateSession } from '@/lib/auth';
import { db } from '../../../../db/kysely/client';
import { uuidSchema } from '@/lib/validators';

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

    // Parse and validate userId from request body
    const { userId } = await request.json();

    const validation = uuidSchema.safeParse(userId);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: 'Invalid user ID' }, { status: 400 });
    }

    // Promote user to supervisor and reset request flag
    const result = await db
      .updateTable('user')
      .set({ 
        role: 'supervisor',
        requested_supervisor: false 
      })
      .where('id', '=', userId)
      .where('requested_supervisor', '=', true)
      .executeTakeFirst();

    if (result.numUpdatedRows === BigInt(0)) {
      return NextResponse.json({ success: false, error: 'User not found or not requesting supervisor access' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error approving supervisor request:', error);
    return NextResponse.json({ success: false, error: 'Failed to approve supervisor request' }, { status: 500 });
  }
}

