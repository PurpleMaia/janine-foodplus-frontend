import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, createSession, setSessionCookie } from '@/lib/simple-auth';

export async function POST(request: NextRequest) {
  try {
    //recieves post request with email/password
    const { email, password } = await request.json();

    //validates input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Authenticate user
    //Calls authenticateUser() from simple-auth.ts
    const user = await authenticateUser(email, password);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    //creates new session in database
    const token = await createSession(user.id);


    //Returns success with user info AND sets cookie
    return NextResponse.json(
      { success: true, user: { id: user.id, email: user.email } },
      {
        status: 200,
        headers: {
          'Set-Cookie': setSessionCookie(token),
        },
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
