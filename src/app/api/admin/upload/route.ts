import { NextRequest, NextResponse } from 'next/server';
import { badRequest, requireAdmin, serverError, unauthorized } from '@/lib/api-helpers';
import { cloudinaryConfigured, signUpload } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) return unauthorized();
  return NextResponse.json({ enabled: cloudinaryConfigured() });
}

/** Returns signed parameters for a direct browser-to-Cloudinary upload. */
export async function POST(request: NextRequest) {
  if (!requireAdmin(request)) return unauthorized();

  if (!cloudinaryConfigured()) {
    return NextResponse.json(
      { error: 'Media upload is not set up yet. Paste a link instead, or add your Cloudinary keys.' },
      { status: 501 }
    );
  }

  try {
    const { resourceType } = await request.json();
    if (resourceType !== 'image' && resourceType !== 'video') return badRequest('resourceType must be image or video.');
    return NextResponse.json(signUpload(resourceType));
  } catch (err) {
    return serverError(err);
  }
}
