import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/models';
import { badRequest, requireAdmin, serverError, unauthorized } from '@/lib/api-helpers';
import { isDuplicateKey } from '@/lib/db';
import { isValidEmail } from '@/lib/india';
import { clientIp, lockSecondsRemaining, lockedMessage, recordFailure } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/** Footer sign-up. Saying "already subscribed" is fine to show, so there is nothing to hide here. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email ?? '').trim().toLowerCase();
    if (!isValidEmail(email)) return badRequest('Please enter a valid email address.');

    // Each sign-up counts towards a short limit per IP, so the list cannot be flooded.
    const keys = [`newsletter:${clientIp(request)}`];
    const locked = await lockSecondsRemaining(keys);
    if (locked > 0) return NextResponse.json({ error: lockedMessage(locked) }, { status: 429 });
    await recordFailure(keys);

    const { Subscriber } = await db();
    try {
      await Subscriber.create({ _id: email, source: 'footer' });
    } catch (err) {
      if (!isDuplicateKey(err)) throw err;
    }
    return NextResponse.json({ ok: true, message: 'Thank you for subscribing!' }, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}

/** Admin only. `?format=csv` downloads the list as a spreadsheet file. */
export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) return unauthorized();
  try {
    const { Subscriber } = await db();
    const rows = await Subscriber.find().sort({ createdAt: -1 }).limit(5000).lean();
    const list = rows.map((r) => ({ email: r._id, source: r.source, subscribedAt: r.createdAt }));

    if (new URL(request.url).searchParams.get('format') === 'csv') {
      const csv = ['email,source,subscribed_at', ...list.map((r) => `${r.email},${r.source},${new Date(r.subscribedAt).toISOString()}`)].join('\n');
      return new NextResponse(csv, {
        headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="subscribers.csv"' },
      });
    }
    return NextResponse.json(list);
  } catch (err) {
    return serverError(err);
  }
}
