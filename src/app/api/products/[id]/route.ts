import { NextRequest, NextResponse } from 'next/server';
import { revalidateCatalog } from '@/lib/data';
import { prisma } from '@/lib/prisma';
import { badRequest, notFound, requireAdmin, serverError, unauthorized } from '@/lib/api-helpers';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return notFound('Product not found');
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
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return notFound('Product not found');

    const body = await request.json();
    const { id: _ignoredId, createdAt: _ignoredCreatedAt, ...updatable } = body;

    const product = await prisma.product.update({
      where: { id },
      data: updatable,
    });

    await prisma.activityLog.create({
      data: { adminName: admin.name, action: 'Updated Product', details: `Edited ${product.name} (SKU: ${product.sku})` },
    });

    revalidateCatalog();
    return NextResponse.json(product);
  } catch (err: unknown) {
    if (typeof err === 'object' && err && 'code' in err && (err as { code?: string }).code === 'P2002') {
      return badRequest('A product with that SKU or URL slug already exists.');
    }
    return serverError(err);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const { id } = await params;
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return notFound('Product not found');

    await prisma.product.delete({ where: { id } });

    await prisma.activityLog.create({
      data: { adminName: admin.name, action: 'Deleted Product', details: `Removed ${existing.name}` },
    });

    revalidateCatalog();
    return NextResponse.json({ success: true });
  } catch (err) {
    return serverError(err);
  }
}
