import { requestAdminAccess } from '@/lib/admin-utils';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

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
