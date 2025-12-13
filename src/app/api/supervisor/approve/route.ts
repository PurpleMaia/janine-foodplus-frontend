import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie, validateSession } from '@/lib/auth';
import { db } from '@/db/kysely/client';
import { uuidSchema } from '@/lib/validators';
import { ApiError, Errors } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    // Validate session
    const session_token = getSessionCookie(request);    
    const user = await validateSession(session_token);
    if (user.role !== 'admin') {
      console.error('[APPROVE SUPERVISOR] Unauthorized access attempt by user:', user.email, '(ADMIN ONLY)');
      throw Errors.UNAUTHORIZED;
    }

    // Parse and validate userId from request body
    const { userId } = await request.json();

    const validation = uuidSchema.safeParse(userId);
    if (!validation.success) {
      console.error('[APPROVE SUPERVISOR] Failed to validate user ID:', userId);
      throw Errors.INVALID_REQUEST;
    }

    // Promote user to supervisor and reset request flag
    console.log('📋 [APPROVE SUPERVISOR] Approving supervisor request for user ID:', userId);

    const result = await db
      .updateTable('user')
      .set({ 
        role: 'supervisor',
        requested_supervisor: false 
      })
      .where('id', '=', userId)
      .where('requested_supervisor', '=', true)
      .executeTakeFirst();

    if (!result || result.numUpdatedRows === BigInt(0)) {
      console.error('[APPROVE SUPERVISOR] No pending supervisor request found for user ID:', userId);
      throw Errors.INTERNAL_ERROR;
    }

    console.log('✅ [APPROVE SUPERVISOR] Supervisor request approved for user ID:', userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    console.error('[APPROVE SUPERVISOR] Unknown error:', error);
    return NextResponse.json(
      { error: 'Unknown Error' },
      { status: 500 }
    );
  }
}

