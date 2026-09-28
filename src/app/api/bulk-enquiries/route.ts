import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { badRequest, requireAdmin, serverError, unauthorized } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const enquiries = await prisma.bulkEnquiry.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(enquiries);
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const required = ['name', 'mobile', 'email', 'productName', 'quantity'];
    for (const field of required) {
      if (!body[field]) return badRequest(`Missing required field: ${field}`);
    }

    const enquiry = await prisma.bulkEnquiry.create({
      data: {
        name: body.name,
        company: body.company ?? '',
        mobile: body.mobile,
        email: body.email,
        productName: body.productName,
        quantity: Number(body.quantity),
        expectedDate: body.expectedDate ?? '',
        message: body.message ?? '',
        status: 'New',
      },
    });

    await prisma.activityLog.create({
      data: {
        adminName: 'Storefront',
        action: 'Received Bulk Quote Request',
        details: `${body.company || body.name} requested ${body.quantity} units of ${body.productName}`,
      },
    });

    return NextResponse.json(enquiry, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}
