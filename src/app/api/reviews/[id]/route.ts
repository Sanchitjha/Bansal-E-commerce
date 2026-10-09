import { NextRequest, NextResponse } from 'next/server';
import { revalidateCatalog } from '@/lib/data';
import { db } from '@/lib/models';
import { badRequest, notFound, requireAdmin, serverError, unauthorized } from '@/lib/api-helpers';
import { addToProductRating, removeFromProductRating } from '@/lib/review-stats';

export const dynamic = 'force-dynamic';

/** Admin: approve a review that was waiting for a check. */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = requireAdmin(request);
  if (!admin) return unauthorized();
  try {
    const body = await request.json();
    if (body.status !== 'approved') return badRequest('Only status "approved" can be set.');

    const { Review, ActivityLog } = await db();
    // The status flip is the guard, so approving the same review twice only counts it once.
    const review = await Review.findOneAndUpdate({ _id: params.id, status: 'pending' }, { $set: { status: 'approved' } }, { new: true });
    if (!review) {
      return (await Review.exists({ _id: params.id })) ? NextResponse.json({ ok: true }) : notFound('Review not found');
    }

    await addToProductRating(review.productId, review.rating);
    await ActivityLog.create({ adminName: admin.name, action: 'Approved Review', details: `Review "${review.title}" by ${review.author}` });
    revalidateCatalog();
    return NextResponse.json(review);
  } catch (err) {
    return serverError(err);
  }
}

/** Admin: remove a review (for spam or abuse). */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = requireAdmin(request);
  if (!admin) return unauthorized();
  try {
    const { Review, ActivityLog } = await db();
    const review = await Review.findOneAndDelete({ _id: params.id });
    if (!review) return notFound('Review not found');

    if (review.status !== 'pending') await removeFromProductRating(review.productId, review.rating);
    await ActivityLog.create({ adminName: admin.name, action: 'Deleted Review', details: `Review "${review.title}" by ${review.author}` });
    revalidateCatalog();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
