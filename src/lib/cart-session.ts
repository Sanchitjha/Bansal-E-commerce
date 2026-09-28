import { NextRequest, NextResponse } from 'next/server';
import { prisma } from './prisma';

export const CART_COOKIE_NAME = 'cart_sid';
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

/** Resolves the caller's guest cart session, creating one if none exists yet. */
export async function getOrCreateCartSession(request: NextRequest): Promise<{ sessionId: string; isNew: boolean }> {
  const existingId = request.cookies.get(CART_COOKIE_NAME)?.value;
  if (existingId) {
    const found = await prisma.cartSession.findUnique({ where: { id: existingId } });
    if (found) return { sessionId: found.id, isNew: false };
  }
  const created = await prisma.cartSession.create({ data: {} });
  return { sessionId: created.id, isNew: true };
}

/** Reads the session id without creating a new one (for read-only GETs). */
export async function getExistingCartSessionId(request: NextRequest): Promise<string | null> {
  const existingId = request.cookies.get(CART_COOKIE_NAME)?.value;
  if (!existingId) return null;
  const found = await prisma.cartSession.findUnique({ where: { id: existingId }, select: { id: true } });
  return found?.id ?? null;
}

export function attachCartCookie(response: NextResponse, sessionId: string) {
  response.cookies.set(CART_COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: CART_COOKIE_MAX_AGE,
  });
}
