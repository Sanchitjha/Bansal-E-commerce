import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getExistingCartSessionId } from '@/lib/cart-session';
import { badRequest, notFound, serverError } from '@/lib/api-helpers';
import { cancelPendingOrder, restoreCartFromOrder } from '@/lib/orders';

/** The customer closed the payment window or the payment failed: free the stock and refill their cart. */
export async function POST(request: NextRequest) {
  try {
    const { orderId, accessToken } = await request.json();
    if (!orderId || !accessToken) return badRequest('Missing order details.');

    const order = await prisma.order.findUnique({ where: { id: String(orderId) } });
    if (!order || order.accessToken !== accessToken) return notFound('Order not found');

    const cancelled = await cancelPendingOrder(order.id, 'Customer did not complete the payment');
    if (cancelled) {
      const sessionId = await getExistingCartSessionId(request);
      if (sessionId) await restoreCartFromOrder(sessionId, order);
    }
    return NextResponse.json({ success: true, cancelled });
  } catch (err) {
    return serverError(err);
  }
}
