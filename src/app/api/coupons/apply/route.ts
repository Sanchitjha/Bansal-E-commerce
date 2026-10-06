import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/models';
import { attachCartCookie, getExistingCartSessionId, getOrCreateCartSession } from '@/lib/cart-session';
import { setCartCoupon } from '@/lib/cart-ops';
import { badRequest, serverError } from '@/lib/api-helpers';
import { buildCartPayload } from '@/lib/cart-response';
import { checkCouponEligibility } from '@/lib/pricing';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code = String(body.code ?? '').trim().toUpperCase();
    if (!code) return badRequest('code is required');

    const { Coupon } = await db();
    const coupon = await Coupon.findOne({ code, isActive: true });
    if (!coupon) {
      return NextResponse.json({ success: false, message: 'Invalid or expired coupon code.' });
    }

    const { sessionId, isNew } = await getOrCreateCartSession(request);
    const current = await buildCartPayload(sessionId);

    const eligibility = checkCouponEligibility(coupon, current.lines);
    if (!eligibility.ok) {
      return NextResponse.json({ success: false, message: eligibility.message });
    }

    await setCartCoupon(sessionId, coupon.code);
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

    await setCartCoupon(sessionId, null);
    return NextResponse.json({ success: true, ...(await buildCartPayload(sessionId)) });
  } catch (err) {
    return serverError(err);
  }
}
