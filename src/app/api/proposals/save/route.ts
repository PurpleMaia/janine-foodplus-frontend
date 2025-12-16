import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { getSessionCookie } from '@/lib/cookies';
import { db } from '../../../../db/kysely/client';
import crypto from 'crypto';
import { proposalSchema } from '@/lib/validators';

export async function POST(request: NextRequest) {
  try {
    // Validate session
    const session_token = getSessionCookie(request);
    const user = await validateSession(session_token);

    const { billId, currentStatus, suggestedStatus, note } = await request.json();
    const validation = proposalSchema.safeParse({ billId, currentStatus, suggestedStatus, note });
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    console.log('💾 [SAVE PROPOSAL] User:', user.email, 'Role:', user.role);
    console.log('💾 [SAVE PROPOSAL] Bill ID:', billId);
    console.log('💾 [SAVE PROPOSAL] Status change:', currentStatus, '→', suggestedStatus);    

    // Check if proposal already exists (by user_id and bill_id, regardless of approval status)
    // Use (db as any) to bypass Kysely type checking for snake_case columns
    const existing = await db
      .selectFrom('pending_proposals')
      .selectAll()
      .where('bill_id', '=', billId)
      .where('user_id', '=', user.id)
      .executeTakeFirst();

    if (existing) {
      console.log('💾 [SAVE PROPOSAL] Updating existing proposal:', existing.id);
      // Update existing proposal (reuse the same proposal for this user/bill combo)
      await db
        .updateTable('pending_proposals')
        .set({
          suggested_status: suggestedStatus,
          current_status: currentStatus,
          approval_status: 'pending', // Reset to pending
          proposed_at: new Date(),
          note: note || null,
        })
        .where('id', '=', existing.id)
        .execute();

      return NextResponse.json({ success: true, proposalId: existing.id });
    }

    // Create new proposal
    const proposalId = crypto.randomUUID();
    console.log('💾 [SAVE PROPOSAL] Creating new proposal:', proposalId);
    await db
      .insertInto('pending_proposals')
      .values({
        id: proposalId,
        bill_id: billId,
        proposed_by_user_id: user.id,
        user_id: user.id,
        suggested_status: suggestedStatus,
        current_status: currentStatus,
        proposed_at: new Date(),
        approval_status: 'pending',
        note: note || null,
      })
      .execute();

    console.log('✅ [SAVE PROPOSAL] Successfully saved proposal:', proposalId);
    return NextResponse.json({ success: true, proposalId });
  } catch (error) {
    console.error('Error saving proposal:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to save proposal',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
