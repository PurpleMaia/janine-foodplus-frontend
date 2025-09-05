import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie, validateSession } from '@/lib/simple-auth';

export async function GET(request: NextRequest) {
  try {
    //gets session token from cookie 
    const session_token = getSessionCookie(request);
    console.log('Session token from cookie:', session_token);
    
    //if there is no cookie, user is not logged in
    if (!session_token) {
      return NextResponse.json({ user: null });
    }

    //validates session in the databse 
    const user = await validateSession(session_token);
    console.log('Validated user from session token:', user);
    

    //returns user info if valid, null if invalid
    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user: { id: user.id, email: user.email, role: user.role, username: user.username } });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({ user: null });
  }
}
