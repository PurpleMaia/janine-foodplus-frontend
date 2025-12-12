import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie, validateSession } from '@/lib/auth';
import { getUsersByIds } from '@/services/db/users';
import { usersSchema } from '@/lib/validators';

export async function POST(request: NextRequest) {
  try {
    // Verify session
    const session_token = getSessionCookie(request);
    if (!session_token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await validateSession(session_token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Only allow admins and supervisors
    if (user.role !== 'admin' && user.role !== 'supervisor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Parse user IDs from request body
    const { userIds } = await request.json();

    const validation = usersSchema.safeParse({ userIds });
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const users = await getUsersByIds(userIds);
    
    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
