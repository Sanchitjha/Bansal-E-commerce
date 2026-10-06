import { NextRequest, NextResponse } from 'next/server';
import { revalidateCatalog } from '@/lib/data';
import { prisma } from '@/lib/prisma';
import { badRequest, notFound, requireAdmin, serverError, unauthorized } from '@/lib/api-helpers';

export async function POST(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const body = await request.json();
    const { productId, qtyChange, reason } = body;
    if (!productId) return badRequest('productId is required');
    if (!Number.isFinite(qtyChange) || qtyChange === 0) return badRequest('qtyChange must be a non-zero number');

    const existing = await prisma.product.findUnique({ where: { id: productId } });
    if (!existing) return notFound('Product not found');

    const product = await prisma.product.update({
      where: { id: productId },
      data: { stock: Math.max(0, existing.stock + qtyChange) },
    });

    await prisma.activityLog.create({
      data: {
        adminName: admin.name,
        action: 'Inventory Stock Adjustment',
        details: `${existing.name}: ${qtyChange > 0 ? '+' : ''}${qtyChange} units (${reason ?? 'No reason given'})`,
      },
    });

    revalidateCatalog();
    return NextResponse.json(product);
  } catch (err) {
    return serverError(err);
  }
}
