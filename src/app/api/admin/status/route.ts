import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, unauthorized } from '@/lib/api-helpers';
import { emailConfigured, emailSandbox } from '@/lib/email';
import { cloudinaryConfigured } from '@/lib/cloudinary';
import { razorpayConfigured } from '@/lib/payments';
import { siteUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';

/** Which integrations are connected. Reports only yes/no, never the secret values. */
export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) return unauthorized();
  return NextResponse.json({
    razorpay: razorpayConfigured(),
    razorpayWebhook: !!process.env.RAZORPAY_WEBHOOK_SECRET,
    email: emailConfigured(),
    emailSandbox: emailConfigured() && emailSandbox(),
    mediaUpload: cloudinaryConfigured(),
    database: !!process.env.MONGODB_URI,
    siteUrl: siteUrl(),
  });
}
