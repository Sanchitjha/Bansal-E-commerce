import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, serverError, unauthorized } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await prisma.siteSettings.findUnique({ where: { id: 'singleton' } });
    return NextResponse.json(settings);
  } catch (err) {
    return serverError(err);
  }
}

export async function PUT(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const body = await request.json();
    const { id: _ignored, ...rest } = body;

    const settings = await prisma.siteSettings.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', ...rest },
      update: rest,
    });

    await prisma.activityLog.create({
      data: { adminName: admin.name, action: 'Updated Website Settings', details: 'Store settings modified' },
    });

    return NextResponse.json(settings);
  } catch (err) {
    return serverError(err);
  }
}
