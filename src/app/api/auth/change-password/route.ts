import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/models';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { badRequest, requireAdmin, serverError, unauthorized } from '@/lib/api-helpers';
import { clearFailures, clientIp, lockSecondsRemaining, lockedMessage, recordFailure } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const session = requireAdmin(request);
  if (!session) return unauthorized();

  try {
    const { currentPassword, newPassword } = await request.json();
    if (!currentPassword || !newPassword) return badRequest('Current and new password are required.');
    if (String(newPassword).length < 10) return badRequest('New password must be at least 10 characters.');
    if (newPassword === currentPassword) return badRequest('New password must be different from the current one.');

    const keys = [`admin-pw:${session.sub}`, `admin-ip:${clientIp(request)}`];
    const locked = await lockSecondsRemaining(keys);
    if (locked > 0) return NextResponse.json({ error: lockedMessage(locked) }, { status: 429 });

    const { Admin, ActivityLog } = await db();
    const admin = await Admin.findById(session.sub);
    if (!admin || !(await verifyPassword(String(currentPassword), admin.passwordHash))) {
      await recordFailure(keys);
      return badRequest('Current password is incorrect.');
    }

    await clearFailures(keys);
    admin.passwordHash = await hashPassword(String(newPassword));
    await admin.save();
    await ActivityLog.create({ adminName: admin.name, action: 'Changed admin password' });

    return NextResponse.json({ success: true });
  } catch (err) {
    return serverError(err);
  }
}
