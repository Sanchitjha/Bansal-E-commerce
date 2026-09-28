import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ADMIN_COOKIE_NAME, signAdminToken, verifyPassword } from '@/lib/auth';
import { badRequest, serverError, unauthorized } from '@/lib/api-helpers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;
    if (!email || !password) return badRequest('email and password are required');

    const admin = await prisma.admin.findUnique({ where: { email: String(email).toLowerCase().trim() } });
    if (!admin) return unauthorized('Invalid email or password');

    const valid = await verifyPassword(password, admin.passwordHash);
    if (!valid) return unauthorized('Invalid email or password');

    const token = signAdminToken({ sub: admin.id, email: admin.email, name: admin.name });

    const response = NextResponse.json({ id: admin.id, email: admin.email, name: admin.name });
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
