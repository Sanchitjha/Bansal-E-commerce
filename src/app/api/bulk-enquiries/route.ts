import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/models';
import { badRequest, requireAdmin, serverError, unauthorized } from '@/lib/api-helpers';
import { isValidEmail, normalizeIndianMobile } from '@/lib/india';

export async function GET(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const { BulkEnquiry } = await db();
    return NextResponse.json(await BulkEnquiry.find().sort({ createdAt: -1 }));
  } catch (err) {
    return serverError(err);
  }
}

const clean = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = clean(body.name, 100);
    const productName = clean(body.productName, 200);
    const email = clean(body.email, 254);
    const mobile = normalizeIndianMobile(String(body.mobile ?? ''));
    const quantity = Number(body.quantity);

    if (!name) return badRequest('Please enter your name.');
    if (!mobile) return badRequest('Please enter a valid 10-digit Indian mobile number.');
    if (!isValidEmail(email)) return badRequest('Please enter a valid email address.');
    if (!productName) return badRequest('Please choose a product.');
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1_000_000) return badRequest('Please enter a valid quantity.');

    const company = clean(body.company, 120);
    const { BulkEnquiry, ActivityLog } = await db();
    const enquiry = await BulkEnquiry.create({
      name,
      company,
      mobile,
      email,
      productName,
      quantity,
      expectedDate: clean(body.expectedDate, 20),
      message: clean(body.message, 2000),
      status: 'New',
    });

    await ActivityLog.create({
      adminName: 'Storefront',
      action: 'Received Bulk Quote Request',
      details: `${company || name} requested ${quantity} units of ${productName}`,
    });

    return NextResponse.json(enquiry, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}
