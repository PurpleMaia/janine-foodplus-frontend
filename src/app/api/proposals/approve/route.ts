import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/kysely/client';
import { uuidSchema } from '@/lib/validators';
import { getSessionCookie, validateSession } from '@/lib/auth';
import { updateBillStatusServerAction } from '@/services/db/legislation';
import { ApiError, Errors } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    // Validate session
    const session_token = getSessionCookie(request);
    const user = await validateSession(session_token);

    // Check if user is admin or supervisor
    if (user.role !== 'admin' && user.role !== 'supervisor') {
      console.error('Unauthorized access attempt by user:', user.email, '(ADMIN/SUPERVISOR ONLY)');
      throw Errors.UNAUTHORIZED;
    }

    // Parse and validate proposalId from request body
    const { proposalId } = await request.json();

    const validation = uuidSchema.safeParse(proposalId);
    if (!validation.success) {
      console.error('[PROPOSAL APPROVAL] Failed to validate proposal ID:', proposalId);
      throw Errors.INVALID_REQUEST;
    }

    console.log('📋 [PROPOSAL APPROVAL] Approving proposal:', proposalId);

    // Get the proposal
    const proposal = await db
      .selectFrom('pending_proposals')
      .selectAll()
      .where('id', '=', proposalId)
      .where('approval_status', '=', 'pending')
      .executeTakeFirst();

    if (!proposal) {
      console.error('[PROPOSAL APPROVAL] Proposal not found or already processed for ID in DB:', proposalId);
      throw Errors.INTERNAL_ERROR;
    }

    // Update the bill status
    await updateBillStatusServerAction(proposal.bill_id, proposal.proposed_status);

    // Mark proposal as approved
    const updateResult = await db
      .updateTable('pending_proposals')
      .set({
        approval_status: 'approved',
      })
      .where('id', '=', proposalId)
      .execute();

    if (!updateResult) {
      console.error('[PROPOSAL APPROVAL] Failed to update proposal status for ID in DB:', proposalId);      
      throw Errors.INTERNAL_ERROR;
    }

    console.log('✅ [PROPOSAL APPROVAL] Successfully approved proposal:', proposalId);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ApiError) {
        return NextResponse.json(
            { error: error.message },
            { status: error.statusCode }
        );
    }
         
    // Unknown error
    console.error('[REGISTER]', error);
    return NextResponse.json(
        { error: 'Unknown Error' }, 
        { status: 500 }
    );
  }
}
