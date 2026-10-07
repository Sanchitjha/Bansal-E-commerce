import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/models';
import { requireAdmin, serverError, unauthorized } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit')) || 100, 500);

    const { ActivityLog } = await db();
    return NextResponse.json(await ActivityLog.find().sort({ timestamp: -1 }).limit(limit));
  } catch (err) {
    return serverError(err);
  }
}
