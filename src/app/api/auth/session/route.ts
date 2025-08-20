import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie, validateSession } from '@/lib/simple-auth';

export async function GET(request: NextRequest) {
  try {
    const sessionId = getSessionCookie(request);
    
    if (!sessionId) {
      return NextResponse.json({ user: null });
    }

    const user = await validateSession(sessionId);
    
    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({ user: null });
  }
}
