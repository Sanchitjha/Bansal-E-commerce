import { revalidateTag, unstable_cache } from 'next/cache';
import { db, plain } from './models';
import type { CreatorVideo, HeroBanner, Product, SiteSettings } from '@/types';

export interface Catalog {
  products: Product[];
  heroBanners: HeroBanner[];
  creatorVideos: CreatorVideo[];
  settings: SiteSettings | null;
}

/** A dropped connection at build or cold start is brief; retry rather than fail the whole page. */
async function withRetry<T>(fn: () => Promise<T>, attempts = 4): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      await new Promise((resolve) => setTimeout(resolve, 400 * (i + 1) ** 2));
    }
  }
  throw lastError;
}

/**
 * Storefront data rendered into the HTML (so search engines see products) and handed to the client
 * as its starting state. Cached briefly; admin changes call revalidateCatalog() to refresh it at once.
 */
export const getCatalog = unstable_cache(
  async (): Promise<Catalog> => {
    const { Product, HeroBanner, CreatorVideo, SiteSettings } = await db();
    const [products, heroBanners, creatorVideos, settings] = await withRetry(() =>
      Promise.all([
        Product.find({ status: 'active' }).sort({ priorityOrder: 1, createdAt: -1 }),
        HeroBanner.find({ isActive: true }).sort({ priority: 1 }),
        CreatorVideo.find({ isActive: true }).sort({ priority: 1 }),
        SiteSettings.findById('singleton'),
      ])
    );
    return plain<Catalog>({ products, heroBanners, creatorVideos, settings });
  },
  // Change the version number whenever the catalog is edited outside the admin panel (a script or the
  // database), so a new deploy does not keep serving the previously cached copy.
  ['storefront-catalog-v5'],
  { tags: ['catalog'], revalidate: 300 }
);

export function revalidateCatalog() {
  revalidateTag('catalog');
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { products } = await getCatalog();
  return products.find((p) => p.urlSlug === slug) ?? null;
}
