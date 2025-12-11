import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie, validateSession } from '@/lib/simple-auth';
import { db } from '../../../../db/kysely/client';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Validate session
    const session_token = getSessionCookie(request);
    if (!session_token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const user = await validateSession(session_token);
    if (!user || user.role !== 'supervisor') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Supervisor access only' }, { status: 403 });
    }

    const { userId: internId } = await request.json();

    if (!internId) {
      return NextResponse.json({ success: false, error: 'Intern user ID is required' }, { status: 400 });
    }

    // Check if user exists and is a regular user
    const internUser = await db
      .selectFrom('user')
      .selectAll()
      .where('id', '=', internId)
      .executeTakeFirst();

    if (!internUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (internUser.role !== 'user') {
      return NextResponse.json({ success: false, error: 'User must be a regular user to be adopted' }, { status: 400 });
    }

    // Check if already adopted
    const existing = await db
      .selectFrom('supervisor_users')
      .selectAll()
      .where('supervisor_id', '=', user.id)
      .where('user_id', '=', internId)
      .executeTakeFirst();

    if (existing) {
      return NextResponse.json({ success: false, error: 'User already adopted by this supervisor' }, { status: 400 });
    }

    // Create adoption relationship
    const adoptionId = crypto.randomUUID();
    await db
      .insertInto('supervisor_users')
      .values({
        id: adoptionId,
        supervisor_id: user.id,
        user_id: internId,
        created_at: new Date(),
      })
      .execute();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adopting intern:', error);
    return NextResponse.json({ success: false, error: 'Failed to adopt intern' }, { status: 500 });
  }
}

