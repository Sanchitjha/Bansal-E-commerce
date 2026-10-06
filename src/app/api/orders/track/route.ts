import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/models';
import { badRequest, serverError } from '@/lib/api-helpers';
import { normalizeIndianMobile } from '@/lib/india';
import { clearFailures, clientIp, lockSecondsRemaining, lockedMessage, recordFailure } from '@/lib/rate-limit';
import { newAccessToken } from '@/lib/orders';

/**
 * Guest order lookup. Needs BOTH the order id and the phone number used at checkout, so one value
 * alone can't be used to browse other customers' orders. Repeated misses lock the caller out briefly.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id')?.trim().toUpperCase();
    const phone = normalizeIndianMobile(searchParams.get('phone') ?? '');

    if (!id) return badRequest('Please enter your order ID.');
    if (!phone) return badRequest('Please enter the 10-digit mobile number used for the order.');

    const keys = [`track:${clientIp(request)}`];
    const locked = await lockSecondsRemaining(keys);
    if (locked > 0) return NextResponse.json({ error: lockedMessage(locked) }, { status: 429 });

    const { Order } = await db();
    const order = await Order.findById(id);
    const storedPhone = order ? normalizeIndianMobile(order.phone) : null;

    if (!order || storedPhone !== phone) {
      await recordFailure(keys);
      return NextResponse.json({ order: null });
    }

    await clearFailures(keys);

    // Orders created before invoices existed have no link token yet; mint one on first lookup.
    if (!order.accessToken) {
      order.accessToken = newAccessToken();
      await order.save();
    }
    return NextResponse.json({ order });
  } catch (err) {
    return serverError(err);
  }
}
