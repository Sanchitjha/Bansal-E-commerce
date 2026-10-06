import { NextRequest, NextResponse } from 'next/server';
import { revalidateCatalog } from '@/lib/data';
import { db } from '@/lib/models';
import { isDuplicateKey } from '@/lib/db';
import { badRequest, notFound, requireAdmin, serverError, unauthorized } from '@/lib/api-helpers';
import { parseProductInput } from '@/lib/product-input';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { Product } = await db();
    const product = await Product.findById(id);
    // Hidden products stay hidden from the public API.
    if (!product || (product.status !== 'active' && !requireAdmin(request))) return notFound('Product not found');
    return NextResponse.json(product);
  } catch (err) {
    return serverError(err);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const { id } = await params;
    const { Product, ActivityLog } = await db();

    const parsed = parseProductInput(await request.json(), true);
    if ('error' in parsed) return badRequest(parsed.error);

    const product = await Product.findById(id);
    if (!product) return notFound('Product not found');

    const finalMrp = (parsed.data.mrp as number | undefined) ?? product.mrp;
    const finalPrice = (parsed.data.sellingPrice as number | undefined) ?? product.sellingPrice;
    if (finalPrice > finalMrp) return badRequest('Selling price cannot be higher than MRP.');

    product.set(parsed.data);
    await product.save();

    await ActivityLog.create({ adminName: admin.name, action: 'Updated Product', details: `Edited ${product.name} (SKU: ${product.sku})` });

    revalidateCatalog();
    return NextResponse.json(product);
  } catch (err) {
    if (isDuplicateKey(err)) return badRequest('A product with that SKU or URL slug already exists.');
    return serverError(err);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const { id } = await params;
    const { Product, ActivityLog, Review } = await db();
    const existing = await Product.findByIdAndDelete(id);
    if (!existing) return notFound('Product not found');

    await Review.deleteMany({ productId: id });
    await ActivityLog.create({ adminName: admin.name, action: 'Deleted Product', details: `Removed ${existing.name}` });

    revalidateCatalog();
    return NextResponse.json({ success: true });
  } catch (err) {
    return serverError(err);
  }
}
