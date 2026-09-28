import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { badRequest, requireAdmin, serverError, unauthorized } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const admin = requireAdmin(request);
    const banners = await prisma.heroBanner.findMany({
      where: admin ? undefined : { isActive: true },
      orderBy: { priority: 'asc' },
    });
    return NextResponse.json(banners);
  } catch (err) {
    return serverError(err);
  }
}

/** Replaces the full banner set — mirrors LuminaryContext's updateHeroBanners. */
export async function PUT(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const body = await request.json();
    if (!Array.isArray(body)) return badRequest('Body must be an array of banners');

    const banners = await prisma.$transaction(async (tx) => {
      await tx.heroBanner.deleteMany({});
      if (body.length === 0) return [];
      await tx.heroBanner.createMany({
        data: body.map((b: any) => ({
          title: b.title,
          subtitle: b.subtitle,
          badge: b.badge,
          discountTag: b.discountTag,
          buttonText: b.buttonText,
          destinationUrl: b.destinationUrl,
          imageUrl: b.imageUrl,
          priority: b.priority,
          isActive: b.isActive ?? true,
          productId: b.productId ?? null,
        })),
      });
      return tx.heroBanner.findMany({ orderBy: { priority: 'asc' } });
    });

    await prisma.activityLog.create({
      data: { adminName: admin.name, action: 'Updated Hero Banners', details: 'Reordered / updated hero carousel slides' },
    });

    return NextResponse.json(banners);
  } catch (err) {
    return serverError(err);
  }
}
