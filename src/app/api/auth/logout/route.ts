import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie, deleteSession, clearSessionCookie } from '@/lib/simple-auth';

export async function POST(request: NextRequest) {
  try {
    //Gets session ID from cookie
    const sessionId = getSessionCookie(request);
    
    //Delete session from database
    if (sessionId) {
      // Delete session from database
      await deleteSession(sessionId);
    }

    // Clear session cookie
    //Clears cookie in browser
    const clearCookie = clearSessionCookie();

    return NextResponse.json(
      { success: true },
      {
        status: 200,
        headers: {
          'Set-Cookie': clearCookie, //clears session cookie
        },
      }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
