import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/models';
import { serverError } from '@/lib/api-helpers';
import { verifyWebhookSignature } from '@/lib/payments';
import { markOrderPaid } from '@/lib/orders';
import { sendOrderPlacedEmails } from '@/lib/order-notify';

export const dynamic = 'force-dynamic';

/**
 * Razorpay calls this server-to-server when a payment is captured, so an order still gets marked
 * paid even if the customer closes the browser right after paying.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature') ?? '';
    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const payment = event.payload?.payment?.entity;
      const gatewayOrderId: string | undefined = payment?.order_id ?? event.payload?.order?.entity?.id;
      const paymentId: string | undefined = payment?.id;
      if (gatewayOrderId && paymentId) {
        const { Order } = await db();
        const order = await Order.findOne({ gatewayOrderId });
        if (order) {
          const result = await markOrderPaid(order._id, paymentId);
          if (result && !result.alreadyPaid && !result.needsRefund) await sendOrderPlacedEmails(result.order);
        }
      }
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    return serverError(err);
  }
}
