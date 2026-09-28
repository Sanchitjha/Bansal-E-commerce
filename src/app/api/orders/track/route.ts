import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { badRequest, serverError } from '@/lib/api-helpers';

/**
 * Public order lookup for guest tracking. Requires the exact order id (shared via the
 * order confirmation) rather than allowing lookup by phone alone, which would let any
 * visitor enumerate other customers' orders and PII.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id')?.trim();
    const phone = searchParams.get('phone')?.trim();

    if (!id) return badRequest('id is required');

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return NextResponse.json({ order: null });

    if (phone && !order.phone.includes(phone)) {
      return NextResponse.json({ order: null });
    }

    return NextResponse.json({ order });
  } catch (err) {
    return serverError(err);
  }
}
