import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { badRequest, requireAdmin, serverError, unauthorized } from '@/lib/api-helpers';
import { COUPON_TYPES, isOneOf } from '@/lib/validators';

export async function GET(request: NextRequest) {
  try {
    const admin = requireAdmin(request);
    const coupons = await prisma.coupon.findMany({
      where: admin ? undefined : { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(coupons);
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const body = await request.json();
    if (!body.code || typeof body.code !== 'string') return badRequest('code is required');
    if (!isOneOf(COUPON_TYPES, body.type)) return badRequest(`Invalid coupon type: ${body.type}`);
    if (typeof body.value !== 'number') return badRequest('value must be a number');

    const coupon = await prisma.coupon.create({
      data: {
        code: body.code.trim().toUpperCase(),
        type: body.type,
        value: body.value,
        minOrderValue: body.minOrderValue ?? 0,
        maxDiscount: body.maxDiscount ?? null,
        firstOrderOnly: !!body.firstOrderOnly,
        categorySpecific: body.categorySpecific ?? null,
        isActive: body.isActive ?? true,
      },
    });

    await prisma.activityLog.create({
      data: { adminName: admin.name, action: 'Saved Coupon Code', details: `Code: ${coupon.code}` },
    });

    return NextResponse.json(coupon, { status: 201 });
  } catch (err: unknown) {
    if (typeof err === 'object' && err && 'code' in err && (err as { code?: string }).code === 'P2002') {
      return badRequest('A coupon with that code already exists.');
    }
    return serverError(err);
  }
}
