import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

export const CUSTOMER_COOKIE_NAME = 'customer_session';

export interface CustomerTokenPayload {
  sub: string;
  email: string;
  name: string;
}

function secret(): string {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error('JWT_SECRET environment variable is not set');
  return value;
}

export function signCustomerToken(payload: CustomerTokenPayload): string {
  return jwt.sign({ ...payload, role: 'customer' }, secret(), { expiresIn: '30d' });
}

export function getCustomerFromRequest(request: NextRequest): CustomerTokenPayload | null {
  const token = request.cookies.get(CUSTOMER_COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, secret()) as CustomerTokenPayload & { role?: string };
    // An admin token signed with the same secret must never pass as a customer session.
    return decoded.role === 'customer' ? decoded : null;
  } catch {
    return null;
  }
}

export function attachCustomerCookie(response: NextResponse, token: string) {
  response.cookies.set(CUSTOMER_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearCustomerCookie(response: NextResponse) {
  response.cookies.set(CUSTOMER_COOKIE_NAME, '', { path: '/', maxAge: 0 });
}
