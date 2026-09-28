import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { attachCartCookie, getExistingCartSessionId, getOrCreateCartSession } from '@/lib/cart-session';
import { badRequest, notFound, serverError } from '@/lib/api-helpers';
import { buildCartPayload } from '@/lib/cart-response';

export async function GET(request: NextRequest) {
  try {
    const sessionId = await getExistingCartSessionId(request);
    if (!sessionId) return NextResponse.json({ items: [], appliedCoupon: null, totals: null });
    const payload = await buildCartPayload(sessionId);
    return NextResponse.json(payload);
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, quantity = 1, selectedVariantId } = body;
    if (!productId || typeof productId !== 'string') return badRequest('productId is required');
    if (!Number.isFinite(quantity) || quantity < 1) return badRequest('quantity must be a positive number');

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return notFound('Product not found');

    const { sessionId, isNew } = await getOrCreateCartSession(request);

    // Postgres unique indexes treat every NULL as distinct, so a nullable column can't
    // back a compound @@unique lookup here — use '' as the "no variant" sentinel instead.
    const variantKey = selectedVariantId || '';

    const existing = await prisma.cartItem.findUnique({
      where: {
        sessionId_productId_selectedVariantId: { sessionId, productId, selectedVariantId: variantKey },
      },
    });

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      });
    } else {
      await prisma.cartItem.create({
        data: { sessionId, productId, quantity, selectedVariantId: variantKey },
      });
    }

    const payload = await buildCartPayload(sessionId);
    const response = NextResponse.json(payload, { status: 201 });
    if (isNew) attachCartCookie(response, sessionId);
    return response;
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, quantity, selectedVariantId } = body;
    if (!productId || typeof productId !== 'string') return badRequest('productId is required');
    if (!Number.isFinite(quantity) || quantity < 0) return badRequest('quantity must be a non-negative number');

    const sessionId = await getExistingCartSessionId(request);
    if (!sessionId) return notFound('No cart found');

    const variantKey = selectedVariantId || '';
    const where = {
      sessionId_productId_selectedVariantId: { sessionId, productId, selectedVariantId: variantKey },
    };

    if (quantity === 0) {
      await prisma.cartItem.deleteMany({ where: { sessionId, productId, selectedVariantId: variantKey } });
    } else {
      const existing = await prisma.cartItem.findUnique({ where });
      if (!existing) return notFound('Cart item not found');
      await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity } });
    }

    const payload = await buildCartPayload(sessionId);
    return NextResponse.json(payload);
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sessionId = await getExistingCartSessionId(request);
    if (!sessionId) return NextResponse.json({ success: true });

    await prisma.$transaction([
      prisma.cartItem.deleteMany({ where: { sessionId } }),
      prisma.cartSession.update({ where: { id: sessionId }, data: { activeCouponCode: null } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    return serverError(err);
  }
}
