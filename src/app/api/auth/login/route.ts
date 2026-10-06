import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/models';
import { ADMIN_COOKIE_NAME, signAdminToken, verifyPassword } from '@/lib/auth';
import { badRequest, serverError, unauthorized } from '@/lib/api-helpers';
import { clearFailures, clientIp, lockSecondsRemaining, lockedMessage, recordFailure } from '@/lib/rate-limit';

// A real bcrypt hash of a random string, so unknown emails cost the same time as wrong passwords.
const DUMMY_HASH = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8.xU6dZ7mQ0qVfQ1y3K8sS9V0eU9yK';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;
    if (!email || !password) return badRequest('email and password are required');

    const normalizedEmail = String(email).toLowerCase().trim();
    const keys = [`admin-ip:${clientIp(request)}`, `admin-email:${normalizedEmail}`];

    const locked = await lockSecondsRemaining(keys);
    if (locked > 0) return NextResponse.json({ error: lockedMessage(locked) }, { status: 429 });

    const { Admin } = await db();
    const admin = await Admin.findOne({ email: normalizedEmail });
    const valid = await verifyPassword(String(password), admin?.passwordHash ?? DUMMY_HASH);

    if (!admin || !valid) {
      await recordFailure(keys);
      return unauthorized('Invalid email or password');
    }

    await clearFailures(keys);
    const token = signAdminToken({ sub: admin._id, email: admin.email, name: admin.name });

    const response = NextResponse.json({ id: admin._id, email: admin.email, name: admin.name });
    response.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    return response;
  } catch (err) {
    return serverError(err);
  }
}
