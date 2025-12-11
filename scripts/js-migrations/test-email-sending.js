const { Resend } = require('resend');
require('dotenv').config();

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

async function testEmailSending() {
  if (!resend) {
    console.error('❌ RESEND_API_KEY is not set in .env');
    return;
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const testEmail = process.argv[2] || 'test@example.com';

  console.log('🧪 Testing Resend email sending...');
  console.log('   API Key:', process.env.RESEND_API_KEY ? `${process.env.RESEND_API_KEY.substring(0, 10)}...` : 'NOT SET');
  console.log('   From:', fromEmail);
  console.log('   To:', testEmail);
  console.log('');

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: testEmail,
      subject: 'Test Email from Food+ App',
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Test Email</h2>
          <p>If you received this, email sending is working!</p>
        </div>
      `,
    });

    if (error) {
      console.error('❌ Error sending email:');
      console.error(JSON.stringify(error, null, 2));
      
      if (error.message) {
        console.error('\n❌ Error message:', error.message);
      }
      
      // Common issues
      if (error.message?.includes('domain') || error.message?.includes('not verified')) {
        console.error('\n⚠️  ISSUE: The "from" email domain is not verified in Resend.');
        console.error('   Solution:');
        console.error('   1. Go to https://resend.com/domains');
        console.error('   2. Add and verify your domain');
        console.error('   3. Or use onboarding@resend.dev for testing (already verified)');
      } else if (error.message?.includes('API key') || error.message?.includes('Unauthorized')) {
        console.error('\n⚠️  ISSUE: Invalid API key');
        console.error('   Solution: Check your RESEND_API_KEY in .env file');
      } else if (error.message?.includes('rate limit')) {
        console.error('\n⚠️  ISSUE: Rate limit reached');
        console.error('   Solution: Wait a few minutes and try again');
      }
    } else {
      console.log('✅ Email sent successfully!');
      console.log('   Email ID:', data?.id);
      console.log(`\n📧 Check ${testEmail} inbox (and spam folder) for the test email.`);
    }
  } catch (error) {
    console.error('❌ Exception:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
    }
  }
}

testEmailSending();

