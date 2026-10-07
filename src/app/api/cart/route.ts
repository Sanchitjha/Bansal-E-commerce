import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/models';
import { attachCartCookie, getExistingCartSessionId, getOrCreateCartSession } from '@/lib/cart-session';
import { addCartItem, clearCartItems, getCartItemQuantity, removeCartItem, setCartItemQuantity } from '@/lib/cart-ops';
import { badRequest, notFound, serverError } from '@/lib/api-helpers';
import { buildCartPayload } from '@/lib/cart-response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const sessionId = await getExistingCartSessionId(request);
    if (!sessionId) return NextResponse.json({ items: [], appliedCoupon: null, totals: null });
    return NextResponse.json(await buildCartPayload(sessionId));
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, quantity = 1, selectedVariantId } = body;
    if (!productId || typeof productId !== 'string') return badRequest('productId is required');
    if (!Number.isInteger(quantity) || quantity < 1) return badRequest('quantity must be a whole number of at least 1');

    const { Product } = await db();
    const product = await Product.findById(productId);
    if (!product || product.status !== 'active') return notFound('Product not found');

    const { sessionId, isNew } = await getOrCreateCartSession(request);
    const variantKey = typeof selectedVariantId === 'string' ? selectedVariantId : '';

    const wantedQty = (await getCartItemQuantity(sessionId, productId, variantKey)) + quantity;
    if (product.stock <= 0) return badRequest(`${product.name} is out of stock.`);
    if (wantedQty > product.stock) {
      return badRequest(`Only ${product.stock} unit${product.stock === 1 ? '' : 's'} of ${product.name} available.`);
    }

    await addCartItem(sessionId, productId, variantKey, quantity);

    const response = NextResponse.json(await buildCartPayload(sessionId), { status: 201 });
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
    if (!Number.isInteger(quantity) || quantity < 0) return badRequest('quantity must be a whole number');

    const sessionId = await getExistingCartSessionId(request);
    if (!sessionId) return notFound('No cart found');

    if (quantity > 0) {
      const { Product } = await db();
      const product = await Product.findById(productId).select('name stock');
      if (!product) return notFound('Product not found');
      if (quantity > product.stock) {
        return badRequest(`Only ${product.stock} unit${product.stock === 1 ? '' : 's'} of ${product.name} available.`);
      }
    }

    const variantKey = typeof selectedVariantId === 'string' ? selectedVariantId : '';
    if (quantity === 0) {
      await removeCartItem(sessionId, productId, variantKey);
    } else if (!(await setCartItemQuantity(sessionId, productId, variantKey, quantity))) {
      return notFound('Cart item not found');
    }

    return NextResponse.json(await buildCartPayload(sessionId));
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sessionId = await getExistingCartSessionId(request);
    if (!sessionId) return NextResponse.json({ success: true });
    await clearCartItems(sessionId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return serverError(err);
  }
}
