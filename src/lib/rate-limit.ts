import { NextRequest } from 'next/server';
import { prisma } from './prisma';

const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;

export function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

/** Seconds left on the longest active lock across the given keys (0 = not locked). */
export async function lockSecondsRemaining(keys: string[]): Promise<number> {
  const rows = await prisma.loginAttempt.findMany({ where: { key: { in: keys }, lockedUntil: { gt: new Date() } } });
  if (rows.length === 0) return 0;
  const until = Math.max(...rows.map((r) => r.lockedUntil!.getTime()));
  return Math.ceil((until - Date.now()) / 1000);
}

export async function recordFailure(keys: string[]): Promise<void> {
  const now = Date.now();
  for (const key of keys) {
    const row = await prisma.loginAttempt.findUnique({ where: { key } });
    const windowExpired = !row || now - row.windowStart.getTime() > WINDOW_MS;
    const failures = windowExpired ? 1 : row.failures + 1;
    await prisma.loginAttempt.upsert({
      where: { key },
      create: { key, failures, windowStart: new Date(now), lockedUntil: failures >= MAX_FAILURES ? new Date(now + LOCK_MS) : null },
      update: {
        failures,
        windowStart: windowExpired ? new Date(now) : row.windowStart,
        lockedUntil: failures >= MAX_FAILURES ? new Date(now + LOCK_MS) : null,
      },
    });
  }
}

export async function clearFailures(keys: string[]): Promise<void> {
  await prisma.loginAttempt.deleteMany({ where: { key: { in: keys } } });
}

export function lockedMessage(seconds: number): string {
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return `Too many failed attempts. Please try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`;
}
