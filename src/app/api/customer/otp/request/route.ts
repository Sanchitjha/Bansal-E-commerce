import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/models';
import { badRequest, serverError } from '@/lib/api-helpers';
import { customerEmailReady, otpEmail, sendEmail } from '@/lib/email';
import { isValidEmail } from '@/lib/india';
import { OTP_RESEND_SECONDS, issueOtp, type OtpPurpose } from '@/lib/otp';
import { clientIp, lockSecondsRemaining, lockedMessage, recordFailure } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * Emails a 6-digit code for signing in or resetting a password. The answer is the same whether or not an
 * account exists for the email, so this cannot be used to find out who has an account.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email ?? '').trim().toLowerCase();
    const purpose = body.purpose as OtpPurpose;

    if (purpose !== 'login' && purpose !== 'reset') return badRequest('Unknown request.');
    if (!isValidEmail(email)) return badRequest('Please enter a valid email address.');
    if (!customerEmailReady()) {
      return NextResponse.json({ error: 'Email codes are not available right now. Please use your password.' }, { status: 503 });
    }

    // Each request counts towards a short limit per IP and per email, so codes cannot be mass-mailed.
    const keys = [`otp-req-ip:${clientIp(request)}`, `otp-req-email:${email}`];
    const locked = await lockSecondsRemaining(keys);
    if (locked > 0) return NextResponse.json({ error: lockedMessage(locked) }, { status: 429 });
    await recordFailure(keys);

    const { Customer, SiteSettings } = await db();
    const customer = await Customer.findOne({ email }).lean();
    if (customer) {
      const issued = await issueOtp(email, purpose);
      if ('code' in issued) {
        const settings = await SiteSettings.findById('singleton').lean();
        await sendEmail({ to: email, ...otpEmail(issued.code, purpose, settings?.websiteName ?? 'Luminary') });
      }
    }

    return NextResponse.json({
      ok: true,
      message: 'If an account exists for this email, a 6-digit code has been sent. It is valid for 10 minutes.',
      resendIn: OTP_RESEND_SECONDS,
    });
  } catch (err) {
    return serverError(err);
  }
}
