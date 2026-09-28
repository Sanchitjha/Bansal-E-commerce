import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getExistingCartSessionId } from '@/lib/cart-session';
import { notFound, serverError } from '@/lib/api-helpers';
import { buildCartPayload } from '@/lib/cart-response';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  try {
    const { productId } = await params;
    const { searchParams } = new URL(request.url);
    const selectedVariantId = searchParams.get('variant') || '';

    const sessionId = await getExistingCartSessionId(request);
    if (!sessionId) return notFound('No cart found');

    await prisma.cartItem.deleteMany({
      where: { sessionId, productId, selectedVariantId },
    });

    const payload = await buildCartPayload(sessionId);
    return NextResponse.json(payload);
  } catch (err) {
    return serverError(err);
  }
}
