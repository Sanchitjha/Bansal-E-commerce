import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest, AdminTokenPayload } from './auth';

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFound(message = 'Not found') {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function unauthorized(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function serverError(err: unknown) {
  console.error(err);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

/** Returns the verified admin payload, or writes a 401 response and returns null. */
export function requireAdmin(request: NextRequest): AdminTokenPayload | null {
  return getAdminFromRequest(request);
}
