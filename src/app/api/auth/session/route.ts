import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie, validateSession } from '@/lib/simple-auth';

export async function GET(request: NextRequest) {
  try {
    const session_token = getSessionCookie(request);
    if (!session_token) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const user = await validateSession(session_token);
    if (user) {
      console.log('🔍 [DEBUG] Session API - Returning user:', { email: user.email, role: user.role, id: user.id });
      return NextResponse.json({ user }, { status: 200 });
    } else {
      return NextResponse.json({ user: null }, { status: 200 });
    }
  } catch (error) {
    console.error('Error in session API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

