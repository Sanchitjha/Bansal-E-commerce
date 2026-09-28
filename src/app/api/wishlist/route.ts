import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { attachCartCookie, getExistingCartSessionId, getOrCreateCartSession } from '@/lib/cart-session';
import { badRequest, notFound, serverError } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const sessionId = await getExistingCartSessionId(request);
    if (!sessionId) return NextResponse.json({ productIds: [] });

    const items = await prisma.wishlistItem.findMany({ where: { sessionId }, select: { productId: true } });
    return NextResponse.json({ productIds: items.map((i) => i.productId) });
  } catch (err) {
    return serverError(err);
  }
}

/** Toggles a product's wishlist membership for the caller's session. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId } = body;
    if (!productId || typeof productId !== 'string') return badRequest('productId is required');

    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) return notFound('Product not found');

    const { sessionId, isNew } = await getOrCreateCartSession(request);

    const existing = await prisma.wishlistItem.findUnique({
      where: { sessionId_productId: { sessionId, productId } },
    });

    let added: boolean;
    if (existing) {
      await prisma.wishlistItem.delete({ where: { id: existing.id } });
      added = false;
    } else {
      await prisma.wishlistItem.create({ data: { sessionId, productId } });
      added = true;
    }

    const items = await prisma.wishlistItem.findMany({ where: { sessionId }, select: { productId: true } });
    const response = NextResponse.json({ added, productIds: items.map((i) => i.productId) });
    if (isNew) attachCartCookie(response, sessionId);
    return response;
  } catch (err) {
    return serverError(err);
  }
}
