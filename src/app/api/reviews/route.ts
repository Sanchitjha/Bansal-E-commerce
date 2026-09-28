import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { badRequest, notFound, serverError } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    const reviews = await prisma.review.findMany({
      where: productId ? { productId } : undefined,
      orderBy: { date: 'desc' },
    });
    return NextResponse.json(reviews);
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const required = ['productId', 'author', 'location', 'rating', 'title', 'content'];
    for (const field of required) {
      if (!body[field]) return badRequest(`Missing required field: ${field}`);
    }
    const rating = Number(body.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) return badRequest('rating must be between 1 and 5');

    const product = await prisma.product.findUnique({ where: { id: body.productId } });
    if (!product) return notFound('Product not found');

    const [review] = await prisma.$transaction([
      prisma.review.create({
        data: {
          productId: body.productId,
          author: body.author,
          location: body.location,
          rating,
          title: body.title,
          content: body.content,
          verified: true,
        },
      }),
      prisma.product.update({
        where: { id: body.productId },
        data: {
          reviewsCount: { increment: 1 },
          rating: Math.round(((product.rating * product.reviewsCount + rating) / (product.reviewsCount + 1)) * 10) / 10,
        },
      }),
    ]);

    return NextResponse.json(review, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}
