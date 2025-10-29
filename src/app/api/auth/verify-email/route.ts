import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../../db/kysely/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ success: false, error: 'Verification token is required' }, { status: 400 });
    }

    // Find user by verification token
    const user = await (db as any)
      .selectFrom('user')
      .select(['id', 'email', 'email_verified', 'account_status'])
      .where('verification_token', '=', token)
      .executeTakeFirst();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid or expired verification token' }, { status: 400 });
    }

    // Check if already verified
    if (user.email_verified) {
      return NextResponse.json({ 
        success: true, 
        message: 'Email already verified. You can now log in after admin approval.',
        alreadyVerified: true 
      });
    }

    // Mark email as verified and set account_status to 'pending' for admin approval
    console.log(`📧 Verifying email for user: ${user.email}, current status: ${user.account_status}`);
    const result = await (db as any)
      .updateTable('user')
      .set({
        email_verified: true,
        account_status: 'pending', // Now ready for admin approval
        verification_token: null // Clear token after verification
      })
      .where('id', '=', user.id)
      .where('verification_token', '=', token)
      .executeTakeFirst();

    if (result.numUpdatedRows > 0) {
      console.log(`✅ Email verified and account set to pending for: ${user.email}`);
      return NextResponse.json({ 
        success: true, 
        message: 'Email verified successfully! Your account is now pending admin approval. You will be notified when your account is activated.' 
      });
    } else {
      console.error(`❌ Failed to update user status for: ${user.email}`);
      return NextResponse.json({ success: false, error: 'Failed to verify email' }, { status: 500 });
    }
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

