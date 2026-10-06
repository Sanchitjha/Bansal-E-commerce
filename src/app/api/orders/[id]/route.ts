import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { badRequest, notFound, requireAdmin, serverError, unauthorized } from '@/lib/api-helpers';
import { ORDER_STATUSES, isOneOf } from '@/lib/validators';
import { sendOrderStatusEmail } from '@/lib/order-notify';

const NOTIFY_STATUSES = ['Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Refunded'];
const STOCK_RELEASED = ['Cancelled', 'Returned', 'Refunded'];

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return notFound('Order not found');
    return NextResponse.json(order);
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const { id } = await params;
    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) return notFound('Order not found');

    const body = await request.json();
    if (body.orderStatus !== undefined && !isOneOf(ORDER_STATUSES, body.orderStatus)) {
      return badRequest(`Invalid orderStatus: ${body.orderStatus}`);
    }

    const newStatus: string = body.orderStatus ?? existing.orderStatus;
    const statusChanged = newStatus !== existing.orderStatus;

    // COD money is collected on delivery; a refund status means the money went back.
    let paymentStatus = existing.paymentStatus;
    if (statusChanged && newStatus === 'Delivered' && existing.paymentMethod === 'COD' && paymentStatus === 'Pending') paymentStatus = 'Paid';
    if (statusChanged && newStatus === 'Refunded' && paymentStatus === 'Paid') paymentStatus = 'Refunded';

    const releasesStock =
      statusChanged && newStatus === 'Cancelled' && !STOCK_RELEASED.includes(existing.orderStatus) && existing.orderStatus !== 'Pending Payment';

    const order = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: {
          orderStatus: newStatus,
          paymentStatus,
          courier: body.courier || existing.courier,
          trackingNumber: body.trackingNumber || existing.trackingNumber,
        },
      });

      if (releasesStock) {
        const items = (Array.isArray(existing.items) ? existing.items : []) as { productId: string; quantity: number }[];
        for (const item of items) {
          await tx.product.updateMany({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
        }
      }

      await tx.activityLog.create({
        data: {
          adminName: admin.name,
          action: 'Updated Order Status',
          details: `Order ${id} → ${newStatus}${releasesStock ? ' (stock returned to inventory)' : ''}`,
        },
      });
      await tx.sheetSyncLog.create({
        data: { sheetName: 'SALES REGISTER', orderId: id, event: `Status updated to ${newStatus}` },
      });
      return updated;
    });

    const trackingAdded =
      (body.trackingNumber && body.trackingNumber !== existing.trackingNumber) || (body.courier && body.courier !== existing.courier);
    if ((statusChanged && NOTIFY_STATUSES.includes(newStatus)) || (trackingAdded && newStatus === 'Shipped')) {
      await sendOrderStatusEmail(order);
    }

    return NextResponse.json(order);
  } catch (err) {
    return serverError(err);
  }
}
