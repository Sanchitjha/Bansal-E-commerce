import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/models';
import { attachCartCookie, getExistingCartSessionId, getOrCreateCartSession } from '@/lib/cart-session';
import { badRequest, notFound, serverError } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const sessionId = await getExistingCartSessionId(request);
    if (!sessionId) return NextResponse.json({ productIds: [] });

    const { CartSession } = await db();
    const session = await CartSession.findById(sessionId).select('wishlist').lean();
    return NextResponse.json({ productIds: session?.wishlist ?? [] });
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

    const { Product, CartSession } = await db();
    if (!(await Product.exists({ _id: productId }))) return notFound('Product not found');

    const { sessionId, isNew } = await getOrCreateCartSession(request);

    const already = await CartSession.exists({ _id: sessionId, wishlist: productId });
    await CartSession.updateOne({ _id: sessionId }, already ? { $pull: { wishlist: productId } } : { $addToSet: { wishlist: productId } });

    const session = await CartSession.findById(sessionId).select('wishlist').lean();
    const response = NextResponse.json({ added: !already, productIds: session?.wishlist ?? [] });
    if (isNew) attachCartCookie(response, sessionId);
    return response;
  } catch (err) {
    return serverError(err);
  }
}
