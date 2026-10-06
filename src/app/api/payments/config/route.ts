import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { razorpayConfigured } from '@/lib/payments';
import { serverError } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

/** Tells the checkout which payment options are really available. */
export async function GET() {
  try {
    const settings = await prisma.siteSettings.findUnique({ where: { id: 'singleton' } });
    return NextResponse.json({
      online: razorpayConfigured(),
      cod: settings ? settings.codEnabled : true,
    });
  } catch (err) {
    return serverError(err);
  }
}
