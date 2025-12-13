import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie, validateSession } from '@/lib/auth';
import { db } from '@/db/kysely/client';
import { ApiError, Errors } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    // Validate session
    const session_token = getSessionCookie(request);    
    const user = await validateSession(session_token);
    if (!user || user.role !== 'admin') {
      console.error('[PENDING SUPERVISOR REQUESTS] Unauthorized access attempt by user:', user?.email || 'unknown', '(ADMIN ONLY)');
      return Errors.UNAUTHORIZED;
    }

    console.log('📋 [PENDING SUPERVISOR REQUESTS] Loading all pending supervisor requests...');

    // Get all users who requested supervisor access
    const pendingRequests = await db
      .selectFrom('user')
      .selectAll()
      .where('requested_supervisor', '=', true)
      .where('role', '!=', 'supervisor') // Exclude users already promoted
      .execute();    

    console.log(`✅ [PENDING SUPERVISOR REQUESTS] Found ${pendingRequests.length} pending requests`);
    return NextResponse.json({ success: true, requests: pendingRequests });
  } catch (error) {
    if (error instanceof ApiError) {
        return NextResponse.json(
            { error: error.message },
            { status: error.statusCode }
        );
    }
         
    // Unknown error
    console.error('[SUPERVISOR/PENDING-REQUESTS]', error);
    return NextResponse.json(
        { error: 'Unknown Error' }, 
        { status: 500 }
    );
  }
}

