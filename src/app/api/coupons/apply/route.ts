import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { attachCartCookie, getExistingCartSessionId, getOrCreateCartSession } from '@/lib/cart-session';
import { badRequest, serverError } from '@/lib/api-helpers';
import { buildCartPayload } from '@/lib/cart-response';
import { checkCouponEligibility } from '@/lib/pricing';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code = String(body.code ?? '').trim().toUpperCase();
    if (!code) return badRequest('code is required');

    const coupon = await prisma.coupon.findFirst({ where: { code, isActive: true } });
    if (!coupon) {
      return NextResponse.json({ success: false, message: 'Invalid or expired coupon code.' });
    }

    const { sessionId, isNew } = await getOrCreateCartSession(request);
    const current = await buildCartPayload(sessionId);

    const eligibility = checkCouponEligibility(coupon, current.lines);
    if (!eligibility.ok) {
      return NextResponse.json({ success: false, message: eligibility.message });
    }

    await prisma.cartSession.update({ where: { id: sessionId }, data: { activeCouponCode: coupon.code } });
    const payload = await buildCartPayload(sessionId);

    const message = coupon.firstOrderOnly
      ? `Coupon '${coupon.code}' applied. It is valid on your first order only and is verified at checkout.`
      : `Coupon '${coupon.code}' applied successfully!`;

    const response = NextResponse.json({ success: true, message, ...payload });
    if (isNew) attachCartCookie(response, sessionId);
    return response;
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sessionId = await getExistingCartSessionId(request);
    if (!sessionId) return NextResponse.json({ success: true });

    await prisma.cartSession.update({ where: { id: sessionId }, data: { activeCouponCode: null } });
    const payload = await buildCartPayload(sessionId);
    return NextResponse.json({ success: true, ...payload });
  } catch (err) {
    return serverError(err);
  }
}
