import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie, validateSession } from '@/lib/auth';
import { db } from '@/db/kysely/client';
import { proposalSchema } from '@/lib/validators';
import crypto from 'crypto';
import { ApiError, Errors } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    // Validate session
    const session_token = getSessionCookie(request);    
    const user = await validateSession(session_token);    

    // Parse and validate request body
    const { billId, currentStatus, suggestedStatus, note } = await request.json();

    const validation = proposalSchema.safeParse({ billId, currentStatus, suggestedStatus, note });
    if (!validation.success) {
      console.error('[SAVE PROPOSAL] Proposal validation failed:', validation.error);
      throw Errors.INVALID_REQUEST;
    }

    console.log('💾 [SAVE PROPOSAL] User:', user.email, 'Role:', user.role);
    console.log('💾 [SAVE PROPOSAL] Bill ID:', billId);
    console.log('💾 [SAVE PROPOSAL] Status change:', currentStatus, '→', suggestedStatus);

    // Check if proposal already exists (by user_id and bill_id, regardless of approval status)
    const existing = await db
      .selectFrom('pending_proposals')
      .selectAll()
      .where('bill_id', '=', billId)
      .where('proposed_by_user_id', '=', user.id)
      .executeTakeFirst();

    if (existing) {
      console.log('💾 [SAVE PROPOSAL] Updating existing proposal:', existing.id);
      // Update existing proposal (reuse the same proposal for this user/bill combo)
      const updateResult = await db
        .updateTable('pending_proposals')
        .set({
          proposed_status: suggestedStatus,
          current_status: currentStatus,
          approval_status: 'pending', // Reset to pending
          proposed_at: new Date(),
          note: note || null,
        })
        .where('id', '=', existing.id)
        .execute();
      
      if (!updateResult) {
        console.error('[SAVE PROPOSAL] Failed to update existing proposal:', existing.id);
        throw Errors.INTERNAL_ERROR;
      }

      return NextResponse.json({ success: true, proposalId: existing.id });
    }

    // Create new proposal
    const proposalId = crypto.randomUUID();
    console.log('💾 [SAVE PROPOSAL] Creating new proposal:', proposalId);
    const insertResult = await db
      .insertInto('pending_proposals')
      .values({
        id: proposalId,
        bill_id: billId,
        proposed_by_user_id: user.id,
        proposed_status: suggestedStatus,
        current_status: currentStatus,
        proposed_at: new Date(),
        approval_status: 'pending',
        note: note || null,
      })
      .execute();
    if (!insertResult) {
      console.error('[SAVE PROPOSAL] Failed to insert new proposal into database');
      throw Errors.INTERNAL_ERROR;
    }

    console.log('✅ [SAVE PROPOSAL] Successfully saved proposal:', proposalId);
    return NextResponse.json({ success: true, proposalId });
  } catch (error) {
    if (error instanceof ApiError) {
        return NextResponse.json(
            { error: error.message },
            { status: error.statusCode }
        );
    }
         
    // Unknown error
    console.error('[PROPOSALS/SAVE]', error);
    return NextResponse.json(
        { error: 'Unknown Error' }, 
        { status: 500 }
    );
  }
}
