import { revalidateTag, unstable_cache } from 'next/cache';
import { prisma } from './prisma';
import type { HeroBanner, Product, SiteSettings } from '@/types';

export interface Catalog {
  products: Product[];
  heroBanners: HeroBanner[];
  settings: SiteSettings | null;
}

// Dates and Json columns are flattened to plain JSON so server HTML and client state agree exactly.
const plain = <T,>(value: unknown): T => JSON.parse(JSON.stringify(value)) as T;

/**
 * Storefront data rendered into the HTML (so search engines see products) and handed to the client
 * as its starting state. Cached briefly; admin changes call revalidateCatalog() to refresh it at once.
 */
export const getCatalog = unstable_cache(
  async (): Promise<Catalog> => {
    const [products, heroBanners, settings] = await Promise.all([
      prisma.product.findMany({ where: { status: 'active' }, orderBy: [{ priorityOrder: 'asc' }, { createdAt: 'desc' }] }),
      prisma.heroBanner.findMany({ where: { isActive: true }, orderBy: { priority: 'asc' } }),
      prisma.siteSettings.findUnique({ where: { id: 'singleton' } }),
    ]);
    return plain<Catalog>({ products, heroBanners, settings });
  },
  ['storefront-catalog-v1'],
  { tags: ['catalog'], revalidate: 300 }
);

export function revalidateCatalog() {
  revalidateTag('catalog');
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { products } = await getCatalog();
  return products.find((p) => p.urlSlug === slug) ?? null;
}
