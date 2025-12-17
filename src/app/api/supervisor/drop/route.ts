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
    if (!user || user.role !== 'supervisor') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Supervisor access only' }, { status: 403 });
    }

    const { userId } = await request.json();
    const validation = uuidSchema.safeParse(userId);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: 'Invalid User ID format' }, { status: 400 });
    }

    // Remove adoption relationship
    const result = await db
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