import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie, deleteSession, getClearSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    //Gets session token from cookie
    const token = getSessionCookie(request);
    
    //Delete session from database
    if (token) {
      await deleteSession(token);
    }

    // Clear session cookie
    const clearCookie = getClearSessionCookie();

    return NextResponse.json(
      { success: true },
      {
        status: 200,
        headers: {
          'Set-Cookie': clearCookie, // set to the cleared session cookie
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
