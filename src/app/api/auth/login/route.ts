import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, createSession, setSessionCookie } from '@/lib/simple-auth';
import type { User } from '@/lib/simple-auth';

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

      // Create session token for successfully authenticated user
      const token = await createSession(user.id);
      console.log('Created session token:', token);

      // Set session token in cookie and return user information
      return NextResponse.json(
        { success: true, user: user as User },
        {
          status: 200,
          headers: {
            'Set-Cookie': setSessionCookie(token),
          },
        }
      );
    } catch (error) {
      // Rethrow known authentication errors to be handled in the outer catch block
      throw error;
    }
  } catch (error) {
    if (error instanceof Error) {
        if (error.message === 'USER_NOT_FOUND' || error.message === 'INVALID_CREDENTIALS') {
          return NextResponse.json(
            { error: 'Invalid email/username or password' },
            { status: 401 }
          );
        } else if (error.message === 'EMAIL_NOT_VERIFIED') {
          return NextResponse.json(
            { error: 'Please verify your email address before logging in. Check your inbox for the verification email.' },
            { status: 403 }
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
