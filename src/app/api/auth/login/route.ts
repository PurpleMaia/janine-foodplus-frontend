import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, createSession, } from '@/lib/auth';
import { setSessionCookie } from '@/lib/cookies';
import type { User } from '@/types/user';
import { loginSchema } from '@/lib/validators';
import { ApiError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    // retrieve email/username and password from request body
    const { authString, password } = await request.json();

    //validates input
    const validation = loginSchema.safeParse({ authString, password });
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
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
    if (error instanceof ApiError) {
        return NextResponse.json(
            { error: error.message },
            { status: error.statusCode }
        );
    }
         
    // Unknown error
    console.error('[REGISTER]', error);
    return NextResponse.json(
        { error: 'Unknown Error' }, 
        { status: 500 }
    );
  }
}
