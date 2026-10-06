import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/models';
import { badRequest, notFound, requireAdmin, serverError, unauthorized } from '@/lib/api-helpers';
import { BULK_ENQUIRY_STATUSES, isOneOf } from '@/lib/validators';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const { id } = await params;
    const body = await request.json();
    if (!isOneOf(BULK_ENQUIRY_STATUSES, body.status)) return badRequest(`Invalid status: ${body.status}`);

    const { BulkEnquiry, ActivityLog } = await db();
    const enquiry = await BulkEnquiry.findByIdAndUpdate(id, { $set: { status: body.status } }, { new: true });
    if (!enquiry) return notFound('Enquiry not found');

    await ActivityLog.create({ adminName: admin.name, action: 'Updated Bulk Enquiry Status', details: `Enquiry ${id} set to ${body.status}` });
    return NextResponse.json(enquiry);
  } catch (err) {
    return serverError(err);
  }
}
