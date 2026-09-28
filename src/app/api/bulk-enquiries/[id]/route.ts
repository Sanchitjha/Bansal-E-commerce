import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { badRequest, notFound, requireAdmin, serverError, unauthorized } from '@/lib/api-helpers';
import { BULK_ENQUIRY_STATUSES, isOneOf } from '@/lib/validators';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const { id } = await params;
    const existing = await prisma.bulkEnquiry.findUnique({ where: { id } });
    if (!existing) return notFound('Enquiry not found');

    const body = await request.json();
    if (!isOneOf(BULK_ENQUIRY_STATUSES, body.status)) return badRequest(`Invalid status: ${body.status}`);

    const enquiry = await prisma.bulkEnquiry.update({ where: { id }, data: { status: body.status } });

    await prisma.activityLog.create({
      data: { adminName: admin.name, action: 'Updated Bulk Enquiry Status', details: `Enquiry ${id} set to ${body.status}` },
    });

    return NextResponse.json(enquiry);
  } catch (err) {
    return serverError(err);
  }
}
