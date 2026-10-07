import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/models';
import { serverError } from '@/lib/api-helpers';
import { canonicalState } from '@/lib/india';
import { estimateDelivery, isPincodeBlocked, lookupPincode } from '@/lib/pincode';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const pincode = code.trim();

    const { SiteSettings } = await db();
    const [info, settings] = await Promise.all([lookupPincode(pincode), SiteSettings.findById('singleton').lean()]);

    if (!info.valid) {
      return NextResponse.json({ valid: false, available: false, cod: false, message: 'This is not a valid Indian pincode.' });
    }

    const state = info.state ? canonicalState(info.state) ?? info.state : undefined;
    const blocked = isPincodeBlocked(pincode, settings?.blockedPincodes ?? '');

    return NextResponse.json({
      valid: true,
      unverified: info.unverified,
      available: !blocked,
      city: info.city,
      state,
      estimatedDays: blocked ? 'N/A' : estimateDelivery(state, settings?.sellerState ?? 'Maharashtra', pincode),
      cod: !blocked && (settings ? settings.codEnabled : true),
      message: blocked ? 'Sorry, we do not deliver to this pincode yet.' : undefined,
    });
  } catch (err) {
    return serverError(err);
  }
}
