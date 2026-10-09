import type { Product } from '@/types';

const newestFirst = (a: Product, b: Product) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

/** Products shown in the "Best Sellers" tab (falls back to the first products if none are marked). */
export function homeBestSellers(products: Product[], limit = 4): Product[] {
  const marked = products.filter((p) => p.isBestSeller).sort((a, b) => b.reviewsCount - a.reviewsCount);
  return (marked.length > 0 ? marked : products).slice(0, limit);
}

/** Products shown in the "New Arrivals" tab. */
export function homeNewArrivals(products: Product[], limit = 4): Product[] {
  return products.filter((p) => p.isNewArrival).sort(newestFirst).slice(0, limit);
}
