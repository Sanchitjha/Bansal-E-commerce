import { NextRequest, NextResponse } from 'next/server';
import { revalidateCatalog } from '@/lib/data';
import { db } from '@/lib/models';
import { badRequest, notFound, requireAdmin, serverError, unauthorized } from '@/lib/api-helpers';

export async function POST(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const body = await request.json();
    const { productId, qtyChange } = body;
    const reason = String(body.reason ?? '').trim().slice(0, 200);
    if (!productId || typeof productId !== 'string') return badRequest('productId is required');
    if (!Number.isInteger(qtyChange) || qtyChange === 0) return badRequest('qtyChange must be a non-zero whole number');

    const { Product, ActivityLog } = await db();

    // Removing stock only matches while enough remains, so two admins can't push it below zero.
    const filter = qtyChange < 0 ? { _id: productId, stock: { $gte: -qtyChange } } : { _id: productId };
    const product = await Product.findOneAndUpdate(filter, { $inc: { stock: qtyChange } }, { new: true });
    if (!product) {
      return (await Product.exists({ _id: productId })) ? badRequest('Not enough stock to remove that many units.') : notFound('Product not found');
    }

    await ActivityLog.create({
      adminName: admin.name,
      action: 'Inventory Stock Adjustment',
      details: `${product.name}: ${qtyChange > 0 ? '+' : ''}${qtyChange} units (${reason || 'No reason given'})`,
    });

    revalidateCatalog();
    return NextResponse.json(product);
  } catch (err) {
    return serverError(err);
  }
}
