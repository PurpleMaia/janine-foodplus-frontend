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

    // Update user to request supervisor access
    const result = await db
      .updateTable('user')
      .set({ requested_supervisor: true })
      .where('id', '=', user.id)
      .where('role', '!=', 'supervisor') // Prevent already supervisors from requesting
      .executeTakeFirst();

    if (result.numUpdatedRows === BigInt(0)) {
      return NextResponse.json({ success: false, error: 'Already a supervisor or request already pending' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error requesting supervisor access:', error);
    return NextResponse.json({ success: false, error: 'Failed to request supervisor access' }, { status: 500 });
  }
}

