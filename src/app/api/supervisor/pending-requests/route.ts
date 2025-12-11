import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie, validateSession } from '@/lib/simple-auth';
import { db } from '../../../../db/kysely/client';

export async function GET(request: NextRequest) {
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

    // Get all users who requested supervisor access
    const pendingRequests = await db
      .selectFrom('user')
      .selectAll()
      .where('requested_supervisor', '=', true)
      .where('role', '!=', 'supervisor') // Exclude users already promoted
      .execute();

    return NextResponse.json({ success: true, requests: pendingRequests });
  } catch (error) {
    console.error('Error fetching pending supervisor requests:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch pending requests' }, { status: 500 });
  }
}

