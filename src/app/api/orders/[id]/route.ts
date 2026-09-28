import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { badRequest, notFound, requireAdmin, serverError, unauthorized } from '@/lib/api-helpers';
import { ORDER_STATUSES, isOneOf } from '@/lib/validators';

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

    const order = await prisma.order.update({
      where: { id },
      data: {
        orderStatus: body.orderStatus ?? existing.orderStatus,
        courier: body.courier ?? existing.courier,
        trackingNumber: body.trackingNumber ?? existing.trackingNumber,
      },
    });

    await prisma.activityLog.create({
      data: { adminName: admin.name, action: 'Updated Order Status', details: `Order ${id} status set to ${order.orderStatus}` },
    });
    await prisma.sheetSyncLog.create({
      data: { sheetName: 'SALES REGISTER', orderId: id, event: `Status updated to ${order.orderStatus}` },
    });

    return NextResponse.json(order);
  } catch (err) {
    return serverError(err);
  }
}
