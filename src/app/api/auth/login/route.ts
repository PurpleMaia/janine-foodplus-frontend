import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, createSession, setSessionCookie } from '@/lib/simple-auth';

export async function POST(request: NextRequest) {
  try {
    // retrieve email/username and password from request body
    const { authString, password } = await request.json();

    //validates input
    if (!authString || !password) {
      return NextResponse.json(
        { error: 'Email/Username and password are required' },
        { status: 400 }
      );
    }

    // Authenticate user
    try {
      const user = await authenticateUser(authString, password);
      // creates new session in database
      const token = await createSession(user.id);
      console.log('Created session token:', token);
  
  
      // Returns success with user info AND sets cookie
      return NextResponse.json(
        { success: true, user: { id: user.id, email: user.email, role: user.role, username: user.username } },
        {
          status: 200,
          headers: {
            'Set-Cookie': setSessionCookie(token),
          },
        }
      );
    } catch (error) {
      throw error      
    }
  } catch (error) {
    if (error instanceof Error) {
        if (error.message === 'USER_NOT_FOUND' || error.message === 'INVALID_CREDENTIALS') {
          return NextResponse.json(
            { error: 'Invalid email/username or password' },
            { status: 401 }
          );
        } else if (error.message === 'ACCOUNT_INACTIVE') {
          return NextResponse.json(
            { error: 'Account is inactive. Please contact support.' },
            { status: 403 }
          );
        } else {
          return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
          );        
        }
      }
  }
}
