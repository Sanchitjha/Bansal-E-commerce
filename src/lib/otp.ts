import crypto from 'crypto';
import { db } from './models';

export type OtpPurpose = 'login' | 'reset';

export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_RESEND_SECONDS = 60;
const MAX_ATTEMPTS = 5;

function secret(): string {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error('JWT_SECRET environment variable is not set');
  return value;
}

const idFor = (email: string, purpose: OtpPurpose) => `${purpose}:${email}`;

/** Keyed hash, so a leaked database does not reveal live codes. */
const hashCode = (email: string, purpose: OtpPurpose, code: string) =>
  crypto.createHmac('sha256', secret()).update(`${purpose}:${email}:${code}`).digest('hex');

const safeEqual = (a: string, b: string) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

export const cleanCode = (value: unknown) => String(value ?? '').replace(/\s/g, '');
export const isCodeShape = (code: string) => /^\d{6}$/.test(code);

/**
 * Creates a fresh 6-digit code for this email and purpose (replacing any earlier one).
 * Returns `waitSeconds` instead when a code was sent less than a minute ago.
 */
export async function issueOtp(email: string, purpose: OtpPurpose): Promise<{ code: string } | { waitSeconds: number }> {
  const { OtpCode } = await db();
  const id = idFor(email, purpose);
  const existing = await OtpCode.findById(id).lean();
  if (existing) {
    const elapsed = Date.now() - existing.sentAt.getTime();
    if (elapsed < OTP_RESEND_SECONDS * 1000) return { waitSeconds: Math.ceil((OTP_RESEND_SECONDS * 1000 - elapsed) / 1000) };
  }

  const code = String(crypto.randomInt(100000, 1000000));
  const now = new Date();
  await OtpCode.updateOne(
    { _id: id },
    { $set: { email, purpose, codeHash: hashCode(email, purpose, code), attempts: 0, sentAt: now, expiresAt: new Date(now.getTime() + OTP_TTL_MS) } },
    { upsert: true }
  );
  return { code };
}

/**
 * Checks a code and, if right, uses it up so it cannot be used twice. Every check counts as an attempt
 * before the comparison, so even parallel guesses stop after MAX_ATTEMPTS.
 */
export async function consumeOtp(email: string, purpose: OtpPurpose, rawCode: unknown): Promise<boolean> {
  const code = cleanCode(rawCode);
  if (!isCodeShape(code)) return false;

  const { OtpCode } = await db();
  const id = idFor(email, purpose);
  const doc = await OtpCode.findOneAndUpdate(
    { _id: id, expiresAt: { $gt: new Date() }, attempts: { $lt: MAX_ATTEMPTS } },
    { $inc: { attempts: 1 } },
    { new: true }
  ).lean();
  if (!doc) return false;
  if (!safeEqual(doc.codeHash, hashCode(email, purpose, code))) return false;

  const res = await OtpCode.deleteOne({ _id: id, codeHash: doc.codeHash });
  return res.deletedCount === 1;
}
