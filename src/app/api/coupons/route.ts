import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/models';
import { isDuplicateKey } from '@/lib/db';
import { badRequest, requireAdmin, serverError, unauthorized } from '@/lib/api-helpers';
import { CATEGORY_TYPES, COUPON_TYPES, isOneOf } from '@/lib/validators';

export async function GET(request: NextRequest) {
  // Codes are checked on the server at checkout, so the list is never needed by customers.
  if (!requireAdmin(request)) return unauthorized();

  try {
    const { Coupon } = await db();
    return NextResponse.json(await Coupon.find().sort({ createdAt: -1 }));
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const body = await request.json();
    const code = String(body.code ?? '').trim().toUpperCase();
    const value = Number(body.value);
    if (!/^[A-Z0-9_-]{3,20}$/.test(code)) return badRequest('Code must be 3-20 letters or numbers.');
    if (!isOneOf(COUPON_TYPES, body.type)) return badRequest(`Invalid coupon type: ${body.type}`);
    if (!(value > 0) || (body.type === 'percentage' && value > 100)) return badRequest('Discount value is not valid.');
    if (body.categorySpecific && !isOneOf(CATEGORY_TYPES, body.categorySpecific)) return badRequest('Invalid category.');

    const { Coupon, ActivityLog } = await db();
    const coupon = await Coupon.create({
      code,
      type: body.type,
      value,
      minOrderValue: Math.max(0, Number(body.minOrderValue) || 0),
      maxDiscount: body.maxDiscount ? Number(body.maxDiscount) : null,
      firstOrderOnly: !!body.firstOrderOnly,
      categorySpecific: body.categorySpecific || null,
      isActive: body.isActive ?? true,
    });

    await ActivityLog.create({ adminName: admin.name, action: 'Saved Coupon Code', details: `Code: ${coupon.code}` });
    return NextResponse.json(coupon, { status: 201 });
  } catch (err) {
    if (isDuplicateKey(err)) return badRequest('A coupon with that code already exists.');
    return serverError(err);
  }
}
