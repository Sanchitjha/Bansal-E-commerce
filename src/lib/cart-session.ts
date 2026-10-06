import { NextRequest, NextResponse } from 'next/server';
import { db } from './models';

export const CART_COOKIE_NAME = 'cart_sid';
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

async function sessionExists(id: string): Promise<boolean> {
  const { CartSession } = await db();
  return !!(await CartSession.exists({ _id: id }));
}

/** Resolves the caller's guest cart session, creating one if none exists yet. */
export async function getOrCreateCartSession(request: NextRequest): Promise<{ sessionId: string; isNew: boolean }> {
  const existingId = request.cookies.get(CART_COOKIE_NAME)?.value;
  if (existingId && (await sessionExists(existingId))) return { sessionId: existingId, isNew: false };

  const { CartSession } = await db();
  const created = await CartSession.create({});
  return { sessionId: created._id, isNew: true };
}

/** Reads the session id without creating a new one (for read-only GETs). */
export async function getExistingCartSessionId(request: NextRequest): Promise<string | null> {
  const existingId = request.cookies.get(CART_COOKIE_NAME)?.value;
  if (!existingId) return null;
  return (await sessionExists(existingId)) ? existingId : null;
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
