import { NextRequest, NextResponse } from 'next/server';
import { revalidateCatalog } from '@/lib/data';
import { db } from '@/lib/models';
import { withTransaction } from '@/lib/db';
import { badRequest, requireAdmin, serverError, unauthorized } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const admin = requireAdmin(request);
    const { HeroBanner } = await db();
    return NextResponse.json(await HeroBanner.find(admin ? {} : { isActive: true }).sort({ priority: 1 }));
  } catch (err) {
    return serverError(err);
  }
}

const text = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);

/** Replaces the full banner set in one step. */
export async function PUT(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const body = await request.json();
    if (!Array.isArray(body)) return badRequest('Body must be an array of banners');
    if (body.length > 20) return badRequest('Please keep it to 20 banners or fewer.');

    const banners = body.map((b: Record<string, unknown>, i: number) => ({
      title: text(b.title, 120),
      subtitle: text(b.subtitle, 300),
      badge: text(b.badge, 60),
      discountTag: text(b.discountTag, 60),
      buttonText: text(b.buttonText, 40) || 'ORDER NOW',
      destinationUrl: text(b.destinationUrl, 200) || '/',
      imageUrl: text(b.imageUrl, 1000),
      priority: i + 1,
      isActive: b.isActive !== false,
      productId: b.productId ? text(b.productId, 60) : null,
    }));
    if (banners.some((b) => !b.title || !b.imageUrl)) return badRequest('Every banner needs a headline and an image.');

    const { HeroBanner, ActivityLog } = await db();
    await withTransaction(async (session) => {
      await HeroBanner.deleteMany({}, { session });
      if (banners.length > 0) await HeroBanner.insertMany(banners, { session });
    });

    await ActivityLog.create({ adminName: admin.name, action: 'Updated Hero Banners', details: 'Reordered / updated hero carousel slides' });

    revalidateCatalog();
    return NextResponse.json(await HeroBanner.find().sort({ priority: 1 }));
  } catch (err) {
    return serverError(err);
  }
}
