import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/lib/auth';
// import { sendVerificationEmail } from '@/services/email';

// Allowed email domains
// const ALLOWED_EMAIL_DOMAINS = [
//   '@purplemaia.org',
//   // Add more domains here as needed
// ];

// function isValidEmailDomain(email: string): boolean {
//   const emailDomain = email.substring(email.lastIndexOf('@'));
//   return ALLOWED_EMAIL_DOMAINS.includes(emailDomain);
// }

export async function POST(req: NextRequest) {
  try {
    const { username, email, password } = await req.json();
    if (!username || !email || !password) {
      return NextResponse.json({ error: 'Username, email, and password are required.' }, { status: 400 });
    }

    // Validate email domain
    // if (!isValidEmailDomain(email)) {
    //   return NextResponse.json({ 
    //     error: `Registration is only allowed for email addresses ending in: ${ALLOWED_EMAIL_DOMAINS.join(', ')}` 
    //   }, { status: 403 });
    // }

    // const { user, verificationToken } = await registerUser(email, username, password);
    const { user } = await registerUser(email, username, password);
    if (!user) {
      return NextResponse.json({ error: 'User already exists or registration failed.' }, { status: 400 });
    }

    // Send verification email
    // const emailResult = await sendVerificationEmail(email, username, verificationToken);
    // if (!emailResult.success) {
    //   console.error('❌ Failed to send verification email:', emailResult.error);
    //   console.log('📧 Verification URL for manual testing:', `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/verify-email?token=${verificationToken}`);
      
    //   // In development mode, allow registration even if email fails
    //   if (process.env.NODE_ENV === 'development') {
    //     console.warn('⚠️  Allowing registration without email verification in development mode');
    //     return NextResponse.json({ 
    //       success: true,
    //       message: 'Registration successful! Email verification failed, but registration is allowed in development mode. Check server logs for verification URL.',
    //       user,
    //       verificationUrl: `/verify-email?token=${verificationToken}` 
    //     });
    //   }
      
    //   // In production, return error but don't fail completely
    //   const errorMsg = emailResult.error && typeof emailResult.error === 'object' && 'message' in emailResult.error 
    //     ? String(emailResult.error.message) 
    //     : String(emailResult.error || 'Unknown error');
    //   return NextResponse.json({ 
    //     error: `Account created but verification email failed to send: ${errorMsg}. Please contact support or check server logs for verification URL.`, 
    //     user,
    //     verificationUrl: `/verify-email?token=${verificationToken}`
    //   }, { status: 500 });
    // }

    return NextResponse.json({ 
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      user 
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration error.' }, { status: 500 });
  }
}
