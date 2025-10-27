import { NextRequest, NextResponse } from 'next/server';
import { registerUser, createSession, setSessionCookie } from '@/lib/simple-auth';

// Allowed email domains
const ALLOWED_EMAIL_DOMAINS = [
  '@purplemaia.org',
  // Add more domains here as needed
];

function isValidEmailDomain(email: string): boolean {
  const emailDomain = email.substring(email.lastIndexOf('@'));
  return ALLOWED_EMAIL_DOMAINS.includes(emailDomain);
}

export async function POST(req: NextRequest) {
  try {
    const { username, email, password } = await req.json();
    if (!username || !email || !password) {
      return NextResponse.json({ error: 'Username, email, and password are required.' }, { status: 400 });
    }

    // Validate email domain
    if (!isValidEmailDomain(email)) {
      return NextResponse.json({ 
        error: `Registration is only allowed for email addresses ending in: ${ALLOWED_EMAIL_DOMAINS.join(', ')}` 
      }, { status: 403 });
    }

    const user = await registerUser(username, email, password);
    if (!user) {
      return NextResponse.json({ error: 'User already exists or registration failed.' }, { status: 400 });
    }

    // Just return user info without creating a session, 
    // Need to have admin approve first, 
    // Then go through login workflow

    const res = NextResponse.json({ user });
    return res;
  } catch (error) {
    return NextResponse.json({ error: 'Registration error.' }, { status: 500 });
  }
}
