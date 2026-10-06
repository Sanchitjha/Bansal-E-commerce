import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { attachCustomerCookie, signCustomerToken } from '@/lib/customer-auth';
import { badRequest, serverError } from '@/lib/api-helpers';
import { isValidEmail, normalizeIndianMobile } from '@/lib/india';
import { clientIp, lockSecondsRemaining, lockedMessage, recordFailure } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = String(body.name ?? '').trim().slice(0, 100);
    const email = String(body.email ?? '').trim().toLowerCase();
    const phone = normalizeIndianMobile(String(body.phone ?? ''));
    const password = String(body.password ?? '');

    if (!name) return badRequest('Please enter your name.');
    if (!isValidEmail(email)) return badRequest('Please enter a valid email address.');
    if (!phone) return badRequest('Please enter a valid 10-digit Indian mobile number.');
    if (password.length < 8) return badRequest('Password must be at least 8 characters.');

    // Registration attempts that fail (e.g. email already taken) count towards a short lock per IP.
    const keys = [`register:${clientIp(request)}`];
    const locked = await lockSecondsRemaining(keys);
    if (locked > 0) return NextResponse.json({ error: lockedMessage(locked) }, { status: 429 });

    const existing = await prisma.customer.findUnique({ where: { email } });
    if (existing) {
      await recordFailure(keys);
      return badRequest('An account with this email already exists. Please sign in.');
    }

    const customer = await prisma.customer.create({
      data: { name, email, phone, passwordHash: await hashPassword(password) },
    });

    const response = NextResponse.json({ id: customer.id, name: customer.name, email: customer.email, phone: customer.phone }, { status: 201 });
    attachCustomerCookie(response, signCustomerToken({ sub: customer.id, email: customer.email, name: customer.name }));
    return response;
  } catch (err) {
    return serverError(err);
  }
}
