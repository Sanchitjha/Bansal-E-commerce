import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import crypto from 'crypto';
import { badRequest, requireAdmin, serverError, unauthorized } from '@/lib/api-helpers';

const MAX_BYTES = 4 * 1024 * 1024; // stays under the serverless request-body limit
const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };

const configured = () => !!process.env.BLOB_READ_WRITE_TOKEN;

export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) return unauthorized();
  return NextResponse.json({ enabled: configured() });
}

export async function POST(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) return unauthorized();

  if (!configured()) {
    return NextResponse.json(
      { error: 'Image upload is not set up yet. Paste an image link instead, or connect Vercel Blob storage.' },
      { status: 501 }
    );
  }

  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return badRequest('No file received.');

    const ext = TYPES[file.type];
    if (!ext) return badRequest('Only JPG, PNG, WebP or GIF images are allowed.');
    if (file.size > MAX_BYTES) return badRequest('Image is too large. Please keep it under 4 MB.');

    const blob = await put(`products/${crypto.randomBytes(8).toString('hex')}.${ext}`, file, {
      access: 'public',
      contentType: file.type,
    });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    return serverError(err);
  }
}
