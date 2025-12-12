import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/lib/auth';
import { registerSchema } from '@/lib/validators';
import { ApiError } from '@/lib/errors';

// NOTE: Email domain restriction and email sending are currently disabled!!!

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
    // Parse and validate request body
    const { username, email, password } = await req.json();

    console.log('[REGISTER] Attempting registration for:', email);

    const validation = registerSchema.safeParse({ username, email, password });
    if (!validation.success) {
      console.log('[REGISTER] Validation failed:', validation.error);
      return NextResponse.json(
        { error: "Invalid Input", issues: validation.error.issues },
        { status: 400 }
      );
    }

    console.log('[REGISTER] Validation succeeded for:', email);

    // Validate email domain
    // if (!isValidEmailDomain(email)) {
    //   return NextResponse.json({ 
    //     error: `Registration is only allowed for email addresses ending in: ${ALLOWED_EMAIL_DOMAINS.join(', ')}` 
    //   }, { status: 403 });
    // }

    // const { user, verificationToken } = await registerUser(email, username, password);
    const { user } = await registerUser(email, username, password);    

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
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    // Unknown error
    console.error('[REGISTER]', error);
    return NextResponse.json(
        { error: 'Internal Server Error' }, 
        { status: 500 }
    );
  }
}
