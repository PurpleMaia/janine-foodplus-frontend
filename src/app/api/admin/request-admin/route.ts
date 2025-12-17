import { requestAdminAccess } from '@/lib/admin-utils';
import { NextRequest, NextResponse } from 'next/server';
import { emailSchema } from "@/lib/validators";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const validation = emailSchema.safeParse(email);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
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
