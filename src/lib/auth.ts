import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
  // Fails fast in dev/build rather than silently signing tokens with `undefined`.
  throw new Error('JWT_SECRET environment variable is not set');
}

export const ADMIN_COOKIE_NAME = 'admin_session';

export interface AdminTokenPayload {
  sub: string;
  email: string;
  name: string;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signAdminToken(payload: AdminTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyAdminToken(token: string): AdminTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AdminTokenPayload;
  } catch {
    return null;
  }
}

export function getAdminFromRequest(request: NextRequest): AdminTokenPayload | null {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}
