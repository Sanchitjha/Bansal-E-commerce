import { NextRequest, NextResponse } from 'next/server';
import { getExistingCartSessionId } from '@/lib/cart-session';
import { removeCartItem } from '@/lib/cart-ops';
import { notFound, serverError } from '@/lib/api-helpers';
import { buildCartPayload } from '@/lib/cart-response';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  try {
    const { productId } = await params;
    const { searchParams } = new URL(request.url);
    const variantKey = searchParams.get('variant') || '';

    const sessionId = await getExistingCartSessionId(request);
    if (!sessionId) return notFound('No cart found');

    await removeCartItem(sessionId, productId, variantKey);
    return NextResponse.json(await buildCartPayload(sessionId));
  } catch (err) {
    return serverError(err);
  }
}
