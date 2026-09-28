import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, serverError, unauthorized } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit')) || 100, 500);

    const logs = await prisma.sheetSyncLog.findMany({ orderBy: { timestamp: 'desc' }, take: limit });
    return NextResponse.json(logs);
  } catch (err) {
    return serverError(err);
  }
}
