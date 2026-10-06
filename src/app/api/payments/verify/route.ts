import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/models';
import { badRequest, notFound, serverError } from '@/lib/api-helpers';
import { verifyPaymentSignature } from '@/lib/payments';
import { markOrderPaid } from '@/lib/orders';
import { sendOrderPlacedEmails } from '@/lib/order-notify';

/** Called by the browser right after Razorpay's checkout reports success. */
export async function POST(request: NextRequest) {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();
    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return badRequest('Missing payment details.');
    }

    const { Order } = await db();
    const order = await Order.findById(String(orderId));
    if (!order) return notFound('Order not found');
    if (!order.gatewayOrderId || order.gatewayOrderId !== razorpay_order_id) {
      return badRequest('Payment does not match this order.');
    }
    if (!verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      return badRequest('Payment verification failed.');
    }

    const result = await markOrderPaid(order._id, razorpay_payment_id);
    if (!result) return notFound('Order not found');

    if (!result.alreadyPaid && !result.needsRefund) await sendOrderPlacedEmails(result.order);

    return NextResponse.json({ order: result.order, needsRefund: result.needsRefund });
  } catch (err) {
    return serverError(err);
  }
}
