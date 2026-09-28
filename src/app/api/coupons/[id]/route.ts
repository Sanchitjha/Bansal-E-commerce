import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notFound, requireAdmin, serverError, unauthorized } from '@/lib/api-helpers';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const { id } = await params;
    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) return notFound('Coupon not found');

    const body = await request.json();
    const { id: _ignored, code, ...rest } = body;
    const coupon = await prisma.coupon.update({
      where: { id },
      data: { ...rest, code: code ? String(code).trim().toUpperCase() : existing.code },
    });

    await prisma.activityLog.create({
      data: { adminName: admin.name, action: 'Saved Coupon Code', details: `Code: ${coupon.code}` },
    });

    return NextResponse.json(coupon);
  } catch (err) {
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
