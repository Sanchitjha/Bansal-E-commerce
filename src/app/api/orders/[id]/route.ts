import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/models';
import { withTransaction } from '@/lib/db';
import { revalidateCatalog } from '@/lib/data';
import { badRequest, notFound, requireAdmin, serverError, unauthorized } from '@/lib/api-helpers';
import { ORDER_STATUSES, isOneOf } from '@/lib/validators';
import { sendOrderStatusEmail } from '@/lib/order-notify';

const NOTIFY_STATUSES = ['Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Refunded'];
const STOCK_RELEASED = ['Cancelled', 'Returned', 'Refunded'];

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const { id } = await params;
    const { Order } = await db();
    const order = await Order.findById(id);
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
    const m = await db();
    const existing = await m.Order.findById(id);
    if (!existing) return notFound('Order not found');

    const body = await request.json();
    if (body.orderStatus !== undefined && !isOneOf(ORDER_STATUSES, body.orderStatus)) {
      return badRequest(`Invalid orderStatus: ${body.orderStatus}`);
    }

    const newStatus: string = body.orderStatus ?? existing.orderStatus;
    const statusChanged = newStatus !== existing.orderStatus;
    const courier = typeof body.courier === 'string' && body.courier.trim() ? body.courier.trim().slice(0, 80) : existing.courier;
    const trackingNumber =
      typeof body.trackingNumber === 'string' && body.trackingNumber.trim() ? body.trackingNumber.trim().slice(0, 80) : existing.trackingNumber;

    // COD money is collected on delivery; a refund status means the money went back.
    let paymentStatus = existing.paymentStatus;
    if (statusChanged && newStatus === 'Delivered' && existing.paymentMethod === 'COD' && paymentStatus === 'Pending') paymentStatus = 'Paid';
    if (statusChanged && newStatus === 'Refunded' && paymentStatus === 'Paid') paymentStatus = 'Refunded';

    const releasesStock =
      statusChanged && newStatus === 'Cancelled' && !STOCK_RELEASED.includes(existing.orderStatus) && existing.orderStatus !== 'Pending Payment';

    await withTransaction(async (session) => {
      await m.Order.updateOne({ _id: id }, { $set: { orderStatus: newStatus, paymentStatus, courier, trackingNumber } }, { session });

      if (releasesStock) {
        const items = (Array.isArray(existing.items) ? existing.items : []) as { productId: string; quantity: number }[];
        for (const item of items) {
          await m.Product.updateOne({ _id: item.productId }, { $inc: { stock: item.quantity } }, { session });
        }
      }

      await m.ActivityLog.create(
        [
          {
            adminName: admin.name,
            action: 'Updated Order Status',
            details: `Order ${id} → ${newStatus}${releasesStock ? ' (stock returned to inventory)' : ''}`,
          },
        ],
        { session }
      );
      await m.SheetSyncLog.create([{ sheetName: 'SALES REGISTER', orderId: id, event: `Status updated to ${newStatus}` }], { session });
    });

    if (releasesStock) revalidateCatalog();
    const order = (await m.Order.findById(id))!;

    const trackingAdded = trackingNumber !== existing.trackingNumber || courier !== existing.courier;
    if ((statusChanged && NOTIFY_STATUSES.includes(newStatus)) || (trackingAdded && newStatus === 'Shipped')) {
      await sendOrderStatusEmail(order);
    }

    return NextResponse.json(order);
  } catch (err) {
    return serverError(err);
  }
}
