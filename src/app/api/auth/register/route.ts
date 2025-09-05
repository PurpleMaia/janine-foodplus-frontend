import { NextRequest, NextResponse } from 'next/server';
import { registerUser, createSession, setSessionCookie } from '@/lib/simple-auth';

export async function POST(req: NextRequest) {
  try {
    const { username, email, password } = await req.json();
    if (!username || !email || !password) {
      return NextResponse.json({ error: 'Username, email, and password are required.' }, { status: 400 });
    }

    const user = await registerUser(username, email, password);
    if (!user) {
      return NextResponse.json({ error: 'User already exists or registration failed.' }, { status: 400 });
    }

    // Create session and set cookie
    // const sessionId = await createSession(user.id);
    const res = NextResponse.json({ user });
    // res.headers.set('Set-Cookie', setSessionCookie(sessionId));
    return res;
  } catch (error) {
    return NextResponse.json({ error: 'Registration error.' }, { status: 500 });
  }
}
