import { db } from './models';

/**
 * A product's star rating and review count are kept as running totals. Adding or removing one review
 * adjusts them in a single update, so two reviews arriving together cannot overwrite each other.
 */
export async function addToProductRating(productId: string, rating: number): Promise<void> {
  const { Product } = await db();
  const product = await Product.findById(productId);
  if (!product) return;
  const count = product.reviewsCount + 1;
  const average = Math.round(((product.rating * product.reviewsCount + rating) / count) * 10) / 10;
  await Product.updateOne({ _id: productId }, { $set: { reviewsCount: count, rating: average } });
}

export async function removeFromProductRating(productId: string, rating: number): Promise<void> {
  const { Product } = await db();
  const product = await Product.findById(productId);
  if (!product || product.reviewsCount <= 0) return;
  const count = product.reviewsCount - 1;
  const average = count === 0 ? 0 : Math.round((Math.max(product.rating * product.reviewsCount - rating, 0) / count) * 10) / 10;
  await Product.updateOne({ _id: productId }, { $set: { reviewsCount: count, rating: average } });
}
