import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/models';
import { isDuplicateKey } from '@/lib/db';
import { badRequest, notFound, requireAdmin, serverError, unauthorized } from '@/lib/api-helpers';
import { CATEGORY_TYPES, isOneOf } from '@/lib/validators';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const { id } = await params;
    const { Coupon, ActivityLog } = await db();
    const existing = await Coupon.findById(id);
    if (!existing) return notFound('Coupon not found');

    const body = await request.json();
    const type = body.type === 'flat' || body.type === 'percentage' ? body.type : existing.type;
    const value = Number(body.value);
    if (!(value > 0) || (type === 'percentage' && value > 100)) return badRequest('Discount value is not valid.');
    if (body.categorySpecific && !isOneOf(CATEGORY_TYPES, body.categorySpecific)) return badRequest('Invalid category.');

    // The admin form always sends the full coupon, so a missing optional field means "clear it".
    existing.set({
      code: body.code ? String(body.code).trim().toUpperCase() : existing.code,
      type,
      value,
      minOrderValue: Math.max(0, Number(body.minOrderValue) || 0),
      maxDiscount: body.maxDiscount ? Number(body.maxDiscount) : null,
      categorySpecific: body.categorySpecific || null,
      firstOrderOnly: !!body.firstOrderOnly,
      isActive: body.isActive ?? existing.isActive,
    });
    await existing.save();

    await ActivityLog.create({ adminName: admin.name, action: 'Saved Coupon Code', details: `Code: ${existing.code}` });
    return NextResponse.json(existing);
  } catch (err) {
    if (isDuplicateKey(err)) return badRequest('A coupon with that code already exists.');
    return serverError(err);
  }
}

/** Toggles isActive. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const { id } = await params;
    const { Coupon } = await db();
    const existing = await Coupon.findById(id);
    if (!existing) return notFound('Coupon not found');

    existing.isActive = !existing.isActive;
    await existing.save();
    return NextResponse.json(existing);
  } catch (err) {
    return serverError(err);
  }
}
