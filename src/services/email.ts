import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendVerificationEmail(email: string, username: string, verificationToken: string) {
  // Check if Resend is configured
  if (!resend) {
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/verify-email?token=${verificationToken}`;
    console.warn('⚠️  RESEND_API_KEY not configured. Email sending disabled.');
    console.log('📧 Verification URL for manual testing:', verificationUrl);
    // In development, allow registration without email
    if (process.env.NODE_ENV === 'development') {
      return { success: true, data: { message: 'Email service not configured, but registration allowed in development' } };
    }
    return { success: false, error: 'Email service not configured' };
  }

  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/verify-email?token=${verificationToken}`;

  // Always log the verification URL for debugging (especially in dev)
  console.log('📧 Verification URL (always logged):', verificationUrl);
  
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: email,
      subject: 'Verify your email address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome, ${username}!</h2>
          <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            If you didn't create an account, please ignore this email.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('❌ Resend API error:', JSON.stringify(error, null, 2));
      console.log('📧 Verification URL (use this to verify manually):', verificationUrl);
      return { success: false, error };
    }

    console.log('✅ Verification email sent successfully to:', email);
    console.log('📧 Verification URL (if email not received, use this):', verificationUrl);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Exception sending verification email:', error);
    console.log('📧 Verification URL (use this to verify manually):', verificationUrl);
    return { success: false, error };
  }
}

