import { NextRequest } from 'next/server';
import { db } from './models';

const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;

export function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

/** Seconds left on the longest active lock across the given keys (0 = not locked). */
export async function lockSecondsRemaining(keys: string[]): Promise<number> {
  const { LoginAttempt } = await db();
  const rows = await LoginAttempt.find({ _id: { $in: keys }, lockedUntil: { $gt: new Date() } }).lean();
  if (rows.length === 0) return 0;
  const until = Math.max(...rows.map((r) => r.lockedUntil!.getTime()));
  return Math.ceil((until - Date.now()) / 1000);
}

export async function recordFailure(keys: string[]): Promise<void> {
  const { LoginAttempt } = await db();
  const now = Date.now();
  for (const key of keys) {
    const row = await LoginAttempt.findById(key).lean();
    const windowExpired = !row || now - row.windowStart.getTime() > WINDOW_MS;
    const failures = windowExpired ? 1 : row.failures + 1;
    await LoginAttempt.updateOne(
      { _id: key },
      {
        $set: {
          failures,
          windowStart: windowExpired ? new Date(now) : row.windowStart,
          lockedUntil: failures >= MAX_FAILURES ? new Date(now + LOCK_MS) : null,
        },
      },
      { upsert: true }
    );
  }
}

export async function clearFailures(keys: string[]): Promise<void> {
  const { LoginAttempt } = await db();
  await LoginAttempt.deleteMany({ _id: { $in: keys } });
}

export function lockedMessage(seconds: number): string {
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return `Too many failed attempts. Please try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`;
}
