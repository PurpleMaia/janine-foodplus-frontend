import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie, validateSession } from '@/lib/auth';
import { emailSchema } from '@/lib/validators';
import { requestAdminAccess } from "@/services/db/admins";


export async function POST(req: NextRequest) {
  try {
    // Validate session
    const sessionToken = getSessionCookie(req);
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await validateSession(sessionToken);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate email from request body
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const validation = emailSchema.safeParse(email);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }



    // Request admin access
    const result = await requestAdminAccess(email);

    if (!result) {
      return NextResponse.json({ error: 'Failed to request admin access.' }, { status: 500 });
    }

    console.log(`Admin access requested for email: ${email}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send request.' }, { status: 500 });
  }
}
