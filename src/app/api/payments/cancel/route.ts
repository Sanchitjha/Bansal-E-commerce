import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/models';
import { getExistingCartSessionId } from '@/lib/cart-session';
import { badRequest, notFound, serverError } from '@/lib/api-helpers';
import { cancelPendingOrder, restoreCartFromOrder } from '@/lib/orders';

/** The customer closed the payment window or the payment failed: free the stock and refill their cart. */
export async function POST(request: NextRequest) {
  try {
    const { orderId, accessToken } = await request.json();
    if (!orderId || !accessToken) return badRequest('Missing order details.');

    const { Order } = await db();
    const order = await Order.findById(String(orderId));
    if (!order || order.accessToken !== accessToken) return notFound('Order not found');

    const cancelled = await cancelPendingOrder(order._id, 'Customer did not complete the payment');
    if (cancelled) {
      const sessionId = await getExistingCartSessionId(request);
      if (sessionId) await restoreCartFromOrder(sessionId, order);
    }
    return NextResponse.json({ success: true, cancelled });
  } catch (err) {
    return serverError(err);
  }
}
