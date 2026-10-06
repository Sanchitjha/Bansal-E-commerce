import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/models';
import { badRequest, notFound, serverError } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    const { Review } = await db();
    return NextResponse.json(await Review.find(productId ? { productId } : {}).sort({ date: -1 }).limit(200));
  } catch (err) {
    return serverError(err);
  }
}

const clean = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const author = clean(body.author, 80);
    const location = clean(body.location, 80);
    const title = clean(body.title, 120);
    const content = clean(body.content, 2000);
    const rating = Number(body.rating);
    if (!body.productId || !author || !title || !content) return badRequest('Please fill in your name, a headline and your review.');
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return badRequest('rating must be a whole number between 1 and 5');

    const { Product, Review } = await db();
    const product = await Product.findById(String(body.productId));
    if (!product) return notFound('Product not found');

    const review = await Review.create({ productId: product._id, author, location, rating, title, content, verified: true });

    // Recompute the average from the stored count so concurrent reviews can't drift it.
    const newCount = product.reviewsCount + 1;
    await Product.updateOne(
      { _id: product._id },
      { $set: { reviewsCount: newCount, rating: Math.round(((product.rating * product.reviewsCount + rating) / newCount) * 10) / 10 } }
    );

    return NextResponse.json(review, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}
