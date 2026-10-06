import { NextResponse } from 'next/server';
import { db } from '@/lib/models';
import { razorpayConfigured } from '@/lib/payments';
import { serverError } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

/** Tells the checkout which payment options are really available. */
export async function GET() {
  try {
    const { SiteSettings } = await db();
    const settings = await SiteSettings.findById('singleton').lean();
    return NextResponse.json({
      online: razorpayConfigured(),
      cod: settings ? settings.codEnabled : true,
    });
  } catch (err) {
    return serverError(err);
  }
}
