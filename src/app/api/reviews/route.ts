import { NextRequest, NextResponse } from 'next/server';
import { revalidateCatalog } from '@/lib/data';
import { db } from '@/lib/models';
import { badRequest, notFound, requireAdmin, serverError } from '@/lib/api-helpers';
import { normalizeIndianMobile } from '@/lib/india';
import { clearFailures, clientIp, lockSecondsRemaining, lockedMessage, recordFailure } from '@/lib/rate-limit';
import { addToProductRating } from '@/lib/review-stats';

export const dynamic = 'force-dynamic';

/**
 * Visitors only get approved reviews. The admin can ask for `?status=pending` or `?status=all`
 * (and then also sees which order a review was matched to).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const admin = requireAdmin(request);
    const wanted = admin ? searchParams.get('status') : null;

    const filter: Record<string, unknown> = productId ? { productId } : {};
    if (wanted === 'pending') filter.status = 'pending';
    else if (wanted !== 'all') filter.status = { $ne: 'pending' };

    const { Review } = await db();
    const query = Review.find(filter).sort({ date: -1 }).limit(200);
    return NextResponse.json(await (admin ? query : query.select('-orderId')));
  } catch (err) {
    return serverError(err);
  }
}

const clean = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);

/** Orders in these states are not a completed purchase, so they cannot earn the Verified Buyer badge. */
const NOT_A_PURCHASE = ['Cancelled', 'Refunded', 'Returned', 'Pending Payment'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const author = clean(body.author, 80);
    const location = clean(body.location, 80);
    const title = clean(body.title, 120);
    const content = clean(body.content, 2000);
    const rating = Number(body.rating);
    const orderId = clean(body.orderId, 40).toUpperCase();
    const phoneInput = clean(body.phone, 30);

    if (!body.productId || !author || !title || !content) return badRequest('Please fill in your name, a headline and your review.');
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return badRequest('rating must be a whole number between 1 and 5');

    const ip = clientIp(request);

    // Posting reviews is limited per IP, so the shop cannot be flooded.
    const postKeys = [`review-post:${ip}`];
    const postLocked = await lockSecondsRemaining(postKeys);
    if (postLocked > 0) return NextResponse.json({ error: lockedMessage(postLocked) }, { status: 429 });
    await recordFailure(postKeys);

    const { Product, Review, Order } = await db();
    const product = await Product.findById(String(body.productId));
    if (!product) return notFound('Product not found');

    // A review only gets the "Verified Buyer" badge when it is matched to a real purchase of this product.
    let verified = false;
    let matchedOrder: string | null = null;
    if (orderId || phoneInput) {
      const phone = normalizeIndianMobile(phoneInput);
      if (!orderId || !phone) {
        return badRequest('For a Verified Buyer badge, enter both your order ID and the phone number used for the order. Or leave both empty and we will check your review before it appears.');
      }

      const verifyKeys = [`review-verify:${ip}`];
      const verifyLocked = await lockSecondsRemaining(verifyKeys);
      if (verifyLocked > 0) return NextResponse.json({ error: lockedMessage(verifyLocked) }, { status: 429 });

      const order = await Order.findById(orderId);
      const items = (order?.items ?? []) as { productId?: string }[];
      const matches =
        !!order &&
        normalizeIndianMobile(order.phone) === phone &&
        items.some((i) => i.productId === product._id) &&
        !NOT_A_PURCHASE.includes(order.orderStatus);

      if (!matches) {
        await recordFailure(verifyKeys);
        return badRequest('We could not match that order ID and phone number to a purchase of this product. Please check them, or leave both empty.');
      }
      await clearFailures(verifyKeys);

      if (await Review.exists({ productId: product._id, orderId })) {
        return badRequest('You have already reviewed this product for this order.');
      }
      verified = true;
      matchedOrder = orderId;
    }

    const status = verified ? 'approved' : 'pending';
    const review = await Review.create({ productId: product._id, author, location, rating, title, content, verified, status, orderId: matchedOrder });

    if (status === 'approved') {
      await addToProductRating(product._id, rating);
      revalidateCatalog();
    }

    // The order link stays private: the visitor only learns whether it was verified and published.
    const { orderId: _private, ...publicReview } = review.toJSON() as unknown as Record<string, unknown>;
    return NextResponse.json(publicReview, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}
