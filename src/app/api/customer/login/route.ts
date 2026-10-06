import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/models';
import { verifyPassword } from '@/lib/auth';
import { attachCustomerCookie, signCustomerToken } from '@/lib/customer-auth';
import { badRequest, serverError, unauthorized } from '@/lib/api-helpers';
import { clearFailures, clientIp, lockSecondsRemaining, lockedMessage, recordFailure } from '@/lib/rate-limit';

const DUMMY_HASH = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8.xU6dZ7mQ0qVfQ1y3K8sS9V0eU9yK';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');
    if (!email || !password) return badRequest('Email and password are required.');

    const keys = [`customer-ip:${clientIp(request)}`, `customer-email:${email}`];
    const locked = await lockSecondsRemaining(keys);
    if (locked > 0) return NextResponse.json({ error: lockedMessage(locked) }, { status: 429 });

    const { Customer } = await db();
    const customer = await Customer.findOne({ email });
    const valid = await verifyPassword(password, customer?.passwordHash ?? DUMMY_HASH);
    if (!customer || !valid) {
      await recordFailure(keys);
      return unauthorized('Invalid email or password');
    }

    await clearFailures(keys);
    const response = NextResponse.json({ id: customer._id, name: customer.name, email: customer.email, phone: customer.phone });
    attachCustomerCookie(response, signCustomerToken({ sub: customer._id, email: customer.email, name: customer.name }));
    return response;
  } catch (err) {
    return serverError(err);
  }
}
