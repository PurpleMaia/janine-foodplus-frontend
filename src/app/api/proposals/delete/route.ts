import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { getSessionCookie } from '@/lib/cookies';
import { db } from '../../../../db/kysely/client';
import { uuidSchema } from '@/lib/validators';

export async function POST(request: NextRequest) {
  try {
    // Validate session
    const session_token = getSessionCookie(request);
    const user = await validateSession(session_token);

    const { billId, proposalId } = await request.json();

    // Allow deletion by either proposalId or billId
    let proposalToDelete;

    if (proposalId) {
      const validation = uuidSchema.safeParse(proposalId);
      if (!validation.success) {
        return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
      }

      // Find the proposal by ID
      proposalToDelete = await db
        .selectFrom('pending_proposals')
        .selectAll()
        .where('id', '=', proposalId)
        .executeTakeFirst();
    } else if (billId) {
      const validation = uuidSchema.safeParse(billId);
      if (!validation.success) {
        return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
      }

      // Find the proposal by bill_id and user_id
      proposalToDelete = await db
        .selectFrom('pending_proposals')
        .selectAll()
        .where('bill_id', '=', billId)
        .where('proposed_by_user_id', '=', user.id)
        .executeTakeFirst();
    } else {
      return NextResponse.json(
        { success: false, error: 'Must provide either proposalId or billId' },
        { status: 400 }
      );
    }

    if (!proposalToDelete) {
      return NextResponse.json({ success: false, error: 'Proposal not found' }, { status: 404 });
    }

    // Verify that the user owns this proposal (only allow users to delete their own proposals)
    if (proposalToDelete.proposed_by_user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'You can only delete your own proposals' },
        { status: 403 }
      );
    }

    console.log('🗑️ [DELETE PROPOSAL] User:', user.email, 'deleting proposal:', proposalToDelete.id);
    console.log('🗑️ [DELETE PROPOSAL] Bill ID:', proposalToDelete.bill_id);
    console.log('🗑️ [DELETE PROPOSAL] Status change:', proposalToDelete.current_status, '→', proposalToDelete.proposed_status);

    // Delete the proposal (hard delete)
    await db
      .deleteFrom('pending_proposals')
      .where('id', '=', proposalToDelete.id)
      .execute();

    console.log('✅ [DELETE PROPOSAL] Successfully deleted proposal');
    return NextResponse.json({
      success: true,
      proposalId: proposalToDelete.id,
      currentStatus: proposalToDelete.current_status
    });
  } catch (error) {
    console.error('Error deleting proposal:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete proposal' }, { status: 500 });
  }
}
