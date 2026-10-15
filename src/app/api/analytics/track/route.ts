import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/models';
import { clientIp } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { eventType, eventName, url, productId, productName, value, metadata } = body;

    if (!eventType || !eventName) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const { TrafficEvent } = await db();
    await TrafficEvent.create({
      eventType,
      eventName,
      url: url || request.headers.get('referer') || '',
      productId,
      productName,
      value: typeof value === 'number' ? value : undefined,
      metadata,
      ip: clientIp(request),
      timestamp: new Date(),
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Non-blocking fire-and-forget
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
