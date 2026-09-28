import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';
import { unauthorized } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  const admin = getAdminFromRequest(request);
  if (!admin) return unauthorized();
  return NextResponse.json({ id: admin.sub, email: admin.email, name: admin.name });
}
