import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie, validateSession } from '@/lib/auth'; // not sure if we need to validate session yet
import { emailSchema } from '@/lib/validators';
import { sendVerificationEmail } from '@/services/email';
import { db } from '@/db/kysely/client';

export async function POST(request: NextRequest) {
  try {
    // Parse and validate email from request body
    const { email } = await request.json();

    const validation = emailSchema.safeParse(email);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    // Find user by email
    const user = await db
      .selectFrom('user')
      .select(['id', 'email', 'username', 'email_verified', 'verification_token'])
      .where((eb) => eb.or([
        eb('email', '=', email),
        eb('username', '=', email)
      ]))
      .executeTakeFirst();

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (user.email_verified) {
      return NextResponse.json({ 
        success: true, 
        message: 'Email already verified' 
      });
    }

    if (!user.verification_token) {
      return NextResponse.json({ 
        success: false, 
        error: 'No verification token found. Please register again.' 
      }, { status: 400 });
    }

    // Resend verification email
    const emailResult = await sendVerificationEmail(user.email, user.username, user.verification_token);
    
    if (!emailResult.success) {
      console.error('Failed to resend verification email:', emailResult.error);
      const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/verify-email?token=${user.verification_token}`;
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to send email. Use this link to verify:',
        verificationUrl 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Verification email sent successfully. Please check your inbox.' 
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

