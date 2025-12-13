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

    // Check if user is admin or supervisor
    if (user.role !== 'admin' && user.role !== 'supervisor') {
      console.error('[PROPOSAL REJECT] Unauthorized access attempt by user:', user.email, '(ADMIN/SUPERVISOR ONLY)');
      throw Errors.UNAUTHORIZED;
    }

    // Parse and validate proposalId from request body
    const { proposalId } = await request.json();

    const validation = uuidSchema.safeParse(proposalId);
    if (!validation.success) {
      console.error('[PROPOSAL REJECT] Failed to validate proposal ID:', proposalId);
      throw Errors.INVALID_REQUEST;
    }

    console.log('📋 [PROPOSAL REJECT] Rejecting proposal:', proposalId);
    
    // Mark proposal as rejected (soft delete by changing status)
    const updateResult = await db
    .updateTable('pending_proposals')
    .set({
      approval_status: 'rejected',
    })
    .where('id', '=', proposalId)
    .execute();
    
    if (!updateResult) {
      console.error('[PROPOSAL REJECT] Failed to update proposal status for ID in DB:', proposalId);
      throw Errors.INTERNAL_ERROR;
    }

    console.log('✅ [PROPOSAL REJECT] Successfully rejected proposal:', proposalId);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ApiError) {
        return NextResponse.json(
            { error: error.message },
            { status: error.statusCode }
        );
    }

    // Unknown error
    console.error('[PROPOSALS/REJECT]', error);
    return NextResponse.json(
        { error: 'Unknown Error' },
        { status: 500 }
    );
  }
}
