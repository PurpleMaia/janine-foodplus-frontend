import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie, validateSession } from '@/lib/auth';
import { db } from '@/db/kysely/client';
import { ApiError, Errors } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    // Validate session
    const session_token = getSessionCookie(request);    
    const user = await validateSession(session_token);
    if (user.role !== 'admin') {
      console.error('[REJECT SUPERVISOR] Unauthorized access attempt by user:', user.email, '(ADMIN ONLY)');
      throw Errors.UNAUTHORIZED;
    }

    // Reject the supervisor request by clearing the flag
    console.log('📋 [REJECT SUPERVISOR] Rejecting supervisor request for user ID:', user.id);

    const result = await db
      .updateTable('user')
      .set({ requested_supervisor: false })
      .where('id', '=', user.id)
      .where('requested_supervisor', '=', true)
      .executeTakeFirst();

    if (!result || result.numUpdatedRows === BigInt(0)) {
      console.error('[REJECT SUPERVISOR] No pending supervisor request found for user ID:', user.id);
      throw Errors.INTERNAL_ERROR;
    }

    console.log('✅ [REJECT SUPERVISOR] Supervisor request rejected for user ID:', user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    // Unknown error
    console.error('[SUPERVISOR/REJECT] Unknown error:', error);
    return NextResponse.json(
      { error: 'Unknown Error' },
      { status: 500 }
    );
  }
}

