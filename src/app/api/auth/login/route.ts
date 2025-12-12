import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validators';
import { authenticateUser, createSession, setSessionCookie } from '@/lib/auth';
import type { User } from '@/types/users';
import { ApiError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const { identifier, password } = await request.json();

    console.log('[LOGIN] Attempting login for:', identifier);

    const validation = loginSchema.safeParse({ identifier, password });
    if (!validation.success) {
      console.log('[LOGIN] Validation failed:', validation.error);
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Authenticate user
    const user = await authenticateUser(identifier, password);

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
    if (error instanceof ApiError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.statusCode }
        );
      }
  
      // Unknown error
      console.error('[LOGIN]', error);
      return NextResponse.json(
          { error: 'Unknown Error' }, 
          { status: 500 }
      );
    }
}
