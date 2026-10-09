import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/models';
import { attachCustomerCookie, signCustomerToken } from '@/lib/customer-auth';
import { badRequest, serverError } from '@/lib/api-helpers';
import { consumeOtp } from '@/lib/otp';
import { clearFailures, clientIp, lockSecondsRemaining, lockedMessage, recordFailure } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/** Signs a customer in with the code emailed to them. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email ?? '').trim().toLowerCase();
    if (!email || !body.code) return badRequest('Please enter your email and the 6-digit code.');

    const keys = [`otp-ver-ip:${clientIp(request)}`, `otp-ver-email:${email}`];
    const locked = await lockSecondsRemaining(keys);
    if (locked > 0) return NextResponse.json({ error: lockedMessage(locked) }, { status: 429 });

    const ok = await consumeOtp(email, 'login', body.code);
    const { Customer } = await db();
    const customer = ok ? await Customer.findOne({ email }) : null;
    if (!ok || !customer) {
      await recordFailure(keys);
      return NextResponse.json({ error: 'That code is incorrect or has expired.' }, { status: 401 });
    }

    await clearFailures(keys);
    const response = NextResponse.json({ id: customer._id, name: customer.name, email: customer.email, phone: customer.phone });
    attachCustomerCookie(response, signCustomerToken({ sub: customer._id, email: customer.email, name: customer.name }));
    return response;
  } catch (err) {
    return serverError(err);
  }
}
