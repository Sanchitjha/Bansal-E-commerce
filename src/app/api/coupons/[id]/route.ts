import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { badRequest, notFound, requireAdmin, serverError, unauthorized } from '@/lib/api-helpers';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const { id } = await params;
    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) return notFound('Coupon not found');

    const body = await request.json();
    const type = body.type === 'flat' || body.type === 'percentage' ? body.type : existing.type;
    const value = Number(body.value);
    if (!(value > 0) || (type === 'percentage' && value > 100)) return badRequest('Discount value is not valid.');

    // The admin form always sends the full coupon, so a missing optional field means "clear it".
    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        code: body.code ? String(body.code).trim().toUpperCase() : existing.code,
        type,
        value,
        minOrderValue: Math.max(0, Number(body.minOrderValue) || 0),
        maxDiscount: body.maxDiscount ? Number(body.maxDiscount) : null,
        categorySpecific: body.categorySpecific || null,
        firstOrderOnly: !!body.firstOrderOnly,
        isActive: body.isActive ?? existing.isActive,
      },
    });

    await prisma.activityLog.create({
      data: { adminName: admin.name, action: 'Saved Coupon Code', details: `Code: ${coupon.code}` },
    });

    return NextResponse.json(coupon);
  } catch (err) {
    if ((err as { code?: string })?.code === 'P2002') return badRequest('A coupon with that code already exists.');
    return serverError(err);
  }
}

/** Toggles isActive — mirrors LuminaryContext's toggleCouponStatus. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const { id } = await params;
    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) return notFound('Coupon not found');

    const coupon = await prisma.coupon.update({ where: { id }, data: { isActive: !existing.isActive } });
    return NextResponse.json(coupon);
  } catch (err) {
    return serverError(err);
  }
}
