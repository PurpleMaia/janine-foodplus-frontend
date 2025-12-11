import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie, validateSession } from '@/lib/simple-auth';
import { db } from '../../../../db/kysely/client';

export async function GET(request: NextRequest) {
  try {
    // Validate session
    const session_token = getSessionCookie(request);
    if (!session_token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const user = await validateSession(session_token);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    // Get all users for supervisors to choose from
    if (user.role === 'supervisor') {
      const users = await db
        .selectFrom('user')
        .select(['id', 'email', 'username', 'role'])
        .where('role', '=', 'user') // Only regular users can be adopted
        .where('account_status', '=', 'active')
        .execute();

      // Get already adopted users by this supervisor
      const adopted = await db
        .selectFrom('supervisor_users')
        .select(['user_id'])
        .where('supervisor_id', '=', user.id)
        .execute();

      const adoptedIds = new Set(adopted.map((a: any) => a.user_id));

      // Filter out already adopted users
      const availableUsers = users.filter((u: any) => !adoptedIds.has(u.id));

      return NextResponse.json({ success: true, users: availableUsers });
    }

    // For regular users/admins, just return all users
    const users = await db
      .selectFrom('user')
      .select(['id', 'email', 'username', 'role'])
      .where('role', '=', 'user')
      .where('account_status', '=', 'active')
      .execute();

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
  }
}

