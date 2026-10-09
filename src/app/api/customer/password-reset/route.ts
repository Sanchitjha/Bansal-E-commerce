import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/models';
import { hashPassword } from '@/lib/auth';
import { attachCustomerCookie, signCustomerToken } from '@/lib/customer-auth';
import { badRequest, serverError } from '@/lib/api-helpers';
import { passwordChangedEmail, sendEmail } from '@/lib/email';
import { consumeOtp } from '@/lib/otp';
import { clearFailures, clientIp, lockSecondsRemaining, lockedMessage, recordFailure } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/** Sets a new password using the code emailed for a password reset, then signs the customer in. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email ?? '').trim().toLowerCase();
    const newPassword = String(body.newPassword ?? '');
    if (!email || !body.code) return badRequest('Please enter your email and the 6-digit code.');
    if (newPassword.length < 8) return badRequest('Password must be at least 8 characters.');

    const keys = [`otp-ver-ip:${clientIp(request)}`, `otp-ver-email:${email}`];
    const locked = await lockSecondsRemaining(keys);
    if (locked > 0) return NextResponse.json({ error: lockedMessage(locked) }, { status: 429 });

    const ok = await consumeOtp(email, 'reset', body.code);
    const { Customer, SiteSettings } = await db();
    const customer = ok ? await Customer.findOne({ email }) : null;
    if (!ok || !customer) {
      await recordFailure(keys);
      return NextResponse.json({ error: 'That code is incorrect or has expired.' }, { status: 401 });
    }

    customer.passwordHash = await hashPassword(newPassword);
    await customer.save();
    await clearFailures(keys);

    const settings = await SiteSettings.findById('singleton').lean();
    await sendEmail({ to: email, ...passwordChangedEmail(settings?.websiteName ?? 'Luminary') });

    const response = NextResponse.json({ id: customer._id, name: customer.name, email: customer.email, phone: customer.phone });
    attachCustomerCookie(response, signCustomerToken({ sub: customer._id, email: customer.email, name: customer.name }));
    return response;
  } catch (err) {
    return serverError(err);
  }
}
