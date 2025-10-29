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
    if (!user || user.role !== 'supervisor') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Supervisor access only' }, { status: 403 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    // Remove adoption relationship
    const result = await (db as any)
      .deleteFrom('supervisor_users')
      .where('supervisor_id', '=', user.id)
      .where('user_id', '=', userId)
      .execute();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error dropping adoptee:', error);
    return NextResponse.json({ success: false, error: 'Failed to drop adoptee' }, { status: 500 });
  }
}

